"""
Authentication endpoints - Register, Login, Logout, Token refresh
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
)
from app.core.logging import log_audit_event
from app.core.rate_limiter import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin
from app.api.deps import get_current_active_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        Created user data

    Raises:
        HTTPException: If email already exists
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        is_active=True,
        is_verified=False,  # Requires email verification
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log audit event
    log_audit_event(
        user_id=str(new_user.id),
        action="CREATE",
        resource="user",
        details={"email": new_user.email, "role": new_user.role.value},
        success=True,
    )

    return new_user


@router.post("/login", response_model=Token)
@limiter.limit("10/hour")
async def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    """
    Login user and return JWT tokens

    Args:
        form_data: OAuth2 form with username (email) and password
        db: Database session

    Returns:
        Access token and refresh token

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()

    # Verify credentials
    if not user or not verify_password(form_data.password, user.hashed_password):
        log_audit_event(
            user_id="unknown",
            action="LOGIN",
            resource="auth",
            details={"email": form_data.username, "reason": "invalid_credentials"},
            success=False,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        log_audit_event(
            user_id=str(user.id),
            action="LOGIN",
            resource="auth",
            details={"email": user.email, "reason": "inactive_account"},
            success=False,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    # Create tokens
    token_data = {"user_id": user.id, "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Log successful login
    log_audit_event(
        user_id=str(user.id),
        action="LOGIN",
        resource="auth",
        details={"email": user.email},
        success=True,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Get current authenticated user information

    Args:
        current_user: Current active user from JWT token

    Returns:
        Current user data
    """
    return current_user


@router.post("/logout")
async def logout(current_user: Annotated[User, Depends(get_current_active_user)]):
    """
    Logout user (client should delete tokens)

    Args:
        current_user: Current active user from JWT token

    Returns:
        Success message

    Note:
        With JWT, we can't invalidate tokens server-side.
        The client should delete the tokens.
        For production, consider using a token blacklist in Redis.
    """
    log_audit_event(
        user_id=str(current_user.id),
        action="LOGOUT",
        resource="auth",
        details={"email": current_user.email},
        success=True,
    )

    return {"message": "Successfully logged out"}
