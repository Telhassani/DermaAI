"""
Patient model - Core entity for dermatology practice
"""

from sqlalchemy import Column, String, Date, Enum as SQLEnum, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum

from app.db.base import BaseModel


class Gender(str, enum.Enum):
    """Gender enumeration"""

    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class IdentificationType(str, enum.Enum):
    """Identification type enumeration"""

    CIN = "cin"  # Carte d'Identité Nationale
    PASSPORT = "passport"  # Passeport


class Patient(BaseModel):
    """
    Patient model

    Attributes:
        identification_type: Type of identification (CIN or Passport)
        identification_number: Identification number (unique)
        first_name: Patient's first name
        last_name: Patient's last name
        date_of_birth: Date of birth
        gender: Gender (male, female, other)
        email: Patient email
        phone: Patient phone number
        address: Patient address
        city: City
        postal_code: Postal code
        country: Country
        insurance_number: Health insurance number
        allergies: Known allergies (comma-separated)
        medical_history: Medical history notes
        doctor_id: ID of assigned doctor (FK to users)
    """

    __tablename__ = "patients"

    # Identification (UNIQUE KEY)
    identification_type = Column(
        SQLEnum(IdentificationType, name="identification_type"), nullable=False
    )
    identification_number = Column(String(50), nullable=False, unique=True, index=True)

    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(SQLEnum(Gender, name="gender"), nullable=False)

    # Contact information
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=False)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True, default="France")

    # Medical information
    insurance_number = Column(String(100), nullable=True, index=True)
    allergies = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)

    # Relationships
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="patients")
    appointments = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient", cascade="all, delete-orphan")
    consultations = relationship("Consultation", foreign_keys="Consultation.patient_id", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", foreign_keys="Prescription.patient_id", back_populates="patient", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Patient(id={self.id}, name={self.full_name})>"

    @property
    def full_name(self) -> str:
        """Get patient's full name"""
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self) -> int:
        """Calculate patient's age"""
        from datetime import date

        today = date.today()
        return (
            today.year
            - self.date_of_birth.year
            - (
                (today.month, today.day)
                < (self.date_of_birth.month, self.date_of_birth.day)
            )
        )
