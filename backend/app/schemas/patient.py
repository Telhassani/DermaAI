"""
Patient schemas - Pydantic models for API requests/responses
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime, date
import re

from app.models.patient import Gender, IdentificationType
from app.core.validation import (
    sanitize_text,
    validate_phone as validate_phone_func,
    validate_identification,
)


class PatientBase(BaseModel):
    """Base patient schema"""

    identification_type: IdentificationType
    identification_number: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    gender: Gender
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=10, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(default="France", max_length=100)
    insurance_number: Optional[str] = Field(None, max_length=100)
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    doctor_id: Optional[int] = None

    @field_validator("date_of_birth", mode="before")
    @classmethod
    def validate_date_of_birth(cls, v) -> date:
        """Validate and ensure date_of_birth is a date object"""
        if isinstance(v, str):
            # Pydantic will auto-convert, but ensure it's valid
            return v
        return v

    @field_validator("identification_number")
    @classmethod
    def validate_id_number(cls, v: str, info) -> str:
        """Validate identification number"""
        id_type = info.data.get("identification_type")
        if id_type:
            if not validate_identification(v, id_type):
                raise ValueError(f"Invalid {id_type} format")
        return sanitize_text(v, max_length=50)

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, v: str) -> str:
        """Sanitize and validate name fields"""
        v = sanitize_text(v, max_length=100)
        if not v or len(v) < 1:
            raise ValueError("Name cannot be empty after sanitization")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v: str) -> str:
        """Validate phone number format"""
        if not validate_phone_func(v):
            raise ValueError("Invalid phone number format")
        return v

    @field_validator("address", "city", "postal_code", "country", "allergies", "medical_history")
    @classmethod
    def sanitize_text_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize optional text fields"""
        if v is None:
            return v
        return sanitize_text(v)

    @field_validator("insurance_number")
    @classmethod
    def sanitize_insurance_number(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize insurance number"""
        if v is None:
            return v
        return sanitize_text(v, max_length=100)


class PatientCreate(PatientBase):
    """Schema for patient creation"""
    pass


class PatientUpdate(BaseModel):
    """Schema for patient update (all fields optional)"""

    identification_type: Optional[IdentificationType] = None
    identification_number: Optional[str] = Field(None, min_length=1, max_length=50)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    insurance_number: Optional[str] = Field(None, max_length=100)
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    doctor_id: Optional[int] = None

    @field_validator("date_of_birth", mode="before")
    @classmethod
    def validate_date_of_birth(cls, v) -> Optional[date]:
        """Validate and ensure date_of_birth is a date object or None"""
        if v is None:
            return None
        if isinstance(v, str):
            # Pydantic will auto-convert, but ensure it's valid
            return v
        return v

    @field_validator("identification_number")
    @classmethod
    def validate_id_number(cls, v: Optional[str], info) -> Optional[str]:
        """Validate identification number"""
        if v is None:
            return v
        id_type = info.data.get("identification_type")
        if id_type:
            if not validate_identification(v, id_type):
                raise ValueError(f"Invalid {id_type} format")
        return sanitize_text(v, max_length=50)

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize and validate name fields"""
        if v is None:
            return v
        v = sanitize_text(v, max_length=100)
        if not v or len(v) < 1:
            raise ValueError("Name cannot be empty after sanitization")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number format"""
        if v is None:
            return v
        if not validate_phone_func(v):
            raise ValueError("Invalid phone number format")
        return v

    @field_validator("address", "city", "postal_code", "country", "allergies", "medical_history")
    @classmethod
    def sanitize_text_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize optional text fields"""
        if v is None:
            return v
        return sanitize_text(v)

    @field_validator("insurance_number")
    @classmethod
    def sanitize_insurance_number(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize insurance number"""
        if v is None:
            return v
        return sanitize_text(v, max_length=100)


class PatientResponse(PatientBase):
    """Schema for patient response"""

    id: int
    created_at: datetime
    updated_at: datetime
    full_name: str
    age: int

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    """Schema for paginated patient list"""

    patients: list[PatientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PatientSearchParams(BaseModel):
    """Schema for patient search parameters"""

    search: Optional[str] = Field(None, description="Search by name, email, phone, or insurance number")
    gender: Optional[Gender] = None
    doctor_id: Optional[int] = None
    min_age: Optional[int] = Field(None, ge=0, le=150)
    max_age: Optional[int] = Field(None, ge=0, le=150)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = Field(default="created_at", description="Field to sort by")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
