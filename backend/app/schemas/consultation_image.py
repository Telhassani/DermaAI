"""
Consultation Image Schemas - Pydantic models for image API
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class ConsultationImageBase(BaseModel):
    """Base schema for consultation image"""
    image_type: Optional[str] = Field(None, max_length=100, description="Type d'image (lésion primaire, macro, dermatoscope, etc.)")
    body_location: Optional[str] = Field(None, max_length=200, description="Localisation anatomique de la lésion")
    description: Optional[str] = Field(None, description="Description médicale de l'image")
    is_primary: bool = Field(False, description="Image principale de la consultation")


class ConsultationImageCreate(ConsultationImageBase):
    """Schema for creating a new consultation image (without file upload)"""
    consultation_id: int = Field(..., gt=0, description="ID de la consultation")


class ConsultationImageUpdate(BaseModel):
    """Schema for updating image metadata"""
    image_type: Optional[str] = Field(None, max_length=100)
    body_location: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    is_primary: Optional[bool] = None


class ConsultationImageMetadata(BaseModel):
    """Schema for EXIF metadata"""
    captured_at: Optional[datetime] = None
    camera_model: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class ConsultationImageResponse(ConsultationImageBase):
    """Schema for consultation image response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    consultation_id: int
    image_url: str
    thumbnail_url: Optional[str] = None
    original_filename: str
    file_size: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    captured_at: Optional[datetime] = None
    camera_model: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ConsultationImageListResponse(BaseModel):
    """Schema for paginated list of consultation images"""
    images: list[ConsultationImageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ImageUploadResponse(BaseModel):
    """Schema for successful image upload response"""
    id: int
    consultation_id: int
    image_url: str
    thumbnail_url: Optional[str] = None
    original_filename: str
    file_size: int
    mime_type: str
    message: str = "Image uploaded successfully"
