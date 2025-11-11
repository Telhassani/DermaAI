"""
Image schemas - Pydantic models for image API
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ImageType(str, Enum):
    """Image type enumeration"""

    CLINICAL = "clinical"
    DERMOSCOPIC = "dermoscopic"
    HISTOPATHOLOGY = "histopathology"
    OTHER = "other"


class ImageCategory(str, Enum):
    """Image category enumeration"""

    DIAGNOSTIC = "diagnostic"
    FOLLOW_UP = "follow_up"
    TREATMENT = "treatment"
    COMPARISON = "comparison"


class AnnotationTool(str, Enum):
    """Annotation tool type"""

    RECTANGLE = "rectangle"
    CIRCLE = "circle"
    ARROW = "arrow"
    PEN = "pen"
    TEXT = "text"


# ==================== Image Schemas ====================


class ImageBase(BaseModel):
    """Base image schema"""

    patient_id: int
    consultation_id: Optional[int] = None
    image_type: ImageType = ImageType.CLINICAL
    category: ImageCategory = ImageCategory.DIAGNOSTIC
    body_location: Optional[str] = None
    description: Optional[str] = None
    image_metadata: Optional[Dict[str, Any]] = None


class ImageCreate(ImageBase):
    """Schema for creating an image (used internally)"""

    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    thumbnail_path: Optional[str] = None


class ImageUploadRequest(BaseModel):
    """Schema for image upload request metadata"""

    patient_id: int
    consultation_id: Optional[int] = None
    image_type: ImageType = ImageType.CLINICAL
    category: ImageCategory = ImageCategory.DIAGNOSTIC
    body_location: Optional[str] = None
    description: Optional[str] = None


class ImageUpdate(BaseModel):
    """Schema for updating image metadata"""

    image_type: Optional[ImageType] = None
    category: Optional[ImageCategory] = None
    body_location: Optional[str] = None
    description: Optional[str] = None
    image_metadata: Optional[Dict[str, Any]] = None


class ImageResponse(ImageBase):
    """Schema for image response"""

    id: int
    file_name: str
    file_size: int
    mime_type: str
    url: str  # Generated URL to access the image
    thumbnail_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ImageListResponse(BaseModel):
    """Schema for list of images"""

    images: List[ImageResponse]
    total: int
    page: int
    page_size: int


class ImageUploadResponse(BaseModel):
    """Schema for image upload response"""

    success_count: int
    failed_count: int
    images: List[ImageResponse]
    errors: Optional[List[str]] = None


# ==================== Annotation Schemas ====================


class AnnotationBase(BaseModel):
    """Base annotation schema"""

    tool: AnnotationTool
    coordinates: Dict[str, Any] = Field(
        ...,
        description="Coordinates object, structure depends on tool",
        examples=[
            {"x": 100, "y": 150, "width": 50, "height": 30},  # rectangle
            {"x": 200, "y": 200, "radius": 40},  # circle
        ],
    )
    color: str = Field(default="#FF0000", pattern="^#[0-9A-Fa-f]{6}$")
    label: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that coordinates contain required fields"""
        if not isinstance(v, dict):
            raise ValueError("Coordinates must be a dictionary")
        return v


class AnnotationCreate(AnnotationBase):
    """Schema for creating an annotation"""

    image_id: int
    user_id: int


class AnnotationUpdate(BaseModel):
    """Schema for updating an annotation"""

    coordinates: Optional[Dict[str, Any]] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    label: Optional[str] = None
    notes: Optional[str] = None


class AnnotationResponse(AnnotationBase):
    """Schema for annotation response"""

    id: int
    image_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnnotationListResponse(BaseModel):
    """Schema for list of annotations"""

    annotations: List[AnnotationResponse]
    total: int


# ==================== Query Parameters ====================


class ImageFilters(BaseModel):
    """Query parameters for filtering images"""

    patient_id: Optional[int] = None
    consultation_id: Optional[int] = None
    image_type: Optional[ImageType] = None
    category: Optional[ImageCategory] = None
    body_location: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
