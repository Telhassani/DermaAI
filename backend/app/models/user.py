"""
User model - Authentication and authorization
Maps to 'profiles' table in Supabase database
Integrated with Supabase Auth for authentication
"""

from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import enum
import uuid

from app.db.base import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""

    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    SECRETARY = "SECRETARY"
    ASSISTANT = "ASSISTANT"


class User(Base):
    """
    User model for authentication and authorization
    Maps to the 'profiles' table in Supabase database

    Attributes:
        id: UUID primary key (matches Supabase auth.users.id)
        email: User email (from Supabase Auth)
        full_name: User's full name
        role: User role (ADMIN, DOCTOR, SECRETARY, ASSISTANT)
        is_active: Whether user account is active
        is_verified: Whether email is verified
        phone: User phone number
        mfa_enabled: Whether MFA is enabled
        mfa_secret: TOTP secret for MFA
    """

    __tablename__ = "profiles"

    # Primary key - UUID for Supabase integration
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic user info
    email = Column(String(255), nullable=False, unique=True, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole, name="user_role", create_type=False),
        nullable=False,
        default=UserRole.DOCTOR,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    phone = Column(String(50), nullable=True)

    # Multi-Factor Authentication
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(255), nullable=True)

    # Password storage (for local authentication when not using Supabase Auth)
    hashed_password = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    patients = relationship("Patient", back_populates="doctor", foreign_keys="Patient.doctor_id")
    appointments = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")
    consultations = relationship("Consultation", back_populates="doctor", foreign_keys="Consultation.doctor_id")
    prescriptions = relationship("Prescription", back_populates="doctor", foreign_keys="Prescription.doctor_id")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

    @property
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role == UserRole.ADMIN

    @property
    def is_doctor(self) -> bool:
        """Check if user is doctor"""
        return self.role == UserRole.DOCTOR

    @property
    def can_prescribe(self) -> bool:
        """Check if user can create prescriptions"""
        return self.role in [UserRole.ADMIN, UserRole.DOCTOR]
