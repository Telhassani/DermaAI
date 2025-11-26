"""
Appointment schemas - Pydantic models for API requests/responses

This module defines Pydantic schemas for appointment operations including:
- Appointment CRUD operations
- Conflict checking
- Recurring appointment support
- Status transitions
- Statistics and reporting

All schemas include comprehensive validation and documentation.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime

from app.models.appointment import AppointmentStatus, AppointmentType


# ============================================================================
# Base Schemas
# ============================================================================


class AppointmentBase(BaseModel):
    """
    Base appointment schema with common fields.

    Used as a foundation for request/response schemas.
    """

    patient_id: Optional[int] = Field(None, gt=0, description="Patient ID (optional if guest)")
    guest_name: Optional[str] = Field(None, max_length=255, description="Guest name (for non-registered patients)")
    guest_phone: Optional[str] = Field(None, max_length=50, description="Guest phone")
    guest_email: Optional[str] = Field(None, max_length=255, description="Guest email")
    doctor_id: int = Field(..., gt=0, description="Doctor ID")
    start_time: datetime = Field(..., description="Appointment start time (UTC)")
    end_time: datetime = Field(..., description="Appointment end time (UTC)")
    type: AppointmentType = Field(default=AppointmentType.CONSULTATION, description="Type of appointment")
    status: AppointmentStatus = Field(default=AppointmentStatus.SCHEDULED, description="Appointment status")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for visit")
    notes: Optional[str] = Field(None, max_length=2000, description="Doctor's clinical notes")
    diagnosis: Optional[str] = Field(None, max_length=2000, description="Diagnosis made during appointment")
    is_first_visit: bool = Field(default=False, description="Whether this is patient's first visit")
    reminder_sent: bool = Field(default=False, description="Whether automated reminder was sent")

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: datetime, info) -> datetime:
        """Validate that end_time is after start_time and duration is reasonable"""
        if "start_time" in info.data:
            start_time = info.data["start_time"]
            if v <= start_time:
                raise ValueError("Appointment end time must be after start time")
        return v

    @field_validator("start_time")
    @classmethod
    def validate_start_time(cls, v: datetime) -> datetime:
        """Validate start_time format and value"""
        return v


# ============================================================================
# Create/Update Schemas
# ============================================================================


class AppointmentCreate(BaseModel):
    """
    Schema for creating a new appointment.

    Can create either single appointments or recurring appointment series.
    """

    patient_id: Optional[int] = Field(None, gt=0, description="Patient ID (optional if guest)")
    guest_name: Optional[str] = Field(None, max_length=255, description="Guest name (required if no patient_id)")
    guest_phone: Optional[str] = Field(None, max_length=50, description="Guest phone")
    guest_email: Optional[str] = Field(None, max_length=255, description="Guest email")
    doctor_id: int = Field(..., gt=0, description="Doctor ID")
    start_time: datetime = Field(..., description="Appointment start time (UTC)")
    end_time: datetime = Field(..., description="Appointment end time (UTC)")
    type: AppointmentType = Field(default=AppointmentType.CONSULTATION, description="Type of appointment")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for visit")
    notes: Optional[str] = Field(None, max_length=2000, description="Doctor's notes")
    is_first_visit: bool = Field(default=False, description="Whether this is patient's first visit")
    recurrence_rule: Optional[Dict[str, Any]] = Field(
        None,
        description="RFC 5545 format recurrence rule for recurring appointments"
    )
    
    @field_validator("guest_name")
    @classmethod
    def validate_patient_or_guest(cls, v: Optional[str], info) -> Optional[str]:
        """Validate that either patient_id or guest_name is provided"""
        if "patient_id" in info.data:
            patient_id = info.data["patient_id"]
            if not patient_id and not v:
                raise ValueError("Either patient_id or guest_name must be provided")
        return v

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: datetime, info) -> datetime:
        """Validate appointment duration (15 minutes to 8 hours)"""
        if "start_time" in info.data:
            start_time = info.data["start_time"]
            if v <= start_time:
                raise ValueError("Appointment end time must be after start time")

            # Validate duration (minimum 15 minutes, maximum 8 hours)
            duration_minutes = (v - start_time).total_seconds() / 60
            if duration_minutes < 15:
                raise ValueError("Minimum appointment duration is 15 minutes")
            if duration_minutes > 480:  # 8 hours
                raise ValueError("Maximum appointment duration is 8 hours")

        return v


class AppointmentUpdate(BaseModel):
    """
    Schema for updating an existing appointment.

    All fields are optional - only provided fields will be updated.
    For recurring appointments, use this to update individual instances
    or the recurrence_rule to modify the entire series.

    Validation:
    - end_time must be after start_time if both are provided
    - Appointment must be reschedule-able (see Appointment.can_be_rescheduled())
    """

    patient_id: Optional[int] = Field(None, gt=0, description="Patient ID")
    guest_name: Optional[str] = Field(None, max_length=255, description="Guest name")
    guest_phone: Optional[str] = Field(None, max_length=50, description="Guest phone")
    guest_email: Optional[str] = Field(None, max_length=255, description="Guest email")
    doctor_id: Optional[int] = Field(None, gt=0, description="Doctor ID")
    start_time: Optional[datetime] = Field(None, description="Appointment start time (UTC)")
    end_time: Optional[datetime] = Field(None, description="Appointment end time (UTC)")
    type: Optional[AppointmentType] = Field(None, description="Type of appointment")
    status: Optional[AppointmentStatus] = Field(None, description="Appointment status")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for visit")
    notes: Optional[str] = Field(None, max_length=2000, description="Doctor's clinical notes")
    diagnosis: Optional[str] = Field(None, max_length=2000, description="Diagnosis made during appointment")
    is_first_visit: Optional[bool] = Field(None, description="Whether this is patient's first visit")
    reminder_sent: Optional[bool] = Field(None, description="Whether automated reminder was sent")
    recurrence_rule: Optional[Dict[str, Any]] = Field(
        None,
        description="RFC 5545 format recurrence rule for modifying recurring series"
    )

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: datetime, info) -> datetime:
        """Validate appointment duration (15 minutes to 8 hours) if both times provided"""
        if v is not None and "start_time" in info.data:
            start_time = info.data["start_time"]
            if start_time is not None and v <= start_time:
                raise ValueError("Appointment end time must be after start time")

            # Validate duration (minimum 15 minutes, maximum 8 hours)
            duration_minutes = (v - start_time).total_seconds() / 60
            if duration_minutes < 15:
                raise ValueError("Minimum appointment duration is 15 minutes")
            if duration_minutes > 480:  # 8 hours
                raise ValueError("Maximum appointment duration is 8 hours")

        return v


class AppointmentStatusUpdate(BaseModel):
    """
    Schema for status-only updates to an appointment.

    Used when only changing the appointment status (e.g., confirming, cancelling).
    This is a simpler endpoint than full appointment updates for status-specific actions.
    """

    status: AppointmentStatus = Field(..., description="New appointment status")
    notes: Optional[str] = Field(None, max_length=2000, description="Additional notes for status change")


# ============================================================================
# Response Schemas
# ============================================================================


class AppointmentResponse(BaseModel):
    """
    Schema for appointment response in list/detail endpoints.

    Includes all core appointment data and computed properties
    (duration, upcoming status, past status, recurrence info).
    Designed for efficient serialization to JSON API responses.
    """

    id: int = Field(..., description="Appointment ID")
    patient_id: Optional[int] = Field(None, description="Patient ID")
    guest_name: Optional[str] = Field(None, description="Guest name")
    guest_phone: Optional[str] = Field(None, description="Guest phone")
    guest_email: Optional[str] = Field(None, description="Guest email")
    doctor_id: int = Field(..., description="Doctor ID")
    start_time: datetime = Field(..., description="Appointment start time (UTC)")
    end_time: datetime = Field(..., description="Appointment end time (UTC)")
    type: AppointmentType = Field(..., description="Type of appointment")
    status: AppointmentStatus = Field(..., description="Current appointment status")
    reason: Optional[str] = Field(None, description="Reason for visit")
    notes: Optional[str] = Field(None, description="Doctor's clinical notes")
    diagnosis: Optional[str] = Field(None, description="Diagnosis made during appointment")
    is_first_visit: bool = Field(..., description="Whether this is patient's first visit")
    reminder_sent: bool = Field(..., description="Whether automated reminder was sent")
    created_at: datetime = Field(..., description="When appointment was created")
    updated_at: datetime = Field(..., description="When appointment was last updated")
    duration_minutes: int = Field(..., description="Duration of appointment in minutes")
    is_upcoming: bool = Field(..., description="Whether appointment is in future")
    is_past: bool = Field(..., description="Whether appointment has ended")
    recurrence_rule: Optional[Dict[str, Any]] = Field(None, description="RFC 5545 format recurrence rule if recurring")
    recurring_series_id: Optional[int] = Field(None, description="ID of parent recurring series if part of one")
    is_recurring: bool = Field(..., description="Whether appointment is part of recurring series")

    class Config:
        from_attributes = True

    @field_validator("start_time", "end_time")
    @classmethod
    def ensure_timezone(cls, v: datetime) -> datetime:
        """Ensure datetime has timezone info (assume UTC if missing)"""
        if v.tzinfo is None:
            from datetime import timezone
            return v.replace(tzinfo=timezone.utc)
        return v


class AppointmentWithDetailsResponse(AppointmentResponse):
    """
    Schema for appointment response with related patient and doctor information.

    Extends AppointmentResponse with denormalized patient and doctor details
    to reduce frontend queries. Useful for calendar views and lists where
    patient/doctor names are needed alongside appointment data.
    """

    patient_name: Optional[str] = Field(None, description="Full name of patient")
    patient_phone: Optional[str] = Field(None, description="Patient phone number")
    doctor_name: Optional[str] = Field(None, description="Full name of doctor/specialist")

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    """
    Schema for paginated appointment list responses.

    Contains a list of appointments plus pagination metadata.
    Used for all list endpoints that return multiple appointments.
    """

    appointments: list[AppointmentResponse] = Field(..., description="List of appointments in current page")
    total: int = Field(..., description="Total number of appointments matching filters")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages available")


# ============================================================================
# Search and Filter Schemas
# ============================================================================


class AppointmentSearchParams(BaseModel):
    """
    Schema for appointment search and filtering parameters.

    Used to query appointments with multiple filter criteria and pagination.
    All filter fields are optional - only provided filters will be applied.

    Pagination:
    - page: 1-indexed page number (default 1)
    - page_size: items per page (default 20, max 100)

    Sorting:
    - sort_by: field name (default "start_time")
    - sort_order: "asc" or "desc" (default "asc")
    """

    patient_id: Optional[int] = Field(None, gt=0, description="Filter by patient ID")
    doctor_id: Optional[int] = Field(None, gt=0, description="Filter by doctor ID")
    type: Optional[AppointmentType] = Field(None, description="Filter by appointment type")
    status: Optional[AppointmentStatus] = Field(None, description="Filter by appointment status")
    start_date: Optional[datetime] = Field(None, description="Filter appointments from this date (UTC)")
    end_date: Optional[datetime] = Field(None, description="Filter appointments until this date (UTC)")
    is_first_visit: Optional[bool] = Field(None, description="Filter by first visit status")
    is_recurring: Optional[bool] = Field(None, description="Filter by recurring status")
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")
    sort_by: Optional[str] = Field(default="start_time", description="Field to sort by")
    sort_order: Optional[str] = Field(default="asc", pattern="^(asc|desc)$", description="Sort order (asc or desc)")


# ============================================================================
# Conflict Detection Schemas
# ============================================================================


class AppointmentConflictCheck(BaseModel):
    """
    Schema for checking if a time slot has scheduling conflicts.

    Used to detect double-bookings and find available alternative slots.
    The exclude_appointment_id field allows updates without blocking on current appointment.
    """

    doctor_id: int = Field(..., gt=0, description="Doctor ID to check availability for")
    start_time: datetime = Field(..., description="Proposed appointment start time (UTC)")
    end_time: datetime = Field(..., description="Proposed appointment end time (UTC)")
    exclude_appointment_id: Optional[int] = Field(
        None,
        gt=0,
        description="Appointment ID to exclude from conflict check (used when rescheduling)"
    )


class AppointmentConflictResponse(BaseModel):
    """
    Schema for conflict check response with alternatives.

    If has_conflict is True, conflicting_appointments lists existing appointments
    that overlap with the proposed time, and available_slots lists suggested alternatives.
    """

    has_conflict: bool = Field(..., description="Whether a conflict was detected")
    conflicting_appointments: list[AppointmentResponse] = Field(
        default_factory=list,
        description="List of existing appointments that conflict with proposed time"
    )
    available_slots: list[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of available time slots as alternatives (if conflict exists)"
    )


# ============================================================================
# Statistics Schemas
# ============================================================================


class AppointmentStatsResponse(BaseModel):
    """
    Schema for appointment statistics and reporting.

    Provides counts of appointments by status, time period, and other criteria.
    Used for dashboard widgets and analytics endpoints.
    """

    total_appointments: int = Field(..., description="Total number of appointments for time period")
    scheduled: int = Field(..., description="Count of scheduled appointments")
    confirmed: int = Field(..., description="Count of confirmed appointments")
    completed: int = Field(..., description="Count of completed appointments")
    cancelled: int = Field(..., description="Count of cancelled appointments")
    no_show: int = Field(..., description="Count of no-show appointments")
    upcoming_appointments: int = Field(..., description="Count of appointments in the future")
    past_appointments: int = Field(..., description="Count of appointments in the past")
    today_appointments: int = Field(..., description="Count of appointments today")
    this_week_appointments: int = Field(..., description="Count of appointments this week")
    this_month_appointments: int = Field(..., description="Count of appointments this month")
