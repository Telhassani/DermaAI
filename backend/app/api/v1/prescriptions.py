"""
Prescription endpoints - CRUD operations for medical prescriptions
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
import math

from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.prescription import Prescription
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    PrescriptionListResponse,
    PrescriptionPrintData,
)
from app.api.deps import get_current_active_user, get_current_doctor
from app.core.logging import log_audit_event

router = APIRouter()


@router.get("", response_model=PrescriptionListResponse)
async def list_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    consultation_id: Optional[int] = Query(None, description="Filter by consultation ID"),
    doctor_id: Optional[int] = Query(None, description="Filter by doctor ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List prescriptions with pagination and filtering

    Args:
        db: Database session
        current_user: Current authenticated user
        patient_id: Filter by patient ID
        consultation_id: Filter by consultation ID
        doctor_id: Filter by doctor ID
        page: Page number (starts at 1)
        page_size: Number of items per page

    Returns:
        Paginated list of prescriptions
    """
    # Build query
    query = db.query(Prescription)

    # Apply filters
    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)

    if consultation_id:
        query = query.filter(Prescription.consultation_id == consultation_id)

    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)

    # Order by prescription date (most recent first)
    query = query.order_by(desc(Prescription.prescription_date), desc(Prescription.created_at))

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    prescriptions = query.offset(offset).limit(page_size).all()

    # Calculate total pages
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PrescriptionListResponse(
        prescriptions=prescriptions,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Create a new prescription

    Args:
        prescription_data: Prescription creation data
        db: Database session
        current_user: Current authenticated doctor

    Returns:
        Created prescription data

    Raises:
        HTTPException: If consultation or patient not found or validation fails
    """
    # Verify consultation exists
    consultation = db.query(Consultation).filter(Consultation.id == prescription_data.consultation_id).first()
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation non trouvée",
        )

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == prescription_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient non trouvé",
        )

    # Verify patient matches consultation
    if consultation.patient_id != prescription_data.patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le patient ne correspond pas à la consultation",
        )

    # Convert medications to dict for JSON storage
    medications_dict = [med.model_dump() for med in prescription_data.medications]

    # Create new prescription
    new_prescription = Prescription(
        consultation_id=prescription_data.consultation_id,
        patient_id=prescription_data.patient_id,
        doctor_id=current_user.id,
        prescription_date=prescription_data.prescription_date,
        valid_until=prescription_data.valid_until,
        medications=medications_dict,
        instructions=prescription_data.instructions,
        notes=prescription_data.notes,
    )

    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="CREATE",
        resource="prescription",
        details={
            "prescription_id": new_prescription.id,
            "consultation_id": consultation.id,
            "patient_id": patient.id,
            "patient_name": patient.full_name,
            "medication_count": len(medications_dict),
        },
        success=True,
    )

    return new_prescription


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a prescription by ID

    Args:
        prescription_id: Prescription ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Prescription data

    Raises:
        HTTPException: If prescription not found
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée",
        )

    return prescription


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: int,
    prescription_data: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Update a prescription

    Args:
        prescription_id: Prescription ID
        prescription_data: Prescription update data
        db: Database session
        current_user: Current authenticated doctor

    Returns:
        Updated prescription data

    Raises:
        HTTPException: If prescription not found or validation fails
    """
    # Get prescription
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée",
        )

    # Update prescription fields
    update_data = prescription_data.model_dump(exclude_unset=True)

    # Convert medications to dict if provided
    if "medications" in update_data and update_data["medications"]:
        update_data["medications"] = [med.model_dump() for med in prescription_data.medications]

    for field, value in update_data.items():
        setattr(prescription, field, value)

    db.commit()
    db.refresh(prescription)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="UPDATE",
        resource="prescription",
        details={
            "prescription_id": prescription.id,
            "consultation_id": prescription.consultation_id,
            "patient_id": prescription.patient_id,
            "updated_fields": list(update_data.keys()),
        },
        success=True,
    )

    return prescription


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Delete a prescription

    Args:
        prescription_id: Prescription ID
        db: Database session
        current_user: Current authenticated doctor

    Raises:
        HTTPException: If prescription not found
    """
    # Get prescription
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée",
        )

    # Store prescription info for logging before deletion
    consultation_id = prescription.consultation_id
    patient_id = prescription.patient_id

    # Delete prescription
    db.delete(prescription)
    db.commit()

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="DELETE",
        resource="prescription",
        details={
            "prescription_id": prescription_id,
            "consultation_id": consultation_id,
            "patient_id": patient_id,
        },
        success=True,
    )

    return None


@router.post("/{prescription_id}/mark-printed", response_model=PrescriptionResponse)
async def mark_prescription_printed(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Mark a prescription as printed

    Args:
        prescription_id: Prescription ID
        db: Database session
        current_user: Current authenticated doctor

    Returns:
        Updated prescription data

    Raises:
        HTTPException: If prescription not found
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée",
        )

    prescription.is_printed = True
    db.commit()
    db.refresh(prescription)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="PRINT",
        resource="prescription",
        details={
            "prescription_id": prescription.id,
            "consultation_id": prescription.consultation_id,
            "patient_id": prescription.patient_id,
        },
        success=True,
    )

    return prescription


@router.post("/{prescription_id}/mark-delivered", response_model=PrescriptionResponse)
async def mark_prescription_delivered(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Mark a prescription as delivered to patient

    Args:
        prescription_id: Prescription ID
        db: Database session
        current_user: Current authenticated doctor

    Returns:
        Updated prescription data

    Raises:
        HTTPException: If prescription not found
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée",
        )

    prescription.is_delivered = True
    db.commit()
    db.refresh(prescription)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="DELIVER",
        resource="prescription",
        details={
            "prescription_id": prescription.id,
            "consultation_id": prescription.consultation_id,
            "patient_id": prescription.patient_id,
        },
        success=True,
    )

    return prescription


@router.get("/{prescription_id}/print-data", response_model=PrescriptionPrintData)
async def get_prescription_print_data(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get prescription data formatted for printing

    Args:
        prescription_id: Prescription ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Prescription data formatted for printing

    Raises:
        HTTPException: If prescription not found
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée",
        )

    # Get patient and doctor data
    patient = db.query(Patient).filter(Patient.id == prescription.patient_id).first()
    doctor = db.query(User).filter(User.id == prescription.doctor_id).first()

    # Format print data
    print_data = PrescriptionPrintData(
        prescription_id=prescription.id,
        prescription_date=prescription.prescription_date,
        patient_name=patient.full_name,
        patient_identification=f"{patient.identification_type.value.upper()}: {patient.identification_number}",
        patient_age=patient.age,
        patient_address=f"{patient.address}, {patient.city}" if patient.address and patient.city else None,
        doctor_name=doctor.full_name,
        doctor_credentials=None,  # TODO: Add doctor credentials field to User model
        doctor_address=None,  # TODO: Add doctor address field to User model
        doctor_phone=doctor.phone if hasattr(doctor, 'phone') else None,
        medications=prescription.medications,
        instructions=prescription.instructions,
        notes=prescription.notes,
        valid_until=prescription.valid_until,
    )

    return print_data
