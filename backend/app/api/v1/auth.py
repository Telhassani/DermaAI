"""
Authentication endpoints - Register, Login, Logout, Token refresh
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
)
from app.core.logging import log_audit_event
from app.core.rate_limiter import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin
from app.api.deps import get_current_active_user


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str


router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
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


@router.post("/login")
# @limiter.limit("10/hour")  # Disabled temporarily due to dependency injection issue in dev
def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    """
    Login user and return JWT tokens via httpOnly cookies.

    Args:
        form_data: OAuth2 form with username (email) and password
        db: Database session

    Returns:
        Access token and refresh token (set via httpOnly secure cookies)

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()

    # Verify credentials - only call verify_password once
    password_valid = user and verify_password(form_data.password, user.hashed_password)
    if not user or not password_valid:
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
            status_code=status.HTTP_401_UNAUTHORIZED,
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

    # Create response with tokens in httpOnly cookies and in body for compatibility
    response_data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

    response = JSONResponse(content=response_data)

    # Set httpOnly secure cookies (tokens are not accessible via JavaScript)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # Requires HTTPS in production
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # Requires HTTPS in production
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

    return response


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
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


@router.post("/refresh")
@limiter.limit("20/hour")
def refresh_token(
    request: Request,
    token_request: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Refresh an access token using a valid refresh token.

    Accepts refresh token from httpOnly cookie or request body for compatibility.

    Args:
        token_request: RefreshTokenRequest containing the refresh_token
        db: Database session

    Returns:
        New access token and refresh token (set via httpOnly secure cookies)

    Raises:
        HTTPException: If refresh token is invalid or expired
    """
    # Try to get refresh token from cookies first, fallback to request body
    refresh_token_value = request.cookies.get("refresh_token") or token_request.refresh_token

    # Decode the refresh token
    token_data = decode_token(refresh_token_value)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify it's a refresh token (not an access token)
    if not verify_token_type(token_data, "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from token data
    user_id = token_data.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token data",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify user still exists and is active
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new tokens
    new_token_data = {"user_id": user.id, "email": user.email, "role": user.role.value}
    access_token = create_access_token(new_token_data)
    new_refresh_token = create_refresh_token(new_token_data)

    # Log token refresh
    log_audit_event(
        user_id=str(user.id),
        action="REFRESH",
        resource="auth",
        details={"email": user.email},
        success=True,
    )

    # Create response with tokens in httpOnly cookies and in body for compatibility
    response_data = {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }

    response = JSONResponse(content=response_data)

    # Set httpOnly secure cookies (tokens are not accessible via JavaScript)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # Requires HTTPS in production
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,  # Requires HTTPS in production
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

    return response


@router.post("/logout")
def logout(current_user: Annotated[User, Depends(get_current_active_user)]):
    """
    Logout user and clear httpOnly cookies.

    Args:
        current_user: Current active user from JWT token

    Returns:
        Success message with cleared cookies

    Note:
        Clears httpOnly cookies server-side. JWT tokens remain valid until expiration,
        so for production consider implementing a token blacklist in Redis.
    """
    log_audit_event(
        user_id=str(current_user.id),
        action="LOGOUT",
        resource="auth",
        details={"email": current_user.email},
        success=True,
    )

    response = JSONResponse(content={"message": "Successfully logged out"})

    # Clear httpOnly cookies by setting max_age=0
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=0,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=0,
        path="/",
    )

    return response
