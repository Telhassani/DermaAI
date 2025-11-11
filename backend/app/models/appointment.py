"""
Appointment model - Scheduling and calendar management
"""

from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
import enum

from app.db.base import BaseModel


class AppointmentStatus(str, enum.Enum):
    """Appointment status enumeration"""

    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class AppointmentType(str, enum.Enum):
    """Appointment type enumeration"""

    CONSULTATION = "consultation"
    FOLLOW_UP = "follow_up"
    PROCEDURE = "procedure"
    EMERGENCY = "emergency"


class Appointment(BaseModel):
    """
    Appointment model

    Attributes:
        patient_id: ID of the patient (FK)
        doctor_id: ID of the doctor (FK)
        start_time: Appointment start time
        end_time: Appointment end time
        type: Type of appointment
        status: Current status
        reason: Reason for visit
        notes: Doctor's notes
        diagnosis: Diagnosis after consultation
        is_first_visit: Whether this is patient's first visit
        reminder_sent: Whether reminder was sent
    """

    __tablename__ = "appointments"

    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)

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

    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)

    is_first_visit = Column(Boolean, default=False, nullable=False)
    reminder_sent = Column(Boolean, default=False, nullable=False)

    # Relationships
    # patient = relationship("Patient", back_populates="appointments")
    # doctor = relationship("User", back_populates="appointments")
    # prescriptions = relationship("Prescription", back_populates="appointment")

    def __repr__(self):
        return f"<Appointment(id={self.id}, patient_id={self.patient_id}, date={self.start_time})>"

    @property
    def duration_minutes(self) -> int:
        """Calculate appointment duration in minutes"""
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() / 60)

    @property
    def is_upcoming(self) -> bool:
        """Check if appointment is upcoming"""
        from datetime import datetime

        return self.start_time > datetime.utcnow() and self.status in [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
        ]

    @property
    def is_past(self) -> bool:
        """Check if appointment is in the past"""
        from datetime import datetime

        return self.end_time < datetime.utcnow()
