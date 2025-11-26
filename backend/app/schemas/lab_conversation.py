"""
Pydantic schemas for Lab Conversations and Messages
Request/response models for chat API endpoints
"""

from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.models.lab_conversation import MessageRole, MessageType, AttachmentType


# ============================================================================
# Attachment Schemas
# ============================================================================

class AttachmentBase(BaseModel):
    """Base attachment schema"""
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    file_type: AttachmentType
    mime_type: Optional[str] = None


class AttachmentCreate(AttachmentBase):
    """Create attachment"""
    pass


class AttachmentResponse(AttachmentBase):
    """Attachment response"""
    id: int
    is_processed: bool
    extracted_data: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Message Schemas
# ============================================================================

class MessageBase(BaseModel):
    """Base message schema"""
    content: str = Field(..., min_length=1, max_length=10000)
    role: MessageRole
    message_type: MessageType = MessageType.TEXT


class MessageCreate(BaseModel):
    """Create message (for sending to AI)"""
    content: str = Field(..., min_length=1, max_length=10000)
    model: Optional[str] = None  # Override conversation default
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)


class MessageResponse(BaseModel):
    """Message response with all metadata"""
    id: int
    conversation_id: int
    role: MessageRole
    message_type: MessageType
    content: str
    model_used: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    processing_time_ms: Optional[int] = None
    has_attachments: bool
    attachments: List[AttachmentResponse] = []
    is_edited: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """Paginated message list response"""
    items: List[MessageResponse]
    total: int
    skip: int
    limit: int


# ============================================================================
# Conversation Schemas
# ============================================================================

class ConversationBase(BaseModel):
    """Base conversation schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class ConversationCreate(BaseModel):
    """Create conversation"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    default_model: Optional[str] = None
    system_prompt: Optional[str] = Field(None, max_length=5000)


class ConversationUpdate(BaseModel):
    """Update conversation"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    default_model: Optional[str] = None
    system_prompt: Optional[str] = Field(None, max_length=5000)
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None


class ConversationResponse(ConversationBase):
    """Conversation response"""
    id: int
    doctor_id: int
    default_model: Optional[str] = None
    system_prompt: Optional[str] = None
    message_count: int
    last_message_at: Optional[datetime] = None
    is_pinned: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    """Conversation with messages"""
    messages: List[MessageResponse] = []


class ConversationListResponse(BaseModel):
    """Paginated conversation list"""
    items: List[ConversationResponse]
    total: int
    skip: int
    limit: int


# ============================================================================
# Streaming Response Schemas
# ============================================================================

class StreamEventStart(BaseModel):
    """SSE event: message start"""
    event: str = "message_start"
    message_id: int
    timestamp: datetime


class StreamEventDelta(BaseModel):
    """SSE event: content delta (streaming chunk)"""
    event: str = "content_delta"
    delta: str  # Chunk of text
    accumulated: str  # Full text so far


class StreamEventComplete(BaseModel):
    """SSE event: message complete"""
    event: str = "message_complete"
    message_id: int
    total_tokens: int
    processing_time_ms: int


# ============================================================================
# Analysis Link Schemas
# ============================================================================

class LinkAnalysisRequest(BaseModel):
    """Link existing analysis to message"""
    analysis_id: int


class ConversationAnalytics(BaseModel):
    """Conversation analytics/stats"""
    total_messages: int
    user_messages: int
    assistant_messages: int
    total_tokens_used: int
    total_processing_time_ms: int
    files_uploaded: int
    models_used: List[str]


# ============================================================================
# Error Schemas
# ============================================================================

class ErrorResponse(BaseModel):
    """API error response"""
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
