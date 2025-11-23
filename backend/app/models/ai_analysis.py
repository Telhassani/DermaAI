"""
AI Analysis model - Stores results of AI analysis for images and lab results
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Float, Enum, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import BaseModel

class AnalysisType(str, enum.Enum):
    IMAGE = "IMAGE"
    LAB_RESULT = "LAB_RESULT"
    COMBINED = "COMBINED"

class AIProvider(str, enum.Enum):
    CLAUDE = "CLAUDE"
    OPENAI = "OPENAI"
    CUSTOM = "CUSTOM"

class Severity(str, enum.Enum):
    BENIGN = "BENIGN"
    MILD = "MILD"
    MODERATE = "MODERATE"
    SEVERE = "SEVERE"
    CRITICAL = "CRITICAL"
    UNKNOWN = "UNKNOWN"

class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"

class AIAnalysis(BaseModel):
    """
    AIAnalysis model - Stores AI analysis results
    """
    __tablename__ = "ai_analyses"

    # Core fields
    analysis_type = Column(Enum(AnalysisType), nullable=False)
    
    # Relationships
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=True, index=True)
    
    # AI Processing Metadata
    ai_provider = Column(Enum(AIProvider), default=AIProvider.CLAUDE)
    ai_model = Column(String(100), default="claude-3-5-sonnet-20241022")
    processing_time_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    
    # Input/Output
    input_data = Column(JSON, nullable=True)  # Structured input sent to AI
    prompt_template = Column(String(255), nullable=True)
    
    # Analysis Results
    primary_diagnosis = Column(String(255), nullable=True)
    differential_diagnoses = Column(JSON, nullable=True)  # List of potential diagnoses with probabilities
    confidence_score = Column(Float, nullable=True)  # 0.0 to 1.0
    severity = Column(Enum(Severity), default=Severity.UNKNOWN)
    clinical_findings = Column(JSON, nullable=True)  # List of findings
    recommendations = Column(JSON, nullable=True)  # Structured recommendations with actions
    
    # Explanations
    reasoning = Column(Text, nullable=True)
    key_features_identified = Column(JSON, nullable=True)
    risk_factors = Column(JSON, nullable=True)
    
    # Lab specific
    lab_values_extracted = Column(JSON, nullable=True)
    abnormal_values = Column(JSON, nullable=True)
    reference_ranges = Column(JSON, nullable=True)
    
    # Doctor Review
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING, index=True)
    doctor_feedback = Column(Text, nullable=True)
    doctor_modified_diagnosis = Column(String(255), nullable=True)
    feedback_rating = Column(Integer, nullable=True)  # 1-5
    reviewed_at = Column(DateTime, nullable=True)
    
    # Flags
    is_flagged_for_review = Column(Boolean, default=False)
    flagged_reason = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    patient = relationship("Patient", backref="ai_analyses")
    doctor = relationship("User", backref="ai_analyses")
    consultation = relationship("Consultation", backref="ai_analyses")
    images = relationship("AIAnalysisImage", back_populates="analysis", cascade="all, delete-orphan")
    audit_logs = relationship("AIAnalysisAuditLog", back_populates="analysis", cascade="all, delete-orphan")

class AIAnalysisImage(BaseModel):
    """
    Link between AI Analysis and specific images, with region of interest support
    """
    __tablename__ = "ai_analysis_images"
    
    analysis_id = Column(Integer, ForeignKey("ai_analyses.id"), nullable=False, index=True)
    # We store the image path or ID. Assuming we might have an Image model later, 
    # but for now we might just store the path or link to a future Image table.
    # Given the prompt implies existing images, let's assume we store a reference.
    # For now, let's assume we are linking to a file path or ID if we had an Image table.
    # The prompt mentions "image_id" in AIAnalysis, but here we allow multiple images per analysis.
    # Let's add an image_path or reference.
    image_path = Column(String(500), nullable=False) 
    
    # Analysis specific to this image
    regions_of_interest = Column(JSON, nullable=True)  # Bounding boxes
    image_findings = Column(Text, nullable=True)
    confidence_for_this_image = Column(Float, nullable=True)
    
    analysis = relationship("AIAnalysis", back_populates="images")
