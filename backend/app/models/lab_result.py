"""
Lab Result model - Stores laboratory test results
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
import enum

from app.db.base import BaseModel

class TestType(str, enum.Enum):
    BLOOD = "BLOOD"
    BIOPSY = "BIOPSY"
    CULTURE = "CULTURE"
    ALLERGY = "ALLERGY"
    HORMONE = "HORMONE"
    OTHER = "OTHER"

class LabResult(BaseModel):
    """
    LabResult model - Stores laboratory test results
    """
    __tablename__ = "lab_results"

    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, nullable=False, index=True)  # TODO: Migrate to UUID to match profiles table
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=True, index=True)
    
    # Lab Information
    test_type = Column(Enum(TestType), default=TestType.BLOOD)
    test_name = Column(String(255), nullable=False)
    test_date = Column(Date, nullable=False)
    lab_facility = Column(String(255), nullable=True)
    
    # Results Storage
    raw_data = Column(Text, nullable=True)  # OCR extracted text
    structured_data = Column(JSON, nullable=True)  # Parsed values
    
    # File Info
    file_type = Column(String(50), nullable=True)  # PDF, IMAGE, MANUAL
    file_url = Column(String(500), nullable=True)  # Path to file
    
    # AI Analysis Link
    ai_analysis_id = Column(Integer, ForeignKey("ai_analyses.id"), nullable=True)
    
    # Meta
    is_manually_entered = Column(Boolean, default=False)
    
    # Relationships
    patient = relationship("Patient", backref="lab_results")
    # doctor = relationship("User", backref="lab_results")  # Disabled until doctor_id migrated to UUID
    consultation = relationship("Consultation", backref="lab_results")
    ai_analysis = relationship("AIAnalysis", backref="lab_results")
