"""
ConsultationImage schemas - Pydantic models for API validation
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

from app.core.validation import sanitize_text, validate_filename


class ConsultationImageBase(BaseModel):
    """Base schema for consultation image"""
    filename: str = Field(..., min_length=1, max_length=255)
    file_size: int = Field(..., gt=0)
    mime_type: str = Field(default="image/jpeg", max_length=50)
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("filename")
    @classmethod
    def validate_image_filename(cls, v: str) -> str:
        """Validate filename safety"""
        is_valid, error = validate_filename(v)
        if not is_valid:
            raise ValueError(error)
        return v

    @field_validator("notes")
    @classmethod
    def sanitize_notes(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize notes field"""
        if v is None:
            return v
        return sanitize_text(v, max_length=500)


class ConsultationImageCreate(ConsultationImageBase):
    """Schema for creating a consultation image"""
    consultation_id: Optional[int] = Field(None, gt=0)
    patient_id: int = Field(..., gt=0)
    image_data: str = Field(...)  # Base64 encoded image


class ConsultationImageUpdate(BaseModel):
    """Schema for updating a consultation image"""
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes")
    @classmethod
    def sanitize_notes(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize notes field"""
        if v is None:
            return v
        return sanitize_text(v, max_length=500)


class ConsultationImageResponse(ConsultationImageBase):
    """Schema for consultation image response"""
    id: int
    consultation_id: Optional[int]
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


# ============================================================================
# Image Analysis Schemas
# ============================================================================


class ImageAnalysisRequest(BaseModel):
    """Request to analyze an image"""
    additional_notes: Optional[str] = Field(None, max_length=1000, description="Optional clinical context")

    @field_validator("additional_notes")
    @classmethod
    def sanitize_notes(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize analysis notes"""
        if v is None:
            return v
        return sanitize_text(v, max_length=1000)


class DifferentialDiagnosis(BaseModel):
    """Possible diagnosis from analysis"""
    condition: str
    likelihood: str = Field(default="possible", description="possible/probable/likely")
    notes: Optional[str] = None


class ImageAnalysisResponse(BaseModel):
    """AI analysis results for an image"""
    status: str = Field(default="success", description="success/error")
    condition: Optional[str] = Field(None, description="Primary identified condition")
    severity: Optional[str] = Field(None, description="mild/moderate/severe")
    observations: Optional[str] = Field(None, description="Clinical observations")
    differential_diagnoses: Optional[list[str]] = Field(default=[], description="Other diagnoses to consider")
    recommendations: Optional[list[str]] = Field(default=[], description="Clinical recommendations")
    follow_up: Optional[str] = Field(None, description="Follow-up suggestions")
    confidence_percent: Optional[int] = Field(None, description="Confidence level 0-100%")
    model: Optional[str] = Field(None, description="AI model used for analysis")
    tokens_used: Optional[dict] = Field(None, description="Token usage {input, output}")
    error: Optional[str] = Field(None, description="Error message if status is error")

    class Config:
        from_attributes = True


class DrugInteractionAnalysis(BaseModel):
    """Drug interaction analysis results"""
    status: str = Field(default="success")
    medications: list[str]
    interactions: list[dict] = Field(default=[], description="List of interactions found")
    summary: Optional[str] = None
    requires_consultation: bool = Field(default=False)
    error: Optional[str] = None


class LabResultAnalysis(BaseModel):
    """Lab result analysis results"""
    status: str = Field(default="success")
    interpretation: Optional[str] = None
    abnormalities: list[str] = Field(default=[])
    recommendations: list[str] = Field(default=[])
    error: Optional[str] = None
