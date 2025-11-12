"""
Database base configuration
"""

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, DateTime, Boolean
from datetime import datetime

Base = declarative_base()


class BaseModel(Base):
    """
    Base model with common fields for all models

    Includes soft delete support for HIPAA compliance:
    - is_deleted: Boolean flag for soft deletion
    - deleted_at: Timestamp of when the record was deleted
    """

    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True, index=True)

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
