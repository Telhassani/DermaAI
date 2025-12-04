"""
Service for managing message versions (regenerated AI responses)
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Tuple
from app.models.lab_conversation import LabMessageVersion, LabMessage, MessageRole
from datetime import datetime


class LabMessageVersionService:
    """Service for managing message versions"""

    @staticmethod
    def create_version(
        db: Session,
        message_id: int,
        content: str,
        model_used: Optional[str] = None,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        processing_time_ms: Optional[int] = None,
        regeneration_reason: Optional[str] = None,
    ) -> LabMessageVersion:
        """
        Create a new version of a message
        Automatically increments version number
        """
        # Get the current message to find next version number
        message = db.query(LabMessage).filter(LabMessage.id == message_id).first()
        if not message:
            raise ValueError(f"Message {message_id} not found")

        # Count existing versions to determine next version number
        existing_versions = db.query(LabMessageVersion).filter(
            LabMessageVersion.message_id == message_id
        ).count()

        # Version 1 exists by default (the original), so next version is existing_versions + 1
        next_version_number = existing_versions + 1 if existing_versions > 0 else 1

        version = LabMessageVersion(
            message_id=message_id,
            version_number=next_version_number,
            content=content,
            model_used=model_used,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            processing_time_ms=processing_time_ms,
            is_current=False,
            regeneration_reason=regeneration_reason,
            created_at=datetime.utcnow(),
        )

        db.add(version)
        db.commit()
        db.refresh(version)

        return version

    @staticmethod
    def get_version(
        db: Session,
        message_id: int,
        version_number: int,
    ) -> Optional[LabMessageVersion]:
        """Get a specific version of a message"""
        return db.query(LabMessageVersion).filter(
            LabMessageVersion.message_id == message_id,
            LabMessageVersion.version_number == version_number,
        ).first()

    @staticmethod
    def get_versions(
        db: Session,
        message_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> List[LabMessageVersion]:
        """Get all versions of a message, ordered by version number"""
        return db.query(LabMessageVersion).filter(
            LabMessageVersion.message_id == message_id
        ).order_by(
            LabMessageVersion.version_number.asc()
        ).offset(skip).limit(limit).all()

    @staticmethod
    def set_current_version(
        db: Session,
        message_id: int,
        version_number: int,
    ) -> LabMessageVersion:
        """Set which version is the current active version"""
        # First, unset all current flags for this message
        db.query(LabMessageVersion).filter(
            LabMessageVersion.message_id == message_id,
        ).update({LabMessageVersion.is_current: False})

        # Then set the new version as current
        version = db.query(LabMessageVersion).filter(
            LabMessageVersion.message_id == message_id,
            LabMessageVersion.version_number == version_number,
        ).first()

        if not version:
            raise ValueError(f"Version {version_number} not found for message {message_id}")

        version.is_current = True
        db.commit()
        db.refresh(version)

        return version

    @staticmethod
    def count_versions(db: Session, message_id: int) -> int:
        """Count total versions for a message"""
        return db.query(LabMessageVersion).filter(
            LabMessageVersion.message_id == message_id
        ).count()

    @staticmethod
    def delete_version(
        db: Session,
        message_id: int,
        version_number: int,
    ) -> bool:
        """Delete a version (only if not current)"""
        version = db.query(LabMessageVersion).filter(
            LabMessageVersion.message_id == message_id,
            LabMessageVersion.version_number == version_number,
        ).first()

        if not version:
            return False

        if version.is_current:
            raise ValueError("Cannot delete the current version")

        db.delete(version)
        db.commit()

        return True

    @staticmethod
    def get_current_version(db: Session, message_id: int) -> Optional[LabMessageVersion]:
        """Get the currently active version of a message"""
        return db.query(LabMessageVersion).filter(
            LabMessageVersion.message_id == message_id,
            LabMessageVersion.is_current == True,
        ).first()
