"""
Lab Conversation Service
Handles CRUD operations for conversations and messages
Independent chat system for lab analysis
"""

from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging

from app.models import (
    LabConversation,
    LabMessage,
    LabMessageAttachment,
    User,
    MessageRole,
    MessageType,
    AttachmentType,
)
from app.schemas.lab_conversation import (
    ConversationCreate,
    ConversationUpdate,
    MessageCreate,
    ConversationResponse,
    MessageResponse,
)

logger = logging.getLogger(__name__)


class LabConversationService:
    """Service for managing lab conversations"""

    @staticmethod
    def create_conversation(
        db: Session, doctor_id: int, data: ConversationCreate
    ) -> LabConversation:
        """Create a new conversation"""
        # Auto-generate title if not provided
        title = data.title or "New Lab Analysis Chat"

        conversation = LabConversation(
            doctor_id=doctor_id,
            title=title,
            description=data.description,
            default_model=data.default_model,
            system_prompt=data.system_prompt,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        logger.info(f"Created conversation {conversation.id} for doctor {doctor_id}")
        return conversation

    @staticmethod
    def get_conversation(
        db: Session, conversation_id: int, doctor_id: int
    ) -> Optional[LabConversation]:
        """Get conversation by ID (must belong to doctor)"""
        return db.query(LabConversation).filter(
            LabConversation.id == conversation_id,
            LabConversation.doctor_id == doctor_id,
        ).first()

    @staticmethod
    def list_conversations(
        db: Session,
        doctor_id: int,
        skip: int = 0,
        limit: int = 20,
        is_archived: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[LabConversation], int]:
        """List conversations for doctor with optional filtering"""
        query = db.query(LabConversation).filter(
            LabConversation.doctor_id == doctor_id
        )

        if is_archived is not None:
            query = query.filter(LabConversation.is_archived == is_archived)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (LabConversation.title.ilike(search_term))
                | (LabConversation.description.ilike(search_term))
            )

        total = query.count()

        # Order by: pinned first, then by last_message_at (newest first)
        conversations = (
            query.order_by(
                desc(LabConversation.is_pinned),
                desc(LabConversation.last_message_at),
                desc(LabConversation.created_at),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

        return conversations, total

    @staticmethod
    def update_conversation(
        db: Session,
        conversation_id: int,
        doctor_id: int,
        data: ConversationUpdate,
    ) -> Optional[LabConversation]:
        """Update conversation"""
        conversation = LabConversationService.get_conversation(
            db, conversation_id, doctor_id
        )
        if not conversation:
            return None

        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(conversation, field, value)

        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)
        logger.info(f"Updated conversation {conversation_id}")
        return conversation

    @staticmethod
    def delete_conversation(
        db: Session, conversation_id: int, doctor_id: int
    ) -> bool:
        """Delete conversation (and all messages)"""
        conversation = LabConversationService.get_conversation(
            db, conversation_id, doctor_id
        )
        if not conversation:
            return False

        db.delete(conversation)
        db.commit()
        logger.info(f"Deleted conversation {conversation_id}")
        return True

    @staticmethod
    def pin_conversation(
        db: Session, conversation_id: int, doctor_id: int, is_pinned: bool
    ) -> Optional[LabConversation]:
        """Pin or unpin conversation"""
        conversation = LabConversationService.get_conversation(
            db, conversation_id, doctor_id
        )
        if not conversation:
            return None

        conversation.is_pinned = is_pinned
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def archive_conversation(
        db: Session, conversation_id: int, doctor_id: int, is_archived: bool
    ) -> Optional[LabConversation]:
        """Archive or unarchive conversation"""
        conversation = LabConversationService.get_conversation(
            db, conversation_id, doctor_id
        )
        if not conversation:
            return None

        conversation.is_archived = is_archived
        db.commit()
        db.refresh(conversation)
        return conversation


class LabMessageService:
    """Service for managing messages"""

    @staticmethod
    def create_message(
        db: Session,
        conversation_id: int,
        role: MessageRole,
        content: str,
        message_type: MessageType = MessageType.TEXT,
        model_used: Optional[str] = None,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        processing_time_ms: Optional[int] = None,
    ) -> LabMessage:
        """Create a new message"""
        message = LabMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            message_type=message_type,
            model_used=model_used,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            processing_time_ms=processing_time_ms,
        )
        db.add(message)

        # Update conversation metadata
        conversation = db.query(LabConversation).get(conversation_id)
        if conversation:
            conversation.message_count += 1
            conversation.last_message_at = datetime.utcnow()
            conversation.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(message)
        logger.info(f"Created message {message.id} in conversation {conversation_id}")
        return message

    @staticmethod
    def get_message(db: Session, message_id: int) -> Optional[LabMessage]:
        """Get message by ID"""
        return db.query(LabMessage).filter(LabMessage.id == message_id).first()

    @staticmethod
    def list_messages(
        db: Session,
        conversation_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[LabMessage], int]:
        """List messages in conversation"""
        query = db.query(LabMessage).filter(
            LabMessage.conversation_id == conversation_id
        )

        total = query.count()

        messages = (
            query.order_by(LabMessage.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        # Reverse to get chronological order
        return list(reversed(messages)), total

    @staticmethod
    def delete_message(db: Session, message_id: int) -> bool:
        """Delete message"""
        message = LabMessageService.get_message(db, message_id)
        if not message:
            return False

        conversation_id = message.conversation_id
        db.delete(message)

        # Update conversation metadata
        conversation = db.query(LabConversation).get(conversation_id)
        if conversation:
            conversation.message_count = max(0, conversation.message_count - 1)
            conversation.updated_at = datetime.utcnow()

        db.commit()
        logger.info(f"Deleted message {message_id}")
        return True

    @staticmethod
    def get_conversation_history(
        db: Session, conversation_id: int, limit: int = 50
    ) -> List[LabMessage]:
        """Get recent conversation history for AI context"""
        messages = (
            db.query(LabMessage)
            .filter(LabMessage.conversation_id == conversation_id)
            .order_by(LabMessage.created_at.desc())
            .limit(limit)
            .all()
        )
        return list(reversed(messages))


class LabMessageAttachmentService:
    """Service for managing message attachments"""

    @staticmethod
    def create_attachment(
        db: Session,
        message_id: int,
        file_name: str,
        file_path: str,
        file_type: AttachmentType,
        file_size: Optional[int] = None,
        mime_type: Optional[str] = None,
    ) -> LabMessageAttachment:
        """Create attachment"""
        attachment = LabMessageAttachment(
            message_id=message_id,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            mime_type=mime_type,
        )
        db.add(attachment)

        # Mark message as having attachments
        message = db.query(LabMessage).get(message_id)
        if message:
            message.has_attachments = True

        db.commit()
        db.refresh(attachment)
        logger.info(f"Created attachment {attachment.id} for message {message_id}")
        return attachment

    @staticmethod
    def get_attachment(db: Session, attachment_id: int) -> Optional[LabMessageAttachment]:
        """Get attachment by ID"""
        return db.query(LabMessageAttachment).filter(
            LabMessageAttachment.id == attachment_id
        ).first()

    @staticmethod
    def list_attachments(
        db: Session, message_id: int
    ) -> List[LabMessageAttachment]:
        """List attachments for message"""
        return db.query(LabMessageAttachment).filter(
            LabMessageAttachment.message_id == message_id
        ).all()

    @staticmethod
    def mark_processed(
        db: Session,
        attachment_id: int,
        extracted_data: Optional[dict] = None,
    ) -> Optional[LabMessageAttachment]:
        """Mark attachment as processed"""
        attachment = LabMessageAttachmentService.get_attachment(db, attachment_id)
        if not attachment:
            return None

        attachment.is_processed = True
        attachment.extracted_data = extracted_data
        db.commit()
        db.refresh(attachment)
        logger.info(f"Marked attachment {attachment_id} as processed")
        return attachment


class ConversationAnalyticsService:
    """Service for conversation analytics"""

    @staticmethod
    def get_analytics(db: Session, conversation_id: int) -> dict:
        """Get conversation analytics"""
        conversation = db.query(LabConversation).get(conversation_id)
        if not conversation:
            return {}

        messages = db.query(LabMessage).filter(
            LabMessage.conversation_id == conversation_id
        ).all()

        user_messages = [m for m in messages if m.role == MessageRole.USER]
        assistant_messages = [m for m in messages if m.role == MessageRole.ASSISTANT]

        total_tokens = sum(
            (m.prompt_tokens or 0) + (m.completion_tokens or 0)
            for m in assistant_messages
        )
        total_time = sum(m.processing_time_ms or 0 for m in assistant_messages)

        models_used = list(set(m.model_used for m in assistant_messages if m.model_used))

        attachments = db.query(LabMessageAttachment).join(
            LabMessage,
            LabMessageAttachment.message_id == LabMessage.id
        ).filter(
            LabMessage.conversation_id == conversation_id
        ).all()

        return {
            "total_messages": len(messages),
            "user_messages": len(user_messages),
            "assistant_messages": len(assistant_messages),
            "total_tokens_used": total_tokens,
            "total_processing_time_ms": total_time,
            "files_uploaded": len(attachments),
            "models_used": models_used,
        }
