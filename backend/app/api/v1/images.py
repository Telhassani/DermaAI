"""
Images API - Endpoints for managing consultation images and AI analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models import User, ConsultationImage
from app.models.consultation import Consultation
from app.schemas.image import (
    ConsultationImageCreate,
    ConsultationImageResponse,
    ConsultationImageListResponse,
    ConsultationImageUpdate,
    ImageAnalysisRequest,
    ImageAnalysisResponse,
)
from app.core.logging import log_audit_event
from app.api.utils import check_image_ownership
from app.services.ai_analysis import ai_service
from app.core.cache import redis_cache

router = APIRouter(tags=["images"])


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
        # Verify consultation exists and belongs to current doctor (authorization)
        consultation = db.query(Consultation).filter(
            Consultation.id == image_data.consultation_id
        ).first()

        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation non trouvée")

        if consultation.doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès refusé à cette consultation")

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

        # Audit log (using correct signature with keyword args)
        log_audit_event(
            user_id=str(current_user.id),
            action="UPLOAD_IMAGE",
            resource="image",
            details={
                "image_id": new_image.id,
                "filename": image_data.filename,
                "consultation_id": image_data.consultation_id,
                "file_size": image_data.file_size,
            },
            success=True,
        )

        return new_image
    except HTTPException:
        raise
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
        # Verify consultation exists and belongs to current doctor (authorization)
        consultation = db.query(Consultation).filter(
            Consultation.id == consultation_id
        ).first()

        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation non trouvée")

        if consultation.doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès refusé à cette consultation")

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
        # Import Patient model for authorization check
        from app.models.patient import Patient

        # Verify patient exists and belongs to current doctor (authorization)
        patient = db.query(Patient).filter(Patient.id == patient_id).first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient non trouvé")

        if patient.doctor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès refusé à ce patient")

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
    # Check image ownership (authorization)
    image = check_image_ownership(image_id, current_user, db)

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
    # Check image ownership (authorization)
    image = check_image_ownership(image_id, current_user, db)

    if image_update.notes is not None:
        image.notes = image_update.notes

    db.commit()
    db.refresh(image)

    # Audit log (using correct signature with keyword args)
    log_audit_event(
        user_id=str(current_user.id),
        action="UPDATE_IMAGE",
        resource="image",
        details={
            "image_id": image.id,
            "consultation_id": image.consultation_id,
        },
        success=True,
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
    # Check image ownership (authorization)
    image = check_image_ownership(image_id, current_user, db)

    # Store image info for logging
    filename = image.filename
    consultation_id = image.consultation_id

    db.delete(image)
    db.commit()

    # Audit log (using correct signature with keyword args)
    log_audit_event(
        user_id=str(current_user.id),
        action="DELETE_IMAGE",
        resource="image",
        details={
            "image_id": image_id,
            "filename": filename,
            "consultation_id": consultation_id,
        },
        success=True,
    )

    return None


# ============================================================================
# AI Image Analysis Endpoints
# ============================================================================


@router.post(
    "/{image_id}/analyze",
    response_model=ImageAnalysisResponse,
    summary="Analyze image with AI",
)
async def analyze_image(
    image_id: int,
    request: ImageAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Analyze a dermatology image using Claude 3.5 Sonnet vision capabilities.

    Provides:
    - Condition identification
    - Severity assessment
    - Clinical observations
    - Differential diagnoses
    - Treatment recommendations
    - Follow-up suggestions

    Note: AI analysis is for clinical support only. Professional medical consultation
    is always recommended.

    - **image_id**: ID of the image to analyze
    - **additional_notes**: Optional clinical context or patient information
    """
    try:
        # Check image ownership (authorization)
        image = check_image_ownership(image_id, current_user, db)

        # Check cache first
        cache_key = f"image:{image_id}:analysis"
        cached_result = redis_cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        # Call AI service to analyze image
        analysis_result = await ai_service.analyze_image(
            image_data=image.image_data,
            mime_type=image.mime_type,
            additional_notes=request.additional_notes,
        )

        # Store in cache for 24 hours (same analysis shouldn't change)
        redis_cache.set(cache_key, analysis_result, expire_seconds=86400)

        # Audit log
        log_audit_event(
            user_id=str(current_user.id),
            action="ANALYZE_IMAGE",
            resource="image",
            details={
                "image_id": image.id,
                "consultation_id": image.consultation_id,
                "condition": analysis_result.get("condition"),
                "confidence": analysis_result.get("confidence_percent", 0),
            },
            success=analysis_result.get("status") == "success",
        )

        return analysis_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing image: {str(e)}",
        )
