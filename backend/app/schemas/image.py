"""
ConsultationImage schemas - Pydantic models for API validation
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ConsultationImageBase(BaseModel):
    """Base schema for consultation image"""
    filename: str = Field(..., min_length=1, max_length=255)
    file_size: int = Field(..., gt=0)
    mime_type: str = Field(default="image/jpeg", max_length=50)
    notes: Optional[str] = Field(None, max_length=500)


class ConsultationImageCreate(ConsultationImageBase):
    """Schema for creating a consultation image"""
    consultation_id: int = Field(..., gt=0)
    patient_id: int = Field(..., gt=0)
    image_data: str = Field(...)  # Base64 encoded image


class ConsultationImageUpdate(BaseModel):
    """Schema for updating a consultation image"""
    notes: Optional[str] = Field(None, max_length=500)


class ConsultationImageResponse(ConsultationImageBase):
    """Schema for consultation image response"""
    id: int
    consultation_id: int
    patient_id: int
    image_data: str  # Base64 encoded
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ConsultationImageListResponse(BaseModel):
    """Schema for list of consultation images"""
    images: list[ConsultationImageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
