"""
Consultation schemas - Pydantic models for API validation
"""

from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator

from app.core.validation import sanitize_html, sanitize_text as sanitize_plain_text


# ============================================================================
# Consultation Schemas
# ============================================================================

class ConsultationBase(BaseModel):
    """Base consultation schema"""

    patient_id: int
    consultation_date: date = Field(default_factory=date.today)
    chief_complaint: str = Field(..., min_length=1, description="Motif de consultation")
    symptoms: Optional[str] = None
    duration_symptoms: Optional[str] = None
    medical_history_notes: Optional[str] = None
    clinical_examination: Optional[str] = None
    dermatological_examination: Optional[str] = None
    lesion_type: Optional[str] = None
    lesion_location: Optional[str] = None
    lesion_size: Optional[str] = None
    lesion_color: Optional[str] = None
    lesion_texture: Optional[str] = None
    diagnosis: Optional[str] = None
    differential_diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    private_notes: Optional[str] = None
    images_taken: bool = False
    biopsy_performed: bool = False
    biopsy_results: Optional[str] = None

    @field_validator("chief_complaint")
    @classmethod
    def validate_chief_complaint(cls, v: str) -> str:
        """Sanitize chief complaint"""
        v = sanitize_html(v, allow_html=False)
        v = sanitize_plain_text(v, max_length=500)
        if not v or len(v) < 1:
            raise ValueError("Chief complaint cannot be empty")
        return v

    @field_validator(
        "symptoms", "duration_symptoms", "medical_history_notes",
        "clinical_examination", "dermatological_examination",
        "lesion_type", "lesion_location", "lesion_size",
        "lesion_color", "lesion_texture", "diagnosis",
        "differential_diagnosis", "treatment_plan", "notes",
        "private_notes", "biopsy_results"
    )
    @classmethod
    def sanitize_medical_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize medical text fields - remove HTML and malicious content"""
        if v is None:
            return v
        # First remove/escape HTML, then sanitize plain text
        v = sanitize_html(v, allow_html=False)
        return sanitize_plain_text(v)


class ConsultationCreate(ConsultationBase):
    """Schema for creating a new consultation"""
    pass


class ConsultationUpdate(BaseModel):
    """Schema for updating a consultation (all fields optional)"""

    consultation_date: Optional[date] = None
    chief_complaint: Optional[str] = Field(None, min_length=1)
    symptoms: Optional[str] = None
    duration_symptoms: Optional[str] = None
    medical_history_notes: Optional[str] = None
    clinical_examination: Optional[str] = None
    dermatological_examination: Optional[str] = None
    lesion_type: Optional[str] = None
    lesion_location: Optional[str] = None
    lesion_size: Optional[str] = None
    lesion_color: Optional[str] = None
    lesion_texture: Optional[str] = None
    diagnosis: Optional[str] = None
    differential_diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    private_notes: Optional[str] = None
    images_taken: Optional[bool] = None
    biopsy_performed: Optional[bool] = None
    biopsy_results: Optional[str] = None

    @field_validator("chief_complaint")
    @classmethod
    def validate_chief_complaint(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize chief complaint"""
        if v is None:
            return v
        v = sanitize_html(v, allow_html=False)
        v = sanitize_plain_text(v, max_length=500)
        if not v or len(v) < 1:
            raise ValueError("Chief complaint cannot be empty")
        return v

    @field_validator(
        "symptoms", "duration_symptoms", "medical_history_notes",
        "clinical_examination", "dermatological_examination",
        "lesion_type", "lesion_location", "lesion_size",
        "lesion_color", "lesion_texture", "diagnosis",
        "differential_diagnosis", "treatment_plan", "notes",
        "private_notes", "biopsy_results"
    )
    @classmethod
    def sanitize_medical_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize medical text fields - remove HTML and malicious content"""
        if v is None:
            return v
        # First remove/escape HTML, then sanitize plain text
        v = sanitize_html(v, allow_html=False)
        return sanitize_plain_text(v)


class ConsultationResponse(ConsultationBase):
    """Schema for consultation response"""

    id: int
    doctor_id: int
    consultation_number: Optional[int] = None  # Sequential number for this patient's consultations
    consultation_time: datetime
    created_at: datetime
    updated_at: datetime

    # Optional: Include related data
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True


class ConsultationListResponse(BaseModel):
    """Schema for paginated consultation list"""

    consultations: List[ConsultationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ConsultationSummary(BaseModel):
    """Schema for consultation summary (for lists)"""

    id: int
    patient_id: int
    patient_name: str
    doctor_id: int
    doctor_name: str
    consultation_date: date
    chief_complaint: str
    diagnosis: Optional[str] = None
    follow_up_required: bool
    created_at: datetime

    class Config:
        from_attributes = True
