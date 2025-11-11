"""
Images API - Endpoints for managing consultation images
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models import User, ConsultationImage
from app.schemas.image import (
    ConsultationImageCreate,
    ConsultationImageResponse,
    ConsultationImageListResponse,
    ConsultationImageUpdate,
)
from app.core.logging import log_audit_event

router = APIRouter(prefix="/api/v1/images", tags=["images"])


@router.post(
    "/",
    response_model=ConsultationImageResponse,
    status_code=201,
    summary="Upload a consultation image",
)
async def upload_image(
    image_data: ConsultationImageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Upload a new image for a consultation

    - **consultation_id**: ID of the consultation
    - **patient_id**: ID of the patient
    - **image_data**: Base64 encoded image data
    - **filename**: Original filename
    - **file_size**: File size in bytes
    - **mime_type**: MIME type of the image
    - **notes**: Optional notes about the image
    """
    try:
        # Create new image record
        new_image = ConsultationImage(
            consultation_id=image_data.consultation_id,
            patient_id=image_data.patient_id,
            image_data=image_data.image_data,
            filename=image_data.filename,
            file_size=image_data.file_size,
            mime_type=image_data.mime_type,
            notes=image_data.notes,
        )

        db.add(new_image)
        db.commit()
        db.refresh(new_image)

        # Audit log
        log_audit_event(
            db,
            "UPLOAD_IMAGE",
            current_user.id,
            f"Uploaded image '{image_data.filename}' to consultation {image_data.consultation_id}",
        )

        return new_image
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")


@router.get(
    "/consultation/{consultation_id}",
    response_model=ConsultationImageListResponse,
    summary="Get images for a consultation",
)
async def get_consultation_images(
    consultation_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get all images for a specific consultation with pagination

    - **consultation_id**: ID of the consultation
    - **page**: Page number (1-indexed)
    - **page_size**: Number of items per page
    """
    try:
        # Get total count
        total = db.query(ConsultationImage).filter(
            ConsultationImage.consultation_id == consultation_id
        ).count()

        # Get paginated results
        images = (
            db.query(ConsultationImage)
            .filter(ConsultationImage.consultation_id == consultation_id)
            .order_by(desc(ConsultationImage.uploaded_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        total_pages = (total + page_size - 1) // page_size

        return ConsultationImageListResponse(
            images=images,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching images: {str(e)}")


@router.get(
    "/patient/{patient_id}",
    response_model=ConsultationImageListResponse,
    summary="Get images for a patient",
)
async def get_patient_images(
    patient_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get all images for a specific patient with pagination

    - **patient_id**: ID of the patient
    - **page**: Page number (1-indexed)
    - **page_size**: Number of items per page
    """
    try:
        # Get total count
        total = db.query(ConsultationImage).filter(
            ConsultationImage.patient_id == patient_id
        ).count()

        # Get paginated results
        images = (
            db.query(ConsultationImage)
            .filter(ConsultationImage.patient_id == patient_id)
            .order_by(desc(ConsultationImage.uploaded_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        total_pages = (total + page_size - 1) // page_size

        return ConsultationImageListResponse(
            images=images,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching images: {str(e)}")


@router.get(
    "/{image_id}",
    response_model=ConsultationImageResponse,
    summary="Get a specific image",
)
async def get_image(
    image_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get details of a specific image

    - **image_id**: ID of the image
    """
    image = db.query(ConsultationImage).filter(ConsultationImage.id == image_id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    return image


@router.put(
    "/{image_id}",
    response_model=ConsultationImageResponse,
    summary="Update image notes",
)
async def update_image(
    image_id: int,
    image_update: ConsultationImageUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update notes for a specific image

    - **image_id**: ID of the image
    - **notes**: Updated notes
    """
    image = db.query(ConsultationImage).filter(ConsultationImage.id == image_id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    if image_update.notes is not None:
        image.notes = image_update.notes

    db.commit()
    db.refresh(image)

    log_audit_event(
        db,
        "UPDATE_IMAGE",
        current_user.id,
        f"Updated image {image_id}",
    )

    return image


@router.delete("/{image_id}", status_code=204, summary="Delete an image")
async def delete_image(
    image_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a specific image

    - **image_id**: ID of the image
    """
    image = db.query(ConsultationImage).filter(ConsultationImage.id == image_id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    db.delete(image)
    db.commit()

    log_audit_event(
        db,
        "DELETE_IMAGE",
        current_user.id,
        f"Deleted image {image_id} (filename: {image.filename})",
    )

    return None
