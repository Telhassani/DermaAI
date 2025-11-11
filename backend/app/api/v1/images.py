"""
Image endpoints - Upload, retrieve, and manage medical images
"""

from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Query,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
import os
import shutil
from pathlib import Path
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.image import Image, ImageAnnotation, ImageType, ImageCategory
from app.schemas.image import (
    ImageResponse,
    ImageListResponse,
    ImageUploadResponse,
    ImageUpdate,
    AnnotationCreate,
    AnnotationResponse,
    AnnotationListResponse,
    AnnotationUpdate,
)
from app.api.deps import get_current_active_user
from app.core.logging import log_audit_event
from app.core.config import settings

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path(settings.UPLOAD_DIR if hasattr(settings, 'UPLOAD_DIR') else "uploads")
IMAGES_DIR = UPLOAD_DIR / "images"
THUMBNAILS_DIR = UPLOAD_DIR / "thumbnails"

# Create directories if they don't exist
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

# Allowed MIME types
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename while preserving extension"""
    ext = Path(original_filename).suffix.lower()
    unique_id = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    return f"{unique_id}{ext}"


def get_image_url(image_id: int) -> str:
    """Generate URL for accessing an image"""
    base_url = settings.BASE_URL if hasattr(settings, 'BASE_URL') else "http://localhost:8000"
    return f"{base_url}/api/v1/images/{image_id}/file"


def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}",
        )


@router.post("/upload", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_images(
    files: List[UploadFile] = File(..., description="Image files to upload"),
    patient_id: int = Form(..., description="Patient ID"),
    consultation_id: Optional[int] = Form(None, description="Consultation ID"),
    image_type: ImageType = Form(ImageType.CLINICAL, description="Type of image"),
    category: ImageCategory = Form(ImageCategory.DIAGNOSTIC, description="Image category"),
    body_location: Optional[str] = Form(None, description="Body location"),
    description: Optional[str] = Form(None, description="Image description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Upload one or more medical images

    Args:
        files: List of image files
        patient_id: ID of the patient
        consultation_id: Optional ID of related consultation
        image_type: Type of medical image
        category: Image category
        body_location: Body location/site
        description: Image description
        db: Database session
        current_user: Current authenticated user

    Returns:
        ImageUploadResponse with uploaded images and any errors
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found",
        )

    uploaded_images = []
    errors = []

    for file in files:
        try:
            # Validate file
            validate_image_file(file)

            # Check file size
            file.file.seek(0, 2)  # Seek to end
            file_size = file.file.tell()
            file.file.seek(0)  # Reset to beginning

            if file_size > MAX_FILE_SIZE:
                errors.append(f"{file.filename}: File too large ({file_size} bytes)")
                continue

            # Generate unique filename
            unique_filename = generate_unique_filename(file.filename)
            file_path = IMAGES_DIR / unique_filename

            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Create database record
            image = Image(
                patient_id=patient_id,
                consultation_id=consultation_id,
                file_path=str(file_path),
                file_name=file.filename,
                file_size=file_size,
                mime_type=file.content_type,
                image_type=image_type,
                category=category,
                body_location=body_location,
                description=description,
            )
            db.add(image)
            db.flush()  # Get the ID

            # Create response
            image_response = ImageResponse(
                id=image.id,
                patient_id=image.patient_id,
                consultation_id=image.consultation_id,
                file_name=image.file_name,
                file_size=image.file_size,
                mime_type=image.mime_type,
                image_type=image.image_type,
                category=image.category,
                body_location=image.body_location,
                description=image.description,
                image_metadata=image.image_metadata,
                url=get_image_url(image.id),
                thumbnail_url=None,
                created_at=image.created_at,
                updated_at=image.updated_at,
            )
            uploaded_images.append(image_response)

        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
            continue

    db.commit()

    # Log audit event
    log_audit_event(
        user_id=current_user.id,
        action="image_upload",
        resource_type="image",
        details={
            "patient_id": patient_id,
            "success_count": len(uploaded_images),
            "failed_count": len(errors),
        },
    )

    return ImageUploadResponse(
        success_count=len(uploaded_images),
        failed_count=len(errors),
        images=uploaded_images,
        errors=errors if errors else None,
    )


@router.get("/patient/{patient_id}", response_model=List[ImageResponse])
async def get_patient_images(
    patient_id: int,
    image_type: Optional[ImageType] = Query(None, description="Filter by image type"),
    category: Optional[ImageCategory] = Query(None, description="Filter by category"),
    consultation_id: Optional[int] = Query(None, description="Filter by consultation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all images for a specific patient

    Args:
        patient_id: Patient ID
        image_type: Optional filter by image type
        category: Optional filter by category
        consultation_id: Optional filter by consultation
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of patient images
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found",
        )

    # Build query
    query = db.query(Image).filter(Image.patient_id == patient_id)

    if image_type:
        query = query.filter(Image.image_type == image_type)
    if category:
        query = query.filter(Image.category == category)
    if consultation_id:
        query = query.filter(Image.consultation_id == consultation_id)

    images = query.order_by(Image.created_at.desc()).all()

    # Convert to response models
    response_images = []
    for image in images:
        response_images.append(
            ImageResponse(
                id=image.id,
                patient_id=image.patient_id,
                consultation_id=image.consultation_id,
                file_name=image.file_name,
                file_size=image.file_size,
                mime_type=image.mime_type,
                image_type=image.image_type,
                category=image.category,
                body_location=image.body_location,
                description=image.description,
                image_metadata=image.image_metadata,
                url=get_image_url(image.id),
                thumbnail_url=None,
                created_at=image.created_at,
                updated_at=image.updated_at,
            )
        )

    return response_images


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get image metadata by ID

    Args:
        image_id: Image ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Image metadata
    """
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID {image_id} not found",
        )

    return ImageResponse(
        id=image.id,
        patient_id=image.patient_id,
        consultation_id=image.consultation_id,
        file_name=image.file_name,
        file_size=image.file_size,
        mime_type=image.mime_type,
        image_type=image.image_type,
        category=image.category,
        body_location=image.body_location,
        description=image.description,
        image_metadata=image.image_metadata,
        url=get_image_url(image.id),
        thumbnail_url=None,
        created_at=image.created_at,
        updated_at=image.updated_at,
    )


