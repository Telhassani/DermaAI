from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.ai_analysis import AnalysisType, Severity, AnalysisStatus, AIProvider

# Shared properties
class AIAnalysisBase(BaseModel):
    analysis_type: AnalysisType
    patient_id: int
    consultation_id: Optional[int] = None
    ai_provider: AIProvider = AIProvider.CLAUDE
    ai_model: Optional[str] = "claude-3-5-sonnet-20241022"

# Properties to receive on creation
class AIAnalysisCreate(AIAnalysisBase):
    image_data: Optional[str] = None  # Base64
    previous_analysis_id: Optional[int] = None  # For comparison
    additional_notes: Optional[str] = None

# Properties to receive on update
class AIAnalysisUpdate(BaseModel):
    status: Optional[AnalysisStatus] = None
    doctor_feedback: Optional[str] = None
    doctor_modified_diagnosis: Optional[str] = None
    feedback_rating: Optional[int] = None
    is_flagged_for_review: Optional[bool] = None
    flagged_reason: Optional[str] = None

# Properties shared by models stored in DB
class AIAnalysisInDBBase(AIAnalysisBase):
    id: int
    doctor_id: int
    created_at: datetime
    updated_at: datetime
    
    # Analysis Results
    primary_diagnosis: Optional[str] = None
    differential_diagnoses: Optional[List[Dict[str, Any]]] = None
    confidence_score: Optional[float] = None
    severity: Optional[Severity] = None
    clinical_findings: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    reasoning: Optional[str] = None
    key_features_identified: Optional[List[str]] = None
    risk_factors: Optional[List[str]] = None
    
    status: AnalysisStatus
    
    class Config:
        orm_mode = True

# Properties to return to client
class AIAnalysisResponse(AIAnalysisInDBBase):
    pass

class AIAnalysisList(BaseModel):
    items: List[AIAnalysisResponse]
    total: int
