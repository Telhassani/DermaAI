"""
Lab Conversations API - Endpoints for multi-turn AI chat system
Provides conversation management, messaging, and AI interaction for lab analysis
Independent mode - NO patient context
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models import User
from app.models.lab_conversation import (
    LabConversation,
    LabMessage,
    MessageRole,
    MessageType,
    AttachmentType,
)
from app.schemas.lab_conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    MessageCreate,
    MessageResponse,
    MessageListResponse,
    ConversationAnalytics,
)
from app.services.lab_conversation_service import (
    LabConversationService,
    LabMessageService,
    LabMessageAttachmentService,
    ConversationAnalyticsService,
)
from app.services.ai_model_router import ai_model_router
from app.core.logging import log_audit_event

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# CONVERSATION CRUD ENDPOINTS
# ============================================================================


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=201,
    summary="Create a new lab conversation",
)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create a new independent lab analysis chat conversation.

    The conversation is independent - no patient context required.
    Supports custom system prompts and model selection.

    - **title**: Conversation title (auto-generated if not provided)
    - **description**: Optional description
    - **default_model**: Default AI model for responses (e.g., claude-sonnet-4-5-20250929)
    - **system_prompt**: Custom system instructions for the AI
    - **temperature**: Creativity level (0.0-1.0, default 0.7)
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create conversations")

    conversation = LabConversationService.create_conversation(
        db, current_user.id, data
    )
    log_audit_event(current_user, "CREATE_LAB_CONVERSATION", f"conversation_id={conversation.id}")
    return conversation


@router.get(
    "/conversations",
    response_model=ConversationListResponse,
    summary="List all conversations for current doctor",
)
async def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_archived: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List all conversations for the current doctor.

    Supports filtering by archive status and searching by title/description.
    Results are ordered by: pinned first, then by last message time.

    - **skip**: Number of results to skip (pagination)
    - **limit**: Maximum results to return
    - **is_archived**: Filter by archive status (true/false/null)
    - **search**: Search in title and description
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can list conversations")

    conversations, total = LabConversationService.list_conversations(
        db,
        current_user.id,
        skip=skip,
        limit=limit,
        is_archived=is_archived,
        search=search,
    )

    log_audit_event(current_user, "LIST_LAB_CONVERSATIONS", f"count={len(conversations)}")

    return ConversationListResponse(
        conversations=conversations,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
    summary="Get conversation with recent messages",
)
async def get_conversation(
    conversation_id: int,
    message_limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get a single conversation with its recent message history.

    - **conversation_id**: ID of the conversation
    - **message_limit**: Maximum number of messages to return (pagination)
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view conversations")

    conversation = LabConversationService.get_conversation(
        db, conversation_id, current_user.id
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get recent messages
    messages, _ = LabMessageService.list_messages(
        db, conversation_id, skip=0, limit=message_limit
    )

    log_audit_event(current_user, "VIEW_LAB_CONVERSATION", f"conversation_id={conversation_id}")

    return ConversationDetailResponse(
        **{**conversation.__dict__, "messages": messages}
    )


@router.put(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    summary="Update conversation settings",
)
async def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update conversation metadata and settings.

    Can update: title, description, default model, system prompt, temperature,
    pinned status, and archive status.

    - **conversation_id**: ID of the conversation to update
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update conversations")

    conversation = LabConversationService.update_conversation(
        db, conversation_id, current_user.id, data
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    log_audit_event(current_user, "UPDATE_LAB_CONVERSATION", f"conversation_id={conversation_id}")
    return conversation


@router.delete(
    "/conversations/{conversation_id}",
    status_code=204,
    summary="Delete a conversation",
)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a conversation and all its messages.

    - **conversation_id**: ID of the conversation to delete
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can delete conversations")

    success = LabConversationService.delete_conversation(
        db, conversation_id, current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")

    log_audit_event(current_user, "DELETE_LAB_CONVERSATION", f"conversation_id={conversation_id}")


@router.patch(
    "/conversations/{conversation_id}/pin",
    response_model=ConversationResponse,
    summary="Pin or unpin a conversation",
)
async def pin_conversation(
    conversation_id: int,
    is_pinned: bool = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Pin or unpin a conversation (appears at top of list).

    - **conversation_id**: ID of the conversation
    - **is_pinned**: true to pin, false to unpin
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can manage conversations")

    conversation = LabConversationService.pin_conversation(
        db, conversation_id, current_user.id, is_pinned
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    log_audit_event(
        current_user,
        "PIN_LAB_CONVERSATION" if is_pinned else "UNPIN_LAB_CONVERSATION",
        f"conversation_id={conversation_id}",
    )
    return conversation


@router.patch(
    "/conversations/{conversation_id}/archive",
    response_model=ConversationResponse,
    summary="Archive or unarchive a conversation",
)
async def archive_conversation(
    conversation_id: int,
    is_archived: bool = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Archive or unarchive a conversation.

    - **conversation_id**: ID of the conversation
    - **is_archived**: true to archive, false to unarchive
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can manage conversations")

    conversation = LabConversationService.archive_conversation(
        db, conversation_id, current_user.id, is_archived
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    log_audit_event(
        current_user,
        "ARCHIVE_LAB_CONVERSATION" if is_archived else "UNARCHIVE_LAB_CONVERSATION",
        f"conversation_id={conversation_id}",
    )
    return conversation


# ============================================================================
# MESSAGE ENDPOINTS
# ============================================================================


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
    summary="Send a message to the AI",
)
async def send_message(
    conversation_id: int,
    content: str = Form(...),
    message_type: MessageType = Form(MessageType.TEXT),
    selected_model: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to the AI in a conversation.

    The message will be processed by the selected AI model (or default for
    the conversation). Supports text messages and file attachments.

    - **conversation_id**: ID of the conversation
    - **content**: Message text content
    - **message_type**: Type of message (TEXT, FILE, ANALYSIS)
    - **selected_model**: AI model to use (overrides conversation default)
    - **file**: Optional file attachment (lab result, image, PDF)
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can send messages")

    # Verify conversation exists and belongs to user
    conversation = LabConversationService.get_conversation(
        db, conversation_id, current_user.id
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Create user message
    user_message = LabMessageService.create_message(
        db,
        conversation_id,
        MessageRole.USER,
        content,
        message_type=message_type,
    )

    # Handle file attachment if provided
    if file:
        attachment = LabMessageAttachmentService.create_attachment(
            db,
            user_message.id,
            file.filename or "file",
            f"/uploads/{conversation_id}/{file.filename}",  # Placeholder path
            AttachmentType.PDF if file.content_type == "application/pdf" else AttachmentType.IMAGE,
            file_size=file.size,
            mime_type=file.content_type,
        )
        logger.info(f"Created attachment {attachment.id} for message {user_message.id}")

    log_audit_event(
        current_user,
        "SEND_MESSAGE",
        f"conversation_id={conversation_id}, message_id={user_message.id}",
    )

    # Note: AI response generation is handled asynchronously via a background task
    # in production. For now, just return the user message.
    # In a future enhancement, we'll implement streaming via Server-Sent Events (SSE)

    return user_message


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=MessageListResponse,
    summary="Get message history for a conversation",
)
async def list_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get paginated message history for a conversation.

    Messages are returned in chronological order (oldest first).

    - **conversation_id**: ID of the conversation
    - **skip**: Number of messages to skip
    - **limit**: Maximum messages to return
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view messages")

    # Verify conversation exists and belongs to user
    conversation = LabConversationService.get_conversation(
        db, conversation_id, current_user.id
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages, total = LabMessageService.list_messages(
        db, conversation_id, skip=skip, limit=limit
    )

    log_audit_event(
        current_user,
        "LIST_MESSAGES",
        f"conversation_id={conversation_id}, count={len(messages)}",
    )

    return MessageListResponse(
        messages=messages,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.delete(
    "/conversations/{conversation_id}/messages/{message_id}",
    status_code=204,
    summary="Delete a message",
)
async def delete_message(
    conversation_id: int,
    message_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a message from a conversation.

    - **conversation_id**: ID of the conversation
    - **message_id**: ID of the message to delete
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can delete messages")

    # Verify conversation belongs to user
    conversation = LabConversationService.get_conversation(
        db, conversation_id, current_user.id
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Verify message belongs to conversation
    message = LabMessageService.get_message(db, message_id)
    if not message or message.conversation_id != conversation_id:
        raise HTTPException(status_code=404, detail="Message not found")

    success = LabMessageService.delete_message(db, message_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete message")

    log_audit_event(
        current_user,
        "DELETE_MESSAGE",
        f"conversation_id={conversation_id}, message_id={message_id}",
    )


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================


@router.get(
    "/conversations/{conversation_id}/analytics",
    response_model=ConversationAnalytics,
    summary="Get conversation usage analytics",
)
async def get_analytics(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get analytics for a conversation including token usage, models used,
    file uploads, and processing time.

    - **conversation_id**: ID of the conversation
    """
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view analytics")

    # Verify conversation belongs to user
    conversation = LabConversationService.get_conversation(
        db, conversation_id, current_user.id
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    analytics = ConversationAnalyticsService.get_analytics(db, conversation_id)

    log_audit_event(
        current_user,
        "VIEW_ANALYTICS",
        f"conversation_id={conversation_id}",
    )

    return analytics
