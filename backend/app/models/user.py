"""
User model - Authentication and authorization
"""

from sqlalchemy import Column, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.base import BaseModel


class UserRole(str, enum.Enum):
    """User role enumeration"""

    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    SECRETARY = "SECRETARY"
    ASSISTANT = "ASSISTANT"


class User(BaseModel):
    """
    User model for authentication and authorization

    Attributes:
        email: User email (unique, used for login)
        hashed_password: Bcrypt hashed password
        full_name: User's full name
        role: User role (admin, doctor, secretary, assistant)
        is_active: Whether user account is active
        is_verified: Whether email is verified
        phone: User phone number
        mfa_enabled: Whether MFA is enabled
        mfa_secret: TOTP secret for MFA
    """

    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.DOCTOR,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    phone = Column(String(50), nullable=True)

    # Multi-Factor Authentication
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(255), nullable=True)

    # Relationships (to be added later)
    patients = relationship("Patient", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")

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
