"""
Consultation endpoints - CRUD operations for medical consultations
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from datetime import datetime
import math

from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationUpdate,
    ConsultationResponse,
    ConsultationListResponse,
)
from app.api.deps import get_current_active_user, get_current_doctor
from app.core.logging import log_audit_event
from app.api.utils import check_consultation_ownership, check_patient_ownership

router = APIRouter()


@router.get("", response_model=ConsultationListResponse)
async def list_consultations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    doctor_id: Optional[int] = Query(None, description="Filter by doctor ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List consultations with pagination and filtering

    Args:
        db: Database session
        current_user: Current authenticated user
        patient_id: Filter by patient ID
        doctor_id: Filter by doctor ID
        page: Page number (starts at 1)
        page_size: Number of items per page

    Returns:
        Paginated list of consultations
    """
    # Build query with eager loading to avoid N+1 problem
    query = db.query(Consultation).options(joinedload(Consultation.patient_rel))

    # Exclude soft-deleted records
    query = query.filter(Consultation.is_deleted == False)

    # Filter by current doctor (authorization check)
    # Each doctor can only see their own consultations
    query = query.filter(Consultation.doctor_id == current_user.id)

    # Apply filters
    if patient_id:
        query = query.filter(Consultation.patient_id == patient_id)

    # Ignore doctor_id filter parameter as each doctor can only see their own
    # if doctor_id:
    #     query = query.filter(Consultation.doctor_id == doctor_id)

    # Order by consultation date (most recent first)
    query = query.order_by(desc(Consultation.consultation_date), desc(Consultation.consultation_time))

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    consultations = query.offset(offset).limit(page_size).all()

    # Calculate total pages
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    # Enrich consultations with patient names from eager-loaded relationship
    for consultation in consultations:
        if consultation.patient_rel:
            consultation.patient_name = consultation.patient_rel.full_name

    return ConsultationListResponse(
        consultations=consultations,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
async def create_consultation(
    consultation_data: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Create a new consultation

    Args:
        consultation_data: Consultation creation data
        db: Database session
        current_user: Current authenticated doctor

    Returns:
        Created consultation data

    Raises:
        HTTPException: If patient not found or validation fails
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == consultation_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient non trouvé",
        )

    # Create new consultation
    new_consultation = Consultation(**consultation_data.model_dump())
    new_consultation.doctor_id = current_user.id
    new_consultation.consultation_time = datetime.now()

    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="CREATE",
        resource="consultation",
        details={
            "consultation_id": new_consultation.id,
            "patient_id": patient.id,
            "patient_name": patient.full_name,
        },
        success=True,
    )

    return new_consultation


@router.get("/{consultation_id}", response_model=ConsultationResponse)
async def get_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a consultation by ID

    Args:
        consultation_id: Consultation ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Consultation data

    Raises:
        HTTPException: If consultation not found or access denied
    """
    # Check consultation ownership (authorization)
    consultation = check_consultation_ownership(consultation_id, current_user, db)

    return consultation


@router.put("/{consultation_id}", response_model=ConsultationResponse)
async def update_consultation(
    consultation_id: int,
    consultation_data: ConsultationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Update a consultation

    Args:
        consultation_id: Consultation ID
        consultation_data: Consultation update data
        db: Database session
        current_user: Current authenticated doctor

    Returns:
        Updated consultation data

    Raises:
        HTTPException: If consultation not found or access denied or validation fails
    """
    # Check consultation ownership (authorization)
    consultation = check_consultation_ownership(consultation_id, current_user, db)

    # Update consultation fields
    update_data = consultation_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consultation, field, value)

    db.commit()
    db.refresh(consultation)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="UPDATE",
        resource="consultation",
        details={
            "consultation_id": consultation.id,
            "patient_id": consultation.patient_id,
            "updated_fields": list(update_data.keys()),
        },
        success=True,
    )

    return consultation


@router.delete("/{consultation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Delete a consultation (soft delete for HIPAA compliance)

    Args:
        consultation_id: Consultation ID
        db: Database session
        current_user: Current authenticated doctor

    Raises:
        HTTPException: If consultation not found or access denied
    """
    # Check consultation ownership (authorization)
    consultation = check_consultation_ownership(consultation_id, current_user, db)

    # Store consultation info for logging before deletion
    patient_id = consultation.patient_id

    # Soft delete: mark as deleted instead of removing from database
    consultation.is_deleted = True
    consultation.deleted_at = datetime.now()
    db.commit()

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="DELETE",
        resource="consultation",
        details={
            "consultation_id": consultation_id,
            "patient_id": patient_id,
            "soft_delete": True,
        },
        success=True,
    )

    return None


@router.get("/patient/{patient_id}/history", response_model=ConsultationListResponse)
async def get_patient_consultation_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
):
    """
    Get consultation history for a specific patient (sorted by date, most recent first)

    Args:
        patient_id: Patient ID
        db: Database session
        current_user: Current authenticated user
        page: Page number
        page_size: Items per page

    Returns:
        Paginated list of consultations for the patient

    Raises:
        HTTPException: If patient not found or access denied
    """
    # Verify patient exists and belongs to current doctor (authorization)
    patient = check_patient_ownership(patient_id, current_user, db)

    # Query consultations for this patient with eager loading
    query = db.query(Consultation).filter(Consultation.patient_id == patient_id).options(joinedload(Consultation.patient_rel))

    # Exclude soft-deleted records
    query = query.filter(Consultation.is_deleted == False)

    # Order by date (most recent first)
    query = query.order_by(desc(Consultation.consultation_date), desc(Consultation.consultation_time))

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    consultations = query.offset(offset).limit(page_size).all()

    # Calculate total pages
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    # Enrich consultations with patient name (from eager-loaded relationship or fallback)
    for consultation in consultations:
        if consultation.patient_rel:
            consultation.patient_name = consultation.patient_rel.full_name
        else:
            consultation.patient_name = patient.full_name

    return ConsultationListResponse(
        consultations=consultations,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
