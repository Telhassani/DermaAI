"""
ConsultationImage model - Images associated with consultations
"""

from sqlalchemy import Column, String, Integer, ForeignKey, LargeBinary, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import BaseModel


class ConsultationImage(BaseModel):
    """
    ConsultationImage model - Represents an image taken during a consultation

    Attributes:
        consultation_id: ID of the consultation (FK to consultations)
        patient_id: ID of the patient (FK to patients)
        image_data: Binary image data (stored as BLOB)
        filename: Original filename of the image
        file_size: Size of the file in bytes
        mime_type: MIME type of the image (e.g., image/jpeg, image/png)
        uploaded_at: Timestamp when image was uploaded
        notes: Optional notes about the image
    """

    __tablename__ = "consultation_images"

    # Foreign Keys
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)

    # Image Details
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(50), nullable=False, default="image/jpeg")

    # Image Data - Can be stored as base64 string instead of binary
    image_data = Column(String, nullable=False)  # Base64 encoded image

    # Metadata
    notes = Column(String(500), nullable=True)  # Notes about the image
    uploaded_at = Column(DateTime, nullable=False, default=datetime.now, index=True)

    # Relationships
    # consultation = relationship("Consultation", back_populates="images")
    # patient = relationship("Patient", back_populates="images")

    def __repr__(self):
        return f"<ConsultationImage(id={self.id}, consultation_id={self.consultation_id}, filename={self.filename})>"
