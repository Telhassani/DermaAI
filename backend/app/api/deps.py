"""
API dependencies - Reusable dependencies for routes
Uses Supabase JWT authentication with profiles table
"""

import logging
from typing import Annotated, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

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


def decode_supabase_token(token: str) -> Optional[dict]:
    """
    Decode and verify a Supabase JWT token.

    Args:
        token: JWT token from Supabase

    Returns:
        Decoded token payload or None if invalid
    """
    try:
        logger.debug(f"Attempting to decode token (first 50 chars): {token[:50] if token else 'None'}...")

        # Decode without verification first to inspect the token
        unverified = jwt.get_unverified_claims(token)
        logger.debug(f"Unverified claims decoded successfully: email={unverified.get('email')}, sub={unverified.get('sub')}")

        # Check if it looks like a Supabase token (has 'sub' claim with UUID)
        sub = unverified.get('sub')
        if not sub:
            logger.warning("Token missing 'sub' claim")
            return None

        # In development mode, allow unverified tokens for easier testing
        if settings.ENVIRONMENT == "development":
            logger.info(f"Using unverified Supabase token for user: {unverified.get('email')}")
            return unverified

        # In production, verify the token with JWT secret
        if settings.SUPABASE_JWT_SECRET:
            try:
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience="authenticated"
                )
                logger.info(f"Supabase token verified for: {payload.get('email')}")
                return payload
            except JWTError:
                # Try without audience validation
                try:
                    payload = jwt.decode(
                        token,
                        settings.SUPABASE_JWT_SECRET,
                        algorithms=["HS256"],
                        options={"verify_aud": False}
                    )
                    logger.info(f"Supabase token verified (no aud) for: {payload.get('email')}")
                    return payload
                except JWTError as e:
                    logger.warning(f"Supabase token verification failed: {e}")
                    return None

        return None

    except Exception as e:
        import traceback
        logger.error(f"Error decoding token: {e}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        return None


async def get_current_user(
    token: Annotated[Optional[str], Depends(get_token)], db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from Supabase JWT token.
    Looks up user in the 'profiles' table by their Supabase UUID.

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
        logger.debug("No token provided")
        raise credentials_exception

    # Decode the Supabase token
    payload = decode_supabase_token(token)
    if not payload:
        logger.debug("Failed to decode token")
        raise credentials_exception

    # Get user ID (UUID) from token
    user_uuid_str = payload.get("sub")
    email = payload.get("email")

    if not user_uuid_str:
        logger.debug("Token missing 'sub' claim")
        raise credentials_exception

    try:
        user_uuid = UUID(user_uuid_str)
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid UUID in token: {e}")
        raise credentials_exception

    # Look up user in profiles table by UUID (Supabase primary key)
    try:
        user = db.query(User).filter(User.id == user_uuid).first()

        if not user:
            logger.info(f"User not found in profiles table for UUID: {user_uuid}, email: {email}")
            raise credentials_exception

        logger.debug(f"Found user: {user.email} (role: {user.role})")
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error looking up user: {e}")
        raise credentials_exception


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
