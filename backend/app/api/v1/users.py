"""
User management endpoints - Admin-only operations for managing users
"""

import logging
import httpx
from typing import Annotated, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse
from app.api.deps import get_current_admin
from app.core.logging import log_audit_event
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class AdminUserCreate(BaseModel):
    """Schema for admin creating a new user"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)  # Temporary password that user should change
    role: UserRole = UserRole.DOCTOR
    phone: Optional[str] = None
    is_active: bool = True


class AdminUserUpdate(BaseModel):
    """Schema for admin updating a user"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    role: Optional[UserRole] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserListResponse(BaseModel):
    """Schema for paginated user list response"""
    users: List[UserResponse]
    total: int
    page: int
    page_size: int


@router.get("", response_model=UserListResponse)
async def list_users(
    admin: Annotated[User, Depends(get_current_admin)],
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
):
    """
    List all users (admin only).

    Args:
        admin: Current admin user
        db: Database session
        page: Page number (1-indexed)
        page_size: Number of users per page
        role: Filter by role
        is_active: Filter by active status
        search: Search by email or full_name

    Returns:
        Paginated list of users
    """
    query = db.query(User)

    # Apply filters
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_pattern)) |
            (User.full_name.ilike(search_pattern))
        )

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    return UserListResponse(
        users=users,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Session = Depends(get_db),
):
    """
    Get a specific user by ID (admin only).

    Args:
        user_id: UUID of the user
        admin: Current admin user
        db: Database session

    Returns:
        User details
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: AdminUserCreate,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Session = Depends(get_db),
):
    """
    Create a new user (admin only).

    This uses the Supabase Admin API to create the user in auth.users first,
    then creates/updates the profile with role information.

    Args:
        user_data: User creation data
        admin: Current admin user
        db: Database session

    Returns:
        Created user
    """
    # Check if Supabase is configured
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase Admin API not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        )

    # Check if email already exists in profiles
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Step 1: Create user in Supabase Auth using Admin API
    supabase_admin_url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
    }

    supabase_user_data = {
        "email": user_data.email,
        "password": user_data.password,
        "email_confirm": True,  # Auto-confirm email for admin-created users
        "user_metadata": {
            "full_name": user_data.full_name,
            "role": user_data.role.value,
        },
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                supabase_admin_url,
                headers=headers,
                json=supabase_user_data,
                timeout=30.0,
            )

            if response.status_code == 422:
                error_data = response.json()
                error_msg = error_data.get("msg", error_data.get("message", "User creation failed"))
                logger.error(f"Supabase user creation failed: {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Supabase error: {error_msg}",
                )

            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("msg", error_data.get("message", f"Status {response.status_code}"))
                logger.error(f"Supabase Admin API error: {response.status_code} - {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create user in Supabase: {error_msg}",
                )

            supabase_user = response.json()
            supabase_user_id = supabase_user.get("id")

            if not supabase_user_id:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Supabase returned no user ID",
                )

    except httpx.RequestError as e:
        logger.error(f"Network error calling Supabase Admin API: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not connect to authentication service",
        )

    # Step 2: Wait a moment for the trigger to create the profile, then update it
    # The Supabase trigger should create a basic profile entry
    import asyncio
    await asyncio.sleep(0.5)  # Brief wait for trigger

    # Step 3: Check if profile was created by trigger, if not create it
    new_user = db.query(User).filter(User.id == supabase_user_id).first()

    if new_user:
        # Profile exists (created by trigger), update it with role info
        new_user.full_name = user_data.full_name
        new_user.role = user_data.role
        new_user.phone = user_data.phone
        new_user.is_active = user_data.is_active
        new_user.is_verified = True
    else:
        # Profile not created by trigger, create it manually
        new_user = User(
            id=supabase_user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            phone=user_data.phone,
            is_active=user_data.is_active,
            is_verified=True,
        )
        db.add(new_user)

    db.commit()
    db.refresh(new_user)

    # Log audit event
    log_audit_event(
        user_id=str(admin.id),
        action="CREATE",
        resource="user",
        details={
            "created_user_id": str(new_user.id),
            "email": new_user.email,
            "role": new_user.role.value,
        },
        success=True,
    )

    logger.info(f"Admin {admin.email} created user {new_user.email} with role {new_user.role}")

    return new_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: AdminUserUpdate,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Session = Depends(get_db),
):
    """
    Update a user (admin only).

    Args:
        user_id: UUID of the user to update
        user_data: Update data
        admin: Current admin user
        db: Database session

    Returns:
        Updated user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent admin from deactivating themselves
    if user.id == admin.id and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    # Log audit event
    log_audit_event(
        user_id=str(admin.id),
        action="UPDATE",
        resource="user",
        details={
            "updated_user_id": str(user.id),
            "email": user.email,
            "changes": update_data,
        },
        success=True,
    )

    logger.info(f"Admin {admin.email} updated user {user.email}")

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Session = Depends(get_db),
):
    """
    Delete a user (admin only). Performs soft delete by deactivating.

    Args:
        user_id: UUID of the user to delete
        admin: Current admin user
        db: Database session
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent admin from deleting themselves
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    # Soft delete - deactivate the user
    user.is_active = False
    db.commit()

    # Log audit event
    log_audit_event(
        user_id=str(admin.id),
        action="DELETE",
        resource="user",
        details={
            "deleted_user_id": str(user.id),
            "email": user.email,
        },
        success=True,
    )

    logger.info(f"Admin {admin.email} deleted (deactivated) user {user.email}")


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: UUID,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Session = Depends(get_db),
):
    """
    Activate a deactivated user (admin only).

    Args:
        user_id: UUID of the user to activate
        admin: Current admin user
        db: Database session

    Returns:
        Activated user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = True
    db.commit()
    db.refresh(user)

    # Log audit event
    log_audit_event(
        user_id=str(admin.id),
        action="ACTIVATE",
        resource="user",
        details={
            "activated_user_id": str(user.id),
            "email": user.email,
        },
        success=True,
    )

    logger.info(f"Admin {admin.email} activated user {user.email}")

    return user
