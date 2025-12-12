"""
Audit Log model - Tracks actions on AI analyses for compliance
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Enum, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import BaseModel

class AuditAction(str, enum.Enum):
    CREATED = "CREATED"
    VIEWED = "VIEWED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"
    DELETED = "DELETED"

class AIAnalysisAuditLog(BaseModel):
    """
    Audit log for AI analysis actions
    """
    __tablename__ = "ai_analysis_audit_logs"

    analysis_id = Column(Integer, ForeignKey("ai_analyses.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    
    action = Column(Enum(AuditAction), nullable=False)
    changes = Column(JSON, nullable=True)  # What changed (diff)
    
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.now, nullable=False)
    
    # Relationships
    analysis = relationship("AIAnalysis", back_populates="audit_logs", foreign_keys="AIAnalysisAuditLog.analysis_id")
    user = relationship("User", backref="audit_logs", foreign_keys="AIAnalysisAuditLog.user_id")
