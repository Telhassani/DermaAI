"""
API dependencies - Reusable dependencies for routes
"""

from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import TokenData

# OAuth2 scheme for JWT token - set auto_error=False to handle missing token manually
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


async def get_token(
    token: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(None),
    request: Request = None,
) -> Optional[str]:
    """
    Extract JWT token from multiple sources:
    1. Authorization header (Bearer token)
    2. httpOnly cookie (access_token)

    Returns the first found token or None.
    """
    # Priority 1: Authorization header (Bearer token)
    if token:
        return token

    # Priority 2: httpOnly cookie
    if access_token:
        return access_token

    return None


async def get_current_user(
    token: Annotated[Optional[str], Depends(get_token)], db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token

    Args:
        token: JWT access token from Authorization header or httpOnly cookie
        db: Database session

    Returns:
        Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Check if token was provided
    if not token:
        raise credentials_exception

    # Decode token
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception

    # Get user from database
    user_id = token_data.get("user_id")
    if user_id is None:
        raise credentials_exception

    # Cast user_id to integer to ensure type consistency (FIX #3)
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception

    try:
        # Query user by ID
        user = db.query(User).filter(User.id == user_id).first()
    except Exception:
        raise credentials_exception

    # User must exist in database - no fake user objects
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Get current active user (must be active and not deleted)

    Args:
        current_user: Current authenticated user

    Returns:
        Current active user

    Raises:
        HTTPException: If user is inactive or deleted
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    if getattr(current_user, "is_deleted", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User account deleted"
        )
    return current_user


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """
    Get current admin user (must have admin role)

    Args:
        current_user: Current active user

    Returns:
        Current admin user

    Raises:
        HTTPException: If user is not admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin role required.",
        )
    return current_user


async def get_current_doctor(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """
    Get current doctor user (must have doctor or admin role)

    Args:
        current_user: Current active user

    Returns:
        Current doctor user

    Raises:
        HTTPException: If user is not doctor or admin
    """
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Doctor role required.",
        )
    return current_user
