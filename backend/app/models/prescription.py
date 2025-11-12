"""
Prescription model - Medical prescriptions linked to consultations
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import BaseModel


class Prescription(BaseModel):
    """
    Prescription model - Represents a medical prescription

    Attributes:
        consultation_id: ID of the consultation (FK to consultations)
        patient_id: ID of the patient (FK to patients)
        doctor_id: ID of the doctor (FK to users)
        prescription_date: Date the prescription was created
        valid_until: Expiration date of prescription
        control_date: Follow-up date when patient should return for check-up
        medications: JSON array of medications with details
        instructions: General instructions for the patient
        notes: Additional notes
        is_printed: Whether prescription has been printed
        is_delivered: Whether prescription has been delivered to patient
    """

    __tablename__ = "prescriptions"

    # Foreign Keys
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Prescription Details
    prescription_date = Column(Date, nullable=False, default=datetime.now, index=True)
    valid_until = Column(Date, nullable=True)  # Date d'expiration
    control_date = Column(Date, nullable=True)  # Date de contrôle (follow-up date)

    # Medications - Stored as JSON array
    # Example: [
    #   {
    #     "name": "Crème hydrocortisone 1%",
    #     "dosage": "Appliquer 2 fois par jour",
    #     "duration": "14 jours",
    #     "quantity": "1 tube de 30g",
    #     "instructions": "Appliquer sur les zones affectées après la douche"
    #   }
    # ]
    medications = Column(JSON, nullable=False)

    # General instructions
    instructions = Column(Text, nullable=True)  # Instructions générales
    notes = Column(Text, nullable=True)  # Notes additionnelles

    # Status
    is_printed = Column(Boolean, default=False)
    is_delivered = Column(Boolean, default=False)

    # Relationships
    # consultation = relationship("Consultation", back_populates="prescriptions")
    patient = relationship("Patient")
    doctor = relationship("User")
    # doctor = relationship("User", back_populates="prescriptions")

    @property
    def patient_name(self) -> str:
        """Get the patient's full name"""
        if self.patient:
            return self.patient.full_name
        return "N/A"

    @property
    def doctor_name(self) -> str:
        """Get the doctor's full name"""
        if self.doctor:
            return self.doctor.full_name
        return "N/A"

    def __repr__(self):
        return f"<Prescription(id={self.id}, patient_id={self.patient_id}, date={self.prescription_date})>"


class PrescriptionMedication(BaseModel):
    """
    Alternative model for storing medications as separate records
    (Can be used instead of JSON if preferred)
    """

    __tablename__ = "prescription_medications"

    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False, index=True)

    # Medication details
    medication_name = Column(String(200), nullable=False)
    dosage = Column(String(200), nullable=False)  # Posologie
    duration = Column(String(100), nullable=True)  # Durée
    quantity = Column(String(100), nullable=True)  # Quantité
    frequency = Column(String(100), nullable=True)  # Fréquence (e.g., "2 fois par jour")
    route = Column(String(50), nullable=True)  # Voie d'administration (oral, topical, etc.)
    instructions = Column(Text, nullable=True)  # Instructions spécifiques

    # Relationships
    # prescription = relationship("Prescription", back_populates="medication_items")

    def __repr__(self):
        return f"<PrescriptionMedication(id={self.id}, medication={self.medication_name})>"
