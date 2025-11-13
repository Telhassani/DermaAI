"""
Appointment schemas - Pydantic models for API requests/responses
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

from app.models.appointment import AppointmentStatus, AppointmentType


class AppointmentBase(BaseModel):
    """Base appointment schema"""

    patient_id: int = Field(..., gt=0, description="Patient ID")
    doctor_id: int = Field(..., gt=0, description="Doctor ID")
    start_time: datetime = Field(..., description="Appointment start time")
    end_time: datetime = Field(..., description="Appointment end time")
    type: AppointmentType = Field(default=AppointmentType.CONSULTATION)
    status: AppointmentStatus = Field(default=AppointmentStatus.SCHEDULED)
    reason: Optional[str] = Field(None, description="Reason for visit")
    notes: Optional[str] = Field(None, description="Doctor's notes")
    diagnosis: Optional[str] = Field(None, description="Diagnosis after consultation")
    is_first_visit: bool = Field(default=False, description="Whether this is patient's first visit")
    reminder_sent: bool = Field(default=False, description="Whether reminder was sent")

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: datetime, info) -> datetime:
        """Validate that end_time is after start_time"""
        if "start_time" in info.data:
            start_time = info.data["start_time"]
            if v <= start_time:
                raise ValueError("end_time must be after start_time")
        return v

    @field_validator("start_time")
    @classmethod
    def validate_start_time(cls, v: datetime) -> datetime:
        """Validate that start_time is not in the past (for creation)"""
        # Note: This validation is only for creation, not updates
        # We'll handle this in the API endpoint
        return v


class AppointmentCreate(BaseModel):
    """Schema for appointment creation"""

    patient_id: int = Field(..., gt=0, description="Patient ID")
    doctor_id: int = Field(..., gt=0, description="Doctor ID")
    start_time: datetime = Field(..., description="Appointment start time")
    end_time: datetime = Field(..., description="Appointment end time")
    type: AppointmentType = Field(default=AppointmentType.CONSULTATION)
    reason: Optional[str] = Field(None, description="Reason for visit")
    notes: Optional[str] = Field(None, description="Doctor's notes")
    is_first_visit: bool = Field(default=False, description="Whether this is patient's first visit")

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: datetime, info) -> datetime:
        """Validate that end_time is after start_time"""
        if "start_time" in info.data:
            start_time = info.data["start_time"]
            if v <= start_time:
                raise ValueError("L'heure de fin doit être après l'heure de début")

            # Validate duration (minimum 15 minutes, maximum 8 hours)
            duration_minutes = (v - start_time).total_seconds() / 60
            if duration_minutes < 15:
                raise ValueError("La durée minimale d'un rendez-vous est de 15 minutes")
            if duration_minutes > 480:  # 8 hours
                raise ValueError("La durée maximale d'un rendez-vous est de 8 heures")

        return v


class AppointmentUpdate(BaseModel):
    """Schema for appointment update (all fields optional)"""

    patient_id: Optional[int] = Field(None, gt=0, description="Patient ID")
    doctor_id: Optional[int] = Field(None, gt=0, description="Doctor ID")
    start_time: Optional[datetime] = Field(None, description="Appointment start time")
    end_time: Optional[datetime] = Field(None, description="Appointment end time")
    type: Optional[AppointmentType] = None
    status: Optional[AppointmentStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    is_first_visit: Optional[bool] = None
    reminder_sent: Optional[bool] = None


class AppointmentStatusUpdate(BaseModel):
    """Schema for updating only the appointment status"""

    status: AppointmentStatus = Field(..., description="New appointment status")
    notes: Optional[str] = Field(None, description="Additional notes for status change")


class AppointmentResponse(BaseModel):
    """Schema for appointment response"""

    id: int
    patient_id: int
    doctor_id: int
    start_time: datetime
    end_time: datetime
    type: AppointmentType
    status: AppointmentStatus
    reason: Optional[str]
    notes: Optional[str]
    diagnosis: Optional[str]
    is_first_visit: bool
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime
    duration_minutes: int
    is_upcoming: bool
    is_past: bool

    class Config:
        from_attributes = True


class AppointmentWithDetailsResponse(AppointmentResponse):
    """Schema for appointment response with patient and doctor details"""

    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    """Schema for paginated appointment list"""

    appointments: list[AppointmentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AppointmentSearchParams(BaseModel):
    """Schema for appointment search parameters"""

    patient_id: Optional[int] = Field(None, description="Filter by patient ID")
    doctor_id: Optional[int] = Field(None, description="Filter by doctor ID")
    type: Optional[AppointmentType] = Field(None, description="Filter by appointment type")
    status: Optional[AppointmentStatus] = Field(None, description="Filter by status")
    start_date: Optional[datetime] = Field(None, description="Filter appointments from this date")
    end_date: Optional[datetime] = Field(None, description="Filter appointments until this date")
    is_first_visit: Optional[bool] = Field(None, description="Filter by first visit")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = Field(default="start_time", description="Field to sort by")
    sort_order: Optional[str] = Field(default="asc", pattern="^(asc|desc)$")


class AppointmentConflictCheck(BaseModel):
    """Schema for checking appointment conflicts"""

    doctor_id: int = Field(..., gt=0, description="Doctor ID")
    start_time: datetime = Field(..., description="Appointment start time")
    end_time: datetime = Field(..., description="Appointment end time")
    exclude_appointment_id: Optional[int] = Field(
        None, description="Appointment ID to exclude from conflict check (for updates)"
    )


class AppointmentConflictResponse(BaseModel):
    """Schema for conflict check response"""

    has_conflict: bool
    conflicting_appointments: list[AppointmentResponse]
    available_slots: list[dict] = Field(
        default_factory=list,
        description="List of available time slots if conflict exists"
    )


class AppointmentStatsResponse(BaseModel):
    """Schema for appointment statistics"""

    total_appointments: int
    scheduled: int
    confirmed: int
    completed: int
    cancelled: int
    no_show: int
    upcoming_appointments: int
    past_appointments: int
    today_appointments: int
    this_week_appointments: int
    this_month_appointments: int
