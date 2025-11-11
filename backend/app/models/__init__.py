"""
Database models
"""

from app.models.user import User, UserRole
from app.models.patient import Patient, Gender, IdentificationType
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.consultation import Consultation
from app.models.prescription import Prescription, PrescriptionMedication
from app.models.image import ConsultationImage

__all__ = [
    "User",
    "UserRole",
    "Patient",
    "Gender",
    "IdentificationType",
    "Appointment",
    "AppointmentStatus",
    "AppointmentType",
    "Consultation",
    "Prescription",
    "PrescriptionMedication",
    "ConsultationImage",
]
