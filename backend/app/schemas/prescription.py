"""
Prescription schemas - Pydantic models for API validation
"""

from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator

from app.core.validation import sanitize_text


# ============================================================================
# Medication Schema (for JSON storage)
# ============================================================================

class MedicationItem(BaseModel):
    """Schema for a single medication in a prescription"""

    name: str = Field(..., min_length=1, description="Nom du médicament")
    dosage: str = Field(..., min_length=1, description="Posologie")
    duration: Optional[str] = Field(None, description="Durée du traitement")
    quantity: Optional[str] = Field(None, description="Quantité à délivrer")
    frequency: Optional[str] = Field(None, description="Fréquence (e.g., '2 fois par jour')")
    route: Optional[str] = Field(None, description="Voie d'administration")
    instructions: Optional[str] = Field(None, description="Instructions spécifiques")

    @field_validator("name", "dosage")
    @classmethod
    def sanitize_required_fields(cls, v: str) -> str:
        """Sanitize required medication fields"""
        v = sanitize_text(v, max_length=200)
        if not v or len(v) < 1:
            raise ValueError("Field cannot be empty")
        return v

    @field_validator("duration", "quantity", "frequency", "route", "instructions")
    @classmethod
    def sanitize_optional_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize optional medication fields"""
        if v is None:
            return v
        return sanitize_text(v)


# ============================================================================
# Prescription Schemas
# ============================================================================

class PrescriptionBase(BaseModel):
    """Base prescription schema"""

    consultation_id: int
    patient_id: int
    prescription_date: date = Field(default_factory=date.today)
    valid_until: Optional[date] = None
    control_date: Optional[date] = Field(None, description="Date de contrôle (suivi)")
    medications: List[MedicationItem] = Field(..., min_items=1, description="Liste des médicaments")
    instructions: Optional[str] = Field(None, description="Instructions générales")
    notes: Optional[str] = Field(None, description="Notes additionnelles")

    @field_validator("instructions", "notes")
    @classmethod
    def sanitize_text_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize optional text fields"""
        if v is None:
            return v
        return sanitize_text(v)


class PrescriptionCreate(PrescriptionBase):
    """Schema for creating a new prescription"""
    pass


class PrescriptionUpdate(BaseModel):
    """Schema for updating a prescription (all fields optional)"""

    prescription_date: Optional[date] = None
    valid_until: Optional[date] = None
    control_date: Optional[date] = None
    medications: Optional[List[MedicationItem]] = Field(None, min_items=1)
    instructions: Optional[str] = None
    notes: Optional[str] = None
    is_printed: Optional[bool] = None
    is_delivered: Optional[bool] = None

    @field_validator("instructions", "notes")
    @classmethod
    def sanitize_text_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize optional text fields"""
        if v is None:
            return v
        return sanitize_text(v)


class PrescriptionResponse(PrescriptionBase):
    """Schema for prescription response"""

    id: int
    doctor_id: int
    is_printed: bool
    is_delivered: bool
    created_at: datetime
    updated_at: datetime

    # Optional: Include related data
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True


class PrescriptionListResponse(BaseModel):
    """Schema for paginated prescription list"""

    prescriptions: List[PrescriptionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PrescriptionSummary(BaseModel):
    """Schema for prescription summary (for lists)"""

    id: int
    consultation_id: int
    patient_id: int
    patient_name: str
    doctor_id: int
    doctor_name: str
    prescription_date: date
    medication_count: int  # Number of medications
    is_printed: bool
    is_delivered: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Prescription Print Schema (for generating printable prescriptions)
# ============================================================================

class PrescriptionPrintData(BaseModel):
    """Schema for prescription print data"""

    prescription_id: int
    prescription_date: date
    patient_name: str
    patient_identification: str
    patient_age: int
    patient_address: Optional[str] = None
    doctor_name: str
    doctor_credentials: Optional[str] = None
    doctor_address: Optional[str] = None
    doctor_phone: Optional[str] = None
    medications: List[MedicationItem]
    instructions: Optional[str] = None
    notes: Optional[str] = None
    valid_until: Optional[date] = None
    control_date: Optional[date] = None

    class Config:
        from_attributes = True
