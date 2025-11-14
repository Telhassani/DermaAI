"""
Consultation Images API endpoints
Handles medical image uploads, listing, and management for consultations
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.db.session import get_db
from app.models.user import User
from app.models.consultation import Consultation
from app.models.consultation_image import ConsultationImage
from app.schemas.consultation_image import (
    ConsultationImageResponse,
    ConsultationImageListResponse,
    ConsultationImageUpdate,
    ImageUploadResponse
)
from app.api.deps import get_current_active_user
from app.services.image_storage import image_storage_service


router = APIRouter()


@router.post(
    "/consultations/{consultation_id}/images",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image to consultation",
    description="Upload a medical image (JPEG, PNG, HEIC, WebP) to a consultation. Max size: 10MB."
)
async def upload_consultation_image(
    consultation_id: int,
    file: UploadFile = File(..., description="Image file to upload"),
    image_type: Optional[str] = Form(None, description="Type of image (e.g., 'lésion primaire', 'dermatoscope')"),
    body_location: Optional[str] = Form(None, description="Anatomical location"),
    description: Optional[str] = Form(None, description="Medical description"),
    is_primary: bool = Form(False, description="Set as primary image"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a medical image to a consultation.

    - **consultation_id**: ID of the consultation
    - **file**: Image file (JPEG, PNG, HEIC, WebP)
    - **image_type**: Optional type classification
    - **body_location**: Optional anatomical location
    - **description**: Optional medical description
    - **is_primary**: Whether this is the primary image
    """
    # Check if consultation exists and user has access
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation with id {consultation_id} not found"
        )

    # Check if user is the doctor of this consultation
    if consultation.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add images to this consultation"
        )

    try:
        # Read file content
        file_content = await file.read()

        # Save image using storage service
        (
            image_url,
            thumbnail_url,
            file_size,
            mime_type,
            width,
            height,
            exif_data
        ) = await image_storage_service.save_image(file_content, file.filename)

        # Create database record
        db_image = ConsultationImage(
            consultation_id=consultation_id,
            image_url=image_url,
            thumbnail_url=thumbnail_url,
            original_filename=file.filename,
            file_size=file_size,
            mime_type=mime_type,
            width=width,
            height=height,
            image_type=image_type,
            body_location=body_location,
            description=description,
            is_primary=is_primary,
            captured_at=exif_data.get("captured_at"),
            camera_model=exif_data.get("camera_model")
        )

        db.add(db_image)

        # Update consultation images_taken flag
        if not consultation.images_taken:
            consultation.images_taken = True

        db.commit()
        db.refresh(db_image)

        return ImageUploadResponse(
            id=db_image.id,
            consultation_id=db_image.consultation_id,
            image_url=db_image.image_url,
            thumbnail_url=db_image.thumbnail_url,
            original_filename=db_image.original_filename,
            file_size=db_image.file_size,
            mime_type=db_image.mime_type,
            message="Image uploaded successfully"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading image: {str(e)}"
        )


@router.get(
    "/consultations/{consultation_id}/images",
    response_model=ConsultationImageListResponse,
    summary="List consultation images",
    description="Get all images for a consultation with pagination"
)
def list_consultation_images(
    consultation_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all images for a consultation.

    - **consultation_id**: ID of the consultation
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 20, max: 100)
    """
    # Check if consultation exists
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation with id {consultation_id} not found"
        )

    # Check access
    if consultation.doctor_id != current_user.id and consultation.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this consultation's images"
        )

    # Limit page size
    page_size = min(page_size, 100)

    # Query images
    query = db.query(ConsultationImage).filter(
        ConsultationImage.consultation_id == consultation_id
    ).order_by(ConsultationImage.is_primary.desc(), ConsultationImage.created_at.desc())

    total = query.count()
    total_pages = math.ceil(total / page_size)

    images = query.offset((page - 1) * page_size).limit(page_size).all()

    return ConsultationImageListResponse(
        images=images,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get(
    "/consultations/images/{image_id}",
    response_model=ConsultationImageResponse,
    summary="Get image details",
    description="Get detailed information about a specific consultation image"
)
def get_consultation_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of a specific consultation image.

    - **image_id**: ID of the image
    """
    image = db.query(ConsultationImage).filter(
        ConsultationImage.id == image_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with id {image_id} not found"
        )

    # Check access via consultation
    consultation = db.query(Consultation).filter(
        Consultation.id == image.consultation_id
    ).first()

    if consultation.doctor_id != current_user.id and consultation.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this image"
        )

    return image


@router.patch(
    "/consultations/images/{image_id}",
    response_model=ConsultationImageResponse,
    summary="Update image metadata",
    description="Update metadata of a consultation image (not the image file itself)"
)
def update_consultation_image(
    image_id: int,
    image_update: ConsultationImageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update metadata of a consultation image.

    - **image_id**: ID of the image
    - **image_update**: Updated metadata
    """
    image = db.query(ConsultationImage).filter(
        ConsultationImage.id == image_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with id {image_id} not found"
        )

    # Check access via consultation
    consultation = db.query(Consultation).filter(
        Consultation.id == image.consultation_id
    ).first()

    if consultation.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the consultation's doctor can update image metadata"
        )

    # Update fields
    update_data = image_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(image, field, value)

    db.commit()
    db.refresh(image)

    return image


@router.delete(
    "/consultations/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete image",
    description="Delete a consultation image (file and database record)"
)
def delete_consultation_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a consultation image.

    - **image_id**: ID of the image to delete
    """
    image = db.query(ConsultationImage).filter(
        ConsultationImage.id == image_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with id {image_id} not found"
        )

    # Check access via consultation
    consultation = db.query(Consultation).filter(
        Consultation.id == image.consultation_id
    ).first()

    if consultation.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the consultation's doctor can delete images"
        )

    try:
        # Delete physical files
        image_storage_service.delete_image(image.image_url, image.thumbnail_url)

        # Delete database record
        db.delete(image)
        db.commit()

        return None

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting image: {str(e)}"
        )


@router.get(
    "/consultations/{consultation_id}/images/download-all",
    summary="Download all images as ZIP",
    description="Download all consultation images as a ZIP archive"
)
def download_all_images(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download all images for a consultation as a ZIP file.

    - **consultation_id**: ID of the consultation
    """
    # This would require implementation of ZIP creation
    # For now, return not implemented
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="ZIP download feature coming soon"
    )