@router.get("/{image_id}/file")
async def get_image_file(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the actual image file

    Args:
        image_id: Image ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Image file
    """
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID {image_id} not found",
        )

    file_path = Path(image.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found on server",
        )

    return FileResponse(
        path=file_path,
        media_type=image.mime_type,
        filename=image.file_name,
    )


@router.patch("/{image_id}", response_model=ImageResponse)
async def update_image(
    image_id: int,
    image_update: ImageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update image metadata

    Args:
        image_id: Image ID
        image_update: Updated image data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated image
    """
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID {image_id} not found",
        )

    # Update fields
    update_data = image_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(image, field, value)

    db.commit()
    db.refresh(image)

    log_audit_event(
        user_id=current_user.id,
        action="image_update",
        resource_type="image",
        resource_id=image_id,
        details=update_data,
    )

    return ImageResponse(
        id=image.id,
        patient_id=image.patient_id,
        consultation_id=image.consultation_id,
        file_name=image.file_name,
        file_size=image.file_size,
        mime_type=image.mime_type,
        image_type=image.image_type,
        category=image.category,
        body_location=image.body_location,
        description=image.description,
        image_metadata=image.image_metadata,
        url=get_image_url(image.id),
        thumbnail_url=None,
        created_at=image.created_at,
        updated_at=image.updated_at,
    )


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete an image

    Args:
        image_id: Image ID
        db: Database session
        current_user: Current authenticated user
    """
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID {image_id} not found",
        )

    # Delete file from filesystem
    file_path = Path(image.file_path)
    if file_path.exists():
        file_path.unlink()

    # Delete thumbnail if exists
    if image.thumbnail_path:
        thumbnail_path = Path(image.thumbnail_path)
        if thumbnail_path.exists():
            thumbnail_path.unlink()

    # Delete from database (annotations will be deleted via cascade)
    db.delete(image)
    db.commit()

    log_audit_event(
        user_id=current_user.id,
        action="image_delete",
        resource_type="image",
        resource_id=image_id,
        details={"patient_id": image.patient_id, "file_name": image.file_name},
    )


# ==================== Annotation Endpoints ====================


@router.post("/{image_id}/annotations", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def create_annotation(
    image_id: int,
    annotation: AnnotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new annotation on an image

    Args:
        image_id: Image ID
        annotation: Annotation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created annotation
    """
    # Verify image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID {image_id} not found",
        )

    # Create annotation
    db_annotation = ImageAnnotation(
        image_id=image_id,
        user_id=current_user.id,
        tool=annotation.tool,
        coordinates=annotation.coordinates,
        color=annotation.color,
        label=annotation.label,
        notes=annotation.notes,
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)

    log_audit_event(
        user_id=current_user.id,
        action="annotation_create",
        resource_type="annotation",
        resource_id=db_annotation.id,
        details={"image_id": image_id, "tool": annotation.tool.value},
    )

    return AnnotationResponse(
        id=db_annotation.id,
        image_id=db_annotation.image_id,
        user_id=db_annotation.user_id,
        tool=db_annotation.tool,
        coordinates=db_annotation.coordinates,
        color=db_annotation.color,
        label=db_annotation.label,
        notes=db_annotation.notes,
        created_at=db_annotation.created_at,
        updated_at=db_annotation.updated_at,
    )


@router.get("/{image_id}/annotations", response_model=AnnotationListResponse)
async def get_image_annotations(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all annotations for an image

    Args:
        image_id: Image ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of annotations
    """
    # Verify image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with ID {image_id} not found",
        )

    annotations = (
        db.query(ImageAnnotation)
        .filter(ImageAnnotation.image_id == image_id)
        .order_by(ImageAnnotation.created_at.asc())
        .all()
    )

    annotation_responses = []
    for annot in annotations:
        annotation_responses.append(
            AnnotationResponse(
                id=annot.id,
                image_id=annot.image_id,
                user_id=annot.user_id,
                tool=annot.tool,
                coordinates=annot.coordinates,
                color=annot.color,
                label=annot.label,
                notes=annot.notes,
                created_at=annot.created_at,
                updated_at=annot.updated_at,
            )
        )

    return AnnotationListResponse(
        annotations=annotation_responses,
        total=len(annotation_responses),
    )


@router.delete("/annotations/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annotation(
    annotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete an annotation

    Args:
        annotation_id: Annotation ID
        db: Database session
        current_user: Current authenticated user
    """
    annotation = (
        db.query(ImageAnnotation).filter(ImageAnnotation.id == annotation_id).first()
    )
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Annotation with ID {annotation_id} not found",
        )

    db.delete(annotation)
    db.commit()

    log_audit_event(
        user_id=current_user.id,
        action="annotation_delete",
        resource_type="annotation",
        resource_id=annotation_id,
        details={"image_id": annotation.image_id},
    )
