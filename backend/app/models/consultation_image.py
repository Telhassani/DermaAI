"""
Consultation Image Model
Stores medical images attached to consultations
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class ConsultationImage(Base):
    """
    Model for storing medical images related to consultations

    In dermatology, visual documentation is critical for:
    - Accurate diagnosis
    - Tracking lesion evolution
    - Before/after treatment comparison
    - Second opinions and consultations
    """
    __tablename__ = "consultation_images"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to consultation
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # File storage paths
    image_url = Column(String(500), nullable=False)  # Full-size image path
    thumbnail_url = Column(String(500), nullable=True)  # Thumbnail path (auto-generated)

    # File metadata
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(50), nullable=False)  # image/jpeg, image/png, etc.
    width = Column(Integer, nullable=True)  # Image width in pixels
    height = Column(Integer, nullable=True)  # Image height in pixels

    # Medical metadata
    image_type = Column(String(100), nullable=True)
    # Examples: "lésion primaire", "vue macro", "dermatoscope", "évolution", "post-traitement"

    body_location = Column(String(200), nullable=True)
    # Anatomical location: "bras droit", "dos", "visage", "cuir chevelu", etc.

    description = Column(Text, nullable=True)
    # Free text description by doctor

    is_primary = Column(Boolean, default=False)
    # Mark one image as the primary/featured image for the consultation

    # EXIF data (optional, extracted from image metadata)
    captured_at = Column(DateTime, nullable=True)  # When photo was taken
    camera_model = Column(String(100), nullable=True)  # Camera/phone model

    # Audit timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    consultation = relationship(
        "Consultation",
        back_populates="images",
        foreign_keys=[consultation_id]
    )

    def __repr__(self):
        return f"<ConsultationImage(id={self.id}, consultation_id={self.consultation_id}, filename={self.original_filename})>"
