"""
Database models
"""

from app.models.user import User, UserRole
from app.models.patient import Patient, Gender, IdentificationType
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.consultation import Consultation
from app.models.prescription import Prescription, PrescriptionMedication
from app.models.image import ConsultationImage
from app.models.ai_analysis import AIAnalysis, AIAnalysisImage, AnalysisType, Severity, AnalysisStatus
from app.models.lab_result import LabResult, TestType
from app.models.audit_log import AIAnalysisAuditLog, AuditAction
from app.models.lab_conversation import (
    LabConversation,
    LabMessage,
    LabMessageAttachment,
    MessageRole,
    MessageType,
    AttachmentType,
)

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
    "AIAnalysis",
    "AIAnalysisImage",
    "AnalysisType",
    "Severity",
    "AnalysisStatus",
    "LabResult",
    "TestType",
    "AIAnalysisAuditLog",
    "AuditAction",
    "LabConversation",
    "LabMessage",
    "LabMessageAttachment",
    "MessageRole",
    "MessageType",
    "AttachmentType",
]
