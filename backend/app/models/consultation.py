"""
Consultation model - Medical consultation records for dermatology
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import BaseModel


class Consultation(BaseModel):
    """
    Consultation model - Represents a dermatology consultation

    Attributes:
        patient_id: ID of the patient (FK to patients)
        doctor_id: ID of the doctor (FK to users)
        consultation_date: Date of the consultation
        consultation_time: Time of the consultation
        chief_complaint: Main reason for visit (motif de consultation)
        symptoms: Patient symptoms description
        duration_symptoms: How long patient has had symptoms
        medical_history_notes: Additional medical history for this visit
        clinical_examination: Clinical examination findings
        dermatological_examination: Dermatological-specific examination
        lesion_type: Type of skin lesion (e.g., macule, papule, nodule, etc.)
        lesion_location: Location of lesion(s) on body
        lesion_size: Size of lesion(s)
        lesion_color: Color of lesion(s)
        lesion_texture: Texture of lesion(s)
        diagnosis: Diagnosis or suspected diagnosis
        differential_diagnosis: Other possible diagnoses
        treatment_plan: Treatment plan description
        follow_up_required: Whether follow-up is needed
        follow_up_date: Recommended follow-up date
        notes: Additional notes and remarks
        private_notes: Private notes (only visible to doctor)
        images_taken: Whether images were taken during consultation
        biopsy_performed: Whether biopsy was performed
        biopsy_results: Biopsy results if performed
    """

    __tablename__ = "consultations"

    # Foreign Keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, index=True)

    # Consultation Details
    consultation_date = Column(Date, nullable=False, index=True, default=datetime.now)
    consultation_time = Column(DateTime, nullable=False, default=datetime.now)

    # Chief Complaint
    chief_complaint = Column(Text, nullable=False)  # Motif de consultation
    symptoms = Column(Text, nullable=True)
    duration_symptoms = Column(String(100), nullable=True)  # e.g., "2 semaines", "3 mois"

    # Medical History for this visit
    medical_history_notes = Column(Text, nullable=True)

    # Clinical Examination
    clinical_examination = Column(Text, nullable=True)

    # Dermatological Examination (Specific to dermatology)
    dermatological_examination = Column(Text, nullable=True)
    lesion_type = Column(String(200), nullable=True)  # Type de lésion
    lesion_location = Column(String(200), nullable=True)  # Localisation
    lesion_size = Column(String(100), nullable=True)  # Taille
    lesion_color = Column(String(100), nullable=True)  # Couleur
    lesion_texture = Column(String(100), nullable=True)  # Texture

    # Diagnosis
    diagnosis = Column(Text, nullable=True)  # Diagnostic
    differential_diagnosis = Column(Text, nullable=True)  # Diagnostic différentiel

    # Treatment
    treatment_plan = Column(Text, nullable=True)  # Plan de traitement

    # Follow-up
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(Date, nullable=True)

    # Notes
    notes = Column(Text, nullable=True)  # Remarques générales
    private_notes = Column(Text, nullable=True)  # Notes privées du médecin

    # Additional Info
    images_taken = Column(Boolean, default=False)
    biopsy_performed = Column(Boolean, default=False)
    biopsy_results = Column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", foreign_keys="Consultation.patient_id")
    doctor = relationship("User", back_populates="consultations", foreign_keys="Consultation.doctor_id")
    prescriptions = relationship("Prescription", back_populates="consultation", cascade="all, delete-orphan")
    # images = relationship("ConsultationImage", back_populates="consultation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Consultation(id={self.id}, patient_id={self.patient_id}, date={self.consultation_date})>"
