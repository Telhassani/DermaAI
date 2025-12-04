"""
Service for managing prompt templates
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional, Tuple
from app.models.lab_conversation import PromptTemplate
from app.schemas.lab_conversation import PromptTemplateCreate, PromptTemplateUpdate
from datetime import datetime


class PromptTemplateService:
    """Service for managing prompt templates"""

    @staticmethod
    def create_template(
        db: Session,
        doctor_id: int,
        data: PromptTemplateCreate,
    ) -> PromptTemplate:
        """Create a new prompt template"""
        template = PromptTemplate(
            doctor_id=doctor_id,
            title=data.title,
            template_text=data.template_text,
            description=data.description,
            category=data.category,
            is_system=False,  # User templates are never system templates
            usage_count=0,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(template)
        db.commit()
        db.refresh(template)

        return template

    @staticmethod
    def get_template(db: Session, template_id: int) -> Optional[PromptTemplate]:
        """Get a specific template"""
        return db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id
        ).first()

    @staticmethod
    def list_templates(
        db: Session,
        doctor_id: int,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[PromptTemplate], int]:
        """
        List all available templates for a doctor
        Includes both user templates and system templates
        """
        query = db.query(PromptTemplate).filter(
            PromptTemplate.is_active == True,
            or_(
                PromptTemplate.doctor_id == doctor_id,
                PromptTemplate.is_system == True,
            ),
        )

        # Filter by category if provided
        if category:
            query = query.filter(PromptTemplate.category == category)

        # Get total count before pagination
        total = query.count()

        # Apply pagination and ordering (recently created first)
        templates = query.order_by(
            desc(PromptTemplate.created_at)
        ).offset(skip).limit(limit).all()

        return templates, total

    @staticmethod
    def update_template(
        db: Session,
        template_id: int,
        doctor_id: int,
        data: PromptTemplateUpdate,
    ) -> Optional[PromptTemplate]:
        """Update a template (only owner can update)"""
        template = db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id,
            PromptTemplate.doctor_id == doctor_id,
        ).first()

        if not template:
            return None

        # Update fields
        if data.title is not None:
            template.title = data.title
        if data.template_text is not None:
            template.template_text = data.template_text
        if data.description is not None:
            template.description = data.description
        if data.category is not None:
            template.category = data.category
        if data.is_active is not None:
            template.is_active = data.is_active

        template.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(template)

        return template

    @staticmethod
    def delete_template(
        db: Session,
        template_id: int,
        doctor_id: int,
    ) -> bool:
        """Delete a template (only owner can delete)"""
        template = db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id,
            PromptTemplate.doctor_id == doctor_id,
        ).first()

        if not template:
            return False

        db.delete(template)
        db.commit()

        return True

    @staticmethod
    def increment_usage(db: Session, template_id: int) -> None:
        """Increment usage count when template is used"""
        template = db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id
        ).first()

        if template:
            template.usage_count += 1
            db.commit()

    @staticmethod
    def get_popular_templates(
        db: Session,
        doctor_id: int,
        category: Optional[str] = None,
        limit: int = 10,
    ) -> List[PromptTemplate]:
        """Get most used templates for a doctor"""
        query = db.query(PromptTemplate).filter(
            PromptTemplate.doctor_id == doctor_id,
            PromptTemplate.is_active == True,
        )

        if category:
            query = query.filter(PromptTemplate.category == category)

        return query.order_by(
            desc(PromptTemplate.usage_count)
        ).limit(limit).all()

    @staticmethod
    def get_system_templates(
        db: Session,
        category: Optional[str] = None,
    ) -> List[PromptTemplate]:
        """Get system templates (available to all doctors)"""
        query = db.query(PromptTemplate).filter(
            PromptTemplate.is_system == True,
            PromptTemplate.is_active == True,
        )

        if category:
            query = query.filter(PromptTemplate.category == category)

        return query.order_by(
            PromptTemplate.title.asc()
        ).all()
