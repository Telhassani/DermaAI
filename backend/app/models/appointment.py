"""
Appointment model - Scheduling and calendar management

This module defines the Appointment model for managing doctor-patient appointments,
including support for recurring appointments and status tracking.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, Text, Boolean, JSON
from sqlalchemy.orm import relationship
import enum

from app.db.base import BaseModel


# ============================================================================
# Enumerations
# ============================================================================


class AppointmentStatus(str, enum.Enum):
    """Appointment status enumeration - tracks the lifecycle of an appointment"""

    SCHEDULED = "scheduled"      # Initial state, awaiting confirmation
    CONFIRMED = "confirmed"      # Patient confirmed attendance
    IN_PROGRESS = "in_progress"  # Currently happening
    COMPLETED = "completed"      # Finished successfully
    CANCELLED = "cancelled"      # Cancelled by doctor or patient
    NO_SHOW = "no_show"          # Patient didn't show up


class AppointmentType(str, enum.Enum):
    """Appointment type enumeration - categorizes appointment purpose"""

    CONSULTATION = "consultation"  # Initial consultation
    FOLLOW_UP = "follow_up"        # Follow-up visit
    PROCEDURE = "procedure"        # Medical procedure
    EMERGENCY = "emergency"        # Emergency appointment


# ============================================================================
# Model
# ============================================================================


class Appointment(BaseModel):
    """
    Appointment model for scheduling doctor-patient appointments.

    Supports both single and recurring appointments with comprehensive status tracking.

    Attributes:
        patient_id (int): Reference to patient (FK)
        doctor_id (int): Reference to doctor/user (FK)
        start_time (datetime): Appointment start time (indexed for queries)
        end_time (datetime): Appointment end time
        type (AppointmentType): Type of appointment (consultation, follow-up, etc.)
        status (AppointmentStatus): Current appointment status
        reason (str, optional): Reason for visit or chief complaint
        notes (str, optional): Doctor's clinical notes during appointment
        diagnosis (str, optional): Diagnosis made during appointment
        is_first_visit (bool): Whether this is patient's first visit
        reminder_sent (bool): Whether automated reminder was sent
        recurrence_rule (dict, optional): RFC 5545 format recurrence rule for recurring appointments
        recurring_series_id (int, optional): ID of parent series if part of recurrence

    Indices:
        - patient_id: For fetching patient's appointments
        - doctor_id: For fetching doctor's appointments
        - start_time: For calendar views and schedule queries
        - status: For filtering by appointment state

    Note:
        Relationships to Patient and User are commented out but can be enabled
        when eager loading is needed. Use lazy loading otherwise for performance.
    """

    __tablename__ = "appointments"

    # Foreign Keys with Indices
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Core Scheduling Fields
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)

    # Classification
    type = Column(
        SQLEnum(AppointmentType, name="appointment_type"),
        nullable=False,
        default=AppointmentType.CONSULTATION,
    )

    status = Column(
        SQLEnum(AppointmentStatus, name="appointment_status"),
        nullable=False,
        default=AppointmentStatus.SCHEDULED,
        index=True,
    )

    # Content Fields
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)

    # Tracking Flags
    is_first_visit = Column(Boolean, default=False, nullable=False)
    reminder_sent = Column(Boolean, default=False, nullable=False)

    # Recurrence Support
    recurrence_rule = Column(JSON, nullable=True)  # RFC 5545 format recurrence rule
    recurring_series_id = Column(Integer, nullable=True, index=True)  # Parent series ID

    # Relationships (commented to avoid eager loading issues - use lazy loading)
    # patient = relationship("Patient", back_populates="appointments")
    # doctor = relationship("User", back_populates="appointments")

    def __repr__(self) -> str:
        """String representation of appointment"""
        return (
            f"<Appointment("
            f"id={self.id}, "
            f"patient_id={self.patient_id}, "
            f"date={self.start_time.strftime('%Y-%m-%d %H:%M')}"
            f")>"
        )

    # ========================================================================
    # Properties
    # ========================================================================

    @property
    def duration_minutes(self) -> int:
        """
        Calculate appointment duration in minutes.

        Returns:
            int: Duration between start and end time in minutes
        """
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() / 60)

    @property
    def is_upcoming(self) -> bool:
        """
        Check if appointment is in the future and not completed.

        Returns:
            bool: True if appointment is scheduled/confirmed and in the future
        """
        now = datetime.utcnow()
        return self.start_time > now and self.status in [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
        ]

    @property
    def is_past(self) -> bool:
        """
        Check if appointment is in the past.

        Returns:
            bool: True if appointment end time is before current time
        """
        now = datetime.utcnow()
        return self.end_time < now

    @property
    def is_recurring(self) -> bool:
        """
        Check if appointment is part of a recurring series.

        Returns:
            bool: True if appointment has recurrence_rule or recurring_series_id
        """
        return self.recurrence_rule is not None or self.recurring_series_id is not None

    # ========================================================================
    # Methods
    # ========================================================================

    def can_be_rescheduled(self) -> bool:
        """
        Determine if appointment can be rescheduled.

        An appointment can be rescheduled if:
        - It's not in the past
        - It's not already completed or cancelled

        Returns:
            bool: True if appointment can be rescheduled
        """
        if self.is_past or self.status in [
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
        ]:
            return False
        return True

    def can_be_cancelled(self) -> bool:
        """
        Determine if appointment can be cancelled.

        An appointment can be cancelled if:
        - It's not already cancelled or completed
        - It's not in progress

        Returns:
            bool: True if appointment can be cancelled
        """
        if self.status in [
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.IN_PROGRESS,
        ]:
            return False
        return True
