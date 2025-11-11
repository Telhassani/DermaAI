"""
Image model - Medical images for patients
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
import enum

from app.db.base import BaseModel


class ImageType(str, enum.Enum):
    """Image type enumeration"""

    CLINICAL = "clinical"  # Clinical photo
    DERMOSCOPIC = "dermoscopic"  # Dermoscopy image
    HISTOPATHOLOGY = "histopathology"  # Histopathology slide
    OTHER = "other"  # Other type


class ImageCategory(str, enum.Enum):
    """Image category enumeration"""

    DIAGNOSTIC = "diagnostic"  # For diagnosis
    FOLLOW_UP = "follow_up"  # Follow-up monitoring
    TREATMENT = "treatment"  # Treatment documentation
    COMPARISON = "comparison"  # Before/after comparison


class Image(BaseModel):
    """
    Medical image model

    Attributes:
        patient_id: ID of the patient (FK)
        consultation_id: Optional ID of related consultation (FK)
        file_path: Path to the stored image file
        file_name: Original filename
        file_size: File size in bytes
        mime_type: MIME type (image/jpeg, image/png, etc.)
        image_type: Type of medical image
        category: Image category
        body_location: Body location/site
        description: Image description/notes
        metadata: Additional metadata (JSON)
        thumbnail_path: Path to thumbnail (optional)
    """

    __tablename__ = "images"

    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    consultation_id = Column(
        Integer, ForeignKey("consultations.id"), nullable=True, index=True
    )

    # File information
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)

    # Image classification
    image_type = Column(SQLEnum(ImageType, name="image_type"), default=ImageType.CLINICAL)
    category = Column(
        SQLEnum(ImageCategory, name="image_category"), default=ImageCategory.DIAGNOSTIC
    )

    # Medical information
    body_location = Column(String(255), nullable=True)  # e.g., "left arm", "face"
    description = Column(Text, nullable=True)
    image_metadata = Column(JSON, nullable=True)  # Additional structured data

    # Thumbnail
    thumbnail_path = Column(String(500), nullable=True)

    # Relationships
    patient = relationship("Patient", backref="images")
    # consultation = relationship("Consultation", backref="images")
    annotations = relationship(
        "ImageAnnotation", back_populates="image", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Image(id={self.id}, patient_id={self.patient_id}, file_name={self.file_name})>"


class AnnotationTool(str, enum.Enum):
    """Annotation tool type enumeration"""

    RECTANGLE = "rectangle"
    CIRCLE = "circle"
    ARROW = "arrow"
    PEN = "pen"
    TEXT = "text"


class ImageAnnotation(BaseModel):
    """
    Image annotation model for medical markings

    Attributes:
        image_id: ID of the annotated image (FK)
        user_id: ID of user who created annotation (FK)
        tool: Type of annotation tool used
        coordinates: Annotation coordinates (JSON)
        color: Annotation color (hex)
        label: Text label/description
        notes: Additional notes
    """

    __tablename__ = "image_annotations"

    # Foreign keys
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Annotation data
    tool = Column(SQLEnum(AnnotationTool, name="annotation_tool"), nullable=False)
    coordinates = Column(JSON, nullable=False)  # e.g., {"x": 10, "y": 20, "width": 50}
    color = Column(String(7), default="#FF0000")  # Hex color
    label = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    image = relationship("Image", back_populates="annotations")
    # user = relationship("User", backref="annotations")

    def __repr__(self):
        return f"<ImageAnnotation(id={self.id}, image_id={self.image_id}, tool={self.tool})>"
