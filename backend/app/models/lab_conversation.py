"""
Lab Conversation Models - Independent AI chat system for lab analysis
Truly independent - NO patient context
"""

from datetime import datetime
from typing import Optional
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship

from app.db.base import Base


class MessageRole(str, enum.Enum):
    """Message role in conversation"""
    USER = "USER"           # Doctor's message
    ASSISTANT = "ASSISTANT"  # AI response
    SYSTEM = "SYSTEM"       # System notification


class MessageType(str, enum.Enum):
    """Type of message content"""
    TEXT = "TEXT"           # Plain text message
    FILE = "FILE"           # File upload with text
    ANALYSIS = "ANALYSIS"   # AI analysis result
    ERROR = "ERROR"         # Error message


class AttachmentType(str, enum.Enum):
    """Type of file attachment"""
    LAB_RESULT = "LAB_RESULT"
    IMAGE = "IMAGE"
    PDF = "PDF"
    OTHER = "OTHER"


class LabConversation(Base):
    """
    Conversation metadata and settings
    Independent mode - no patient links
    """
    __tablename__ = "lab_conversations"

    id = Column(Integer, primary_key=True, index=True)

    # Doctor ownership (only link required)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Conversation metadata
    title = Column(String(255), nullable=False, default="New Lab Analysis Chat")
    description = Column(Text, nullable=True)

    # AI settings
    default_model = Column(String(100), nullable=True)  # e.g., "claude-sonnet-4-5-20250929"
    system_prompt = Column(Text, nullable=True)  # Custom system instructions
    temperature = Column(Float, default=0.7)

    # Conversation state
    message_count = Column(Integer, default=0)
    last_message_at = Column(DateTime, nullable=True)

    # Organization
    is_pinned = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    doctor = relationship("User", backref="lab_conversations")
    messages = relationship("LabMessage", back_populates="conversation", cascade="all, delete-orphan")


class LabMessage(Base):
    """
    Individual message in a conversation
    Stores user and AI messages with metadata
    """
    __tablename__ = "lab_messages"

    id = Column(Integer, primary_key=True, index=True)

    # Conversation link
    conversation_id = Column(Integer, ForeignKey("lab_conversations.id"), nullable=False, index=True)

    # Message content
    role = Column(SQLEnum(MessageRole), nullable=False)  # USER, ASSISTANT, SYSTEM
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT)
    content = Column(Text, nullable=False)

    # AI-specific metadata (for assistant messages)
    model_used = Column(String(100), nullable=True)  # Which model generated this
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)

    # File attachments flag
    has_attachments = Column(Boolean, default=False)

    # Edit tracking
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("LabConversation", back_populates="messages")
    attachments = relationship("LabMessageAttachment", back_populates="message", cascade="all, delete-orphan")


class LabMessageAttachment(Base):
    """
    File attachments for messages
    Supports lab results, images, PDFs
    """
    __tablename__ = "lab_message_attachments"

    id = Column(Integer, primary_key=True, index=True)

    # Message link
    message_id = Column(Integer, ForeignKey("lab_messages.id"), nullable=False, index=True)

    # File metadata
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # bytes
    file_type = Column(SQLEnum(AttachmentType), nullable=False)
    mime_type = Column(String(100), nullable=True)

    # Processing status
    is_processed = Column(Boolean, default=False)
    extracted_data = Column(JSON, nullable=True)  # OCR/extraction results

    # Optional link to analysis
    ai_analysis_id = Column(Integer, ForeignKey("ai_analyses.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    message = relationship("LabMessage", back_populates="attachments")
    ai_analysis = relationship("AIAnalysis", backref="attachment")
