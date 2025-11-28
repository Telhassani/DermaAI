"""
Lab Conversations API - Endpoints for multi-turn AI chat system
Provides conversation management, messaging, and AI interaction for lab analysis
Independent mode - NO patient context
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import logging
import json
import asyncio

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
from app.services.ai_service import get_ai_service, AIServiceError
from app.services.file_service import get_file_service
from app.core.logging import log_audit_event
from app.core.config import settings
from app.core.rate_limiter import limiter
from pydantic import BaseModel

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
@limiter.limit("10/minute")  # Rate limit: 10 new conversations per minute
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
    if current_user.role.value != "DOCTOR":
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
    if current_user.role.value != "DOCTOR":
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
    if current_user.role.value != "DOCTOR":
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
    if current_user.role.value != "DOCTOR":
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
    if current_user.role.value != "DOCTOR":
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
    if current_user.role.value != "DOCTOR":
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
    if current_user.role.value != "DOCTOR":
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
@limiter.limit("20/minute")  # Rate limit: 20 messages per minute per IP
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
    if current_user.role.value != "DOCTOR":
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
        try:
            # Get file service
            file_service = get_file_service()

            # Read file content
            file_content = await file.read()

            # Validate file
            is_valid, error_msg = file_service.validate_file(
                file.filename or "file",
                len(file_content),
                file.content_type or "application/octet-stream",
            )

            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Invalid file: {error_msg}")

            # Generate file hash for secure naming
            file_hash = file_service.generate_file_hash(file_content)
            safe_filename = file_service.generate_safe_filename(file.filename or "file", file_hash)

            # Save file to disk
            relative_path = file_service.save_file(
                file_content,
                safe_filename,
                subdirectory=f"lab-conversations/{conversation_id}",
            )

            # Determine attachment type based on MIME type
            if file.content_type == "application/pdf":
                attachment_type = AttachmentType.PDF
            elif file.content_type and file.content_type.startswith("image/"):
                attachment_type = AttachmentType.IMAGE
            else:
                attachment_type = AttachmentType.OTHER

            # Create attachment record
            attachment = LabMessageAttachmentService.create_attachment(
                db,
                user_message.id,
                file.filename or safe_filename,
                relative_path,
                attachment_type,
                file_size=len(file_content),
                mime_type=file.content_type,
            )
            logger.info(f"Created attachment {attachment.id} for message {user_message.id}, saved to {relative_path}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error handling file attachment: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process file attachment: {str(e)}")

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
    if current_user.role.value != "DOCTOR":
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


@router.put(
    "/conversations/{conversation_id}/messages/{message_id}",
    response_model=MessageResponse,
    summary="Edit a message",
)
@limiter.limit("30/minute")  # Rate limit: 30 edits per minute
async def edit_message(
    conversation_id: int,
    message_id: int,
    content: str = Form(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Edit an existing message in a conversation.

    Only the message creator (current user) can edit messages.
    AI responses cannot be regenerated, only the text can be corrected.

    - **conversation_id**: ID of the conversation
    - **message_id**: ID of the message to edit
    - **content**: New message content
    """
    if current_user.role.value != "DOCTOR":
        raise HTTPException(status_code=403, detail="Only doctors can edit messages")

    # Verify conversation exists and belongs to user
    conversation = LabConversationService.get_conversation(
        db, conversation_id, current_user.id
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get the message
    message = LabMessageService.get_message(db, message_id)
    if not message or message.conversation_id != conversation_id:
        raise HTTPException(status_code=404, detail="Message not found")

    # Verify message belongs to user if it's a USER message
    if message.role == MessageRole.USER:
        # User can edit their own messages
        pass
    elif message.role == MessageRole.ASSISTANT:
        # User can edit AI responses to fix text
        pass
    else:
        raise HTTPException(status_code=403, detail="Cannot edit this message type")

    # Update message content
    if not content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    message.content = content.strip()
    message.is_edited = True
    from datetime import datetime
    message.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(message)

    log_audit_event(
        current_user,
        "EDIT_MESSAGE",
        f"conversation_id={conversation_id}, message_id={message_id}",
    )

    return message


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
    if current_user.role.value != "DOCTOR":
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
    if current_user.role.value != "DOCTOR":
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


# ============================================================================
# AI RESPONSE GENERATION ENDPOINT
# ============================================================================

class StreamAIResponseRequest(BaseModel):
    """Request to generate streaming AI response"""
    conversation_id: int
    model: str
    user_message_id: int
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2000


async def generate_ai_response_stream(
    ai_service,
    model: str,
    messages: List[Dict[str, str]],
    system_prompt: Optional[str],
    temperature: Optional[float],
    max_tokens: Optional[int],
    conversation_id: int,
    user_message_id: int,
    user_id: int,
    db: Session,
):
    """
    Generate streaming AI response and save to database.
    Yields SSE-formatted events for real-time UI updates.
    """
    heartbeat_interval = settings.STREAMING_HEARTBEAT_INTERVAL_SECONDS
    last_heartbeat = 0
    chunk_count = 0
    accumulated_content = ""

    try:
        # Send initial metadata event
        yield f"data: {json.dumps({'type': 'start', 'model': model})}\n\n"

        # Stream from AI service
        start_time = asyncio.get_event_loop().time()

        async for chunk in ai_service.stream_message(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            system_prompt=system_prompt,
        ):
            if chunk:
                accumulated_content += chunk
                # Send data chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                chunk_count += 1

            # Send periodic heartbeat to keep connection alive
            current_time = asyncio.get_event_loop().time()
            if current_time - last_heartbeat >= heartbeat_interval:
                yield f"data: {json.dumps({'type': 'heartbeat', 'chunks_received': chunk_count})}\n\n"
                last_heartbeat = current_time

        # Stream completed - save AI response to database
        elapsed_time = asyncio.get_event_loop().time() - start_time

        # Create AI response message in database
        ai_message = LabMessageService.create_message(
            db,
            conversation_id,
            MessageRole.ASSISTANT,
            accumulated_content,
            message_type=MessageType.TEXT,
            model_used=model,
            prompt_tokens=None,  # Would need to track from AI service
            completion_tokens=None,
            processing_time_ms=int(elapsed_time * 1000),
        )

        # Update conversation metadata
        conversation = LabConversationService.get_conversation(db, conversation_id, user_id)
        if conversation:
            conversation.message_count = (conversation.message_count or 0) + 1
            from datetime import datetime
            conversation.last_message_at = datetime.utcnow()
            db.commit()

        # Send completion event with the saved message ID
        yield f"data: {json.dumps({'type': 'complete', 'chunks': chunk_count, 'elapsed_seconds': elapsed_time, 'message_id': ai_message.id})}\n\n"

    except asyncio.TimeoutError:
        error_msg = f"Request to {model} timed out after {settings.AI_MODEL_REQUEST_TIMEOUT_SECONDS}s"
        logger.error(error_msg)
        yield f"data: {json.dumps({'type': 'error', 'error': 'timeout', 'message': error_msg})}\n\n"

    except AIServiceError as e:
        logger.error(f"AI Service error: {str(e)}")
        yield f"data: {json.dumps({'type': 'error', 'error': 'service_error', 'message': str(e)})}\n\n"

    except Exception as e:
        logger.error(f"Unexpected error in stream: {str(e)}")
        yield f"data: {json.dumps({'type': 'error', 'error': 'unknown_error', 'message': 'An unexpected error occurred'})}\n\n"


@router.post(
    "/conversations/{conversation_id}/stream-response",
    summary="Generate streaming AI response for a conversation",
    tags=["Lab Conversations"],
)
@limiter.limit("10/minute")  # Rate limit: 10 AI requests per minute per IP
async def stream_ai_response(
    conversation_id: int,
    request: StreamAIResponseRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Generate a streaming AI response for a conversation.

    This endpoint receives a request to generate an AI response, retrieves the
    conversation history, and streams the AI's response back via Server-Sent Events.

    The response is automatically saved to the database and can be referenced
    by the client using the message_id from the 'complete' event.

    Request body:
    - **conversation_id**: ID of the conversation (path parameter)
    - **model**: AI model to use (e.g., "claude-3-5-sonnet-20241022")
    - **user_message_id**: ID of the user message this is responding to
    - **temperature**: Sampling temperature (optional, default 0.7)
    - **max_tokens**: Maximum tokens in response (optional, default 2000)

    Response is streamed as Server-Sent Events:
    - start: Initial metadata
    - chunk: Content chunk from AI
    - heartbeat: Keep-alive signal
    - complete: Final event with message_id and stats
    - error: Error information
    """
    if current_user.role.value != "DOCTOR":
        raise HTTPException(status_code=403, detail="Only doctors can generate responses")

    # Verify conversation exists and belongs to user
    conversation = LabConversationService.get_conversation(
        db, conversation_id, current_user.id
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Verify user message exists
    user_message = LabMessageService.get_message(db, request.user_message_id)
    if not user_message or user_message.conversation_id != conversation_id:
        raise HTTPException(status_code=404, detail="User message not found")

    # Get conversation history
    messages, _ = LabMessageService.list_messages(
        db, conversation_id, skip=0, limit=100
    )

    # Build message history for AI (exclude latest user message as it's being processed)
    message_history: List[Dict[str, str]] = []
    for msg in messages[:-1]:  # Exclude the current user message
        message_history.append({
            "role": msg.role.value.lower(),
            "content": msg.content,
        })

    # Add the current user message
    message_history.append({
        "role": "user",
        "content": user_message.content,
    })

    # Log the request
    logger.info(
        f"Generating AI response for user {current_user.email}: "
        f"conversation_id={conversation_id}, model={request.model}"
    )

    try:
        # Validate model
        ai_service = get_ai_service()
        if not ai_service.validate_model(request.model):
            available = ai_service.get_available_models()
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid model",
                    "available_models": available
                }
            )

        # Get system prompt from conversation or use default
        system_prompt = conversation.system_prompt or (
            "You are an expert medical assistant specializing in dermatology and lab analysis. "
            "Provide accurate, evidence-based responses to support clinical decision-making. "
            "Always maintain patient confidentiality and recommend consulting with healthcare providers for diagnosis."
        )

        # Create streaming response
        return StreamingResponse(
            generate_ai_response_stream(
                ai_service=ai_service,
                model=request.model,
                messages=message_history,
                system_prompt=system_prompt,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                conversation_id=conversation_id,
                user_message_id=request.user_message_id,
                user_id=current_user.id,
                db=db,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable proxy buffering
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in stream endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response"
        )
