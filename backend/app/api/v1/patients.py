"""
Patient endpoints - CRUD operations for patients
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import date, datetime

from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient, Gender
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
)
from app.api.deps import get_current_active_user, get_current_doctor
from app.core.logging import log_audit_event
import math

router = APIRouter()


@router.get("", response_model=PatientListResponse)
async def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    search: Optional[str] = Query(None, description="Search by name, email, phone, or insurance number"),
    gender: Optional[Gender] = Query(None, description="Filter by gender"),
    doctor_id: Optional[int] = Query(None, description="Filter by doctor ID"),
    min_age: Optional[int] = Query(None, ge=0, le=150, description="Minimum age"),
    max_age: Optional[int] = Query(None, ge=0, le=150, description="Maximum age"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
):
    """
    List patients with pagination and filtering

    Args:
        db: Database session
        current_user: Current authenticated user
        search: Search query
        gender: Filter by gender
        doctor_id: Filter by doctor ID
        min_age: Minimum age filter
        max_age: Maximum age filter
        page: Page number (starts at 1)
        page_size: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort order (asc or desc)

    Returns:
        Paginated list of patients
    """
    # Build query
    query = db.query(Patient)

    # Apply filters
    if search:
        search_filter = or_(
            Patient.first_name.ilike(f"%{search}%"),
            Patient.last_name.ilike(f"%{search}%"),
            Patient.email.ilike(f"%{search}%"),
            Patient.phone.ilike(f"%{search}%"),
            Patient.insurance_number.ilike(f"%{search}%"),
            Patient.identification_number.ilike(f"%{search}%"),
        )
        query = query.filter(search_filter)

    if gender:
        query = query.filter(Patient.gender == gender)

    if doctor_id:
        query = query.filter(Patient.doctor_id == doctor_id)

    # Age filtering (calculate from date_of_birth)
    if min_age is not None or max_age is not None:
        today = date.today()

        if min_age is not None:
            # Max date of birth for minimum age
            max_dob = date(today.year - min_age, today.month, today.day)
            query = query.filter(Patient.date_of_birth <= max_dob)

        if max_age is not None:
            # Min date of birth for maximum age
            min_dob = date(today.year - max_age - 1, today.month, today.day)
            query = query.filter(Patient.date_of_birth >= min_dob)

    # Get total count before pagination
    total = query.count()

    # Apply sorting
    sort_field = getattr(Patient, sort_by, Patient.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_field.desc())
    else:
        query = query.order_by(sort_field.asc())

    # Apply pagination
    offset = (page - 1) * page_size
    patients = query.offset(offset).limit(page_size).all()

    # Calculate total pages
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PatientListResponse(
        patients=patients,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Create a new patient

    Args:
        patient_data: Patient creation data
        db: Database session
        current_user: Current authenticated doctor

    Returns:
        Created patient data

    Raises:
        HTTPException: If email already exists or validation fails
    """
    # Check if identification number already exists (REQUIRED - UNIQUE KEY)
    existing_patient = (
        db.query(Patient)
        .filter(Patient.identification_number == patient_data.identification_number)
        .first()
    )
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un patient avec ce numéro d'identification ({patient_data.identification_number}) existe déjà",
        )

    # Check if email already exists (if provided)
    if patient_data.email:
        existing_patient = (
            db.query(Patient).filter(Patient.email == patient_data.email).first()
        )
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A patient with this email already exists",
            )

    # Check if insurance number already exists (if provided)
    if patient_data.insurance_number:
        existing_patient = (
            db.query(Patient)
            .filter(Patient.insurance_number == patient_data.insurance_number)
            .first()
        )
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A patient with this insurance number already exists",
            )

    # Create new patient
    new_patient = Patient(**patient_data.model_dump())

    # If no doctor_id is provided, assign to current user (if they're a doctor)
    if not new_patient.doctor_id:
        new_patient.doctor_id = current_user.id

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="CREATE",
        resource="patient",
        details={
            "patient_id": new_patient.id,
            "patient_name": new_patient.full_name,
        },
        success=True,
    )

    return new_patient


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a patient by ID

    Args:
        patient_id: Patient ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Patient data

    Raises:
        HTTPException: If patient not found
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Update a patient

    Args:
        patient_id: Patient ID
        patient_data: Patient update data
        db: Database session
        current_user: Current authenticated doctor

    Returns:
        Updated patient data

    Raises:
        HTTPException: If patient not found or validation fails
    """
    # Get patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    # Check if email already exists (if being updated)
    if patient_data.email and patient_data.email != patient.email:
        existing_patient = (
            db.query(Patient)
            .filter(Patient.email == patient_data.email)
            .filter(Patient.id != patient_id)
            .first()
        )
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A patient with this email already exists",
            )

    # Check if insurance number already exists (if being updated)
    if (
        patient_data.insurance_number
        and patient_data.insurance_number != patient.insurance_number
    ):
        existing_patient = (
            db.query(Patient)
            .filter(Patient.insurance_number == patient_data.insurance_number)
            .filter(Patient.id != patient_id)
            .first()
        )
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A patient with this insurance number already exists",
            )

    # Update patient fields
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="UPDATE",
        resource="patient",
        details={
            "patient_id": patient.id,
            "patient_name": patient.full_name,
            "updated_fields": list(update_data.keys()),
        },
        success=True,
    )

    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
    """
    Delete a patient (soft delete by setting is_active=False in future)

    Args:
        patient_id: Patient ID
        db: Database session
        current_user: Current authenticated doctor

    Raises:
        HTTPException: If patient not found
    """
    # Get patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    # Store patient info for logging before deletion
    patient_name = patient.full_name

    # Hard delete for now (consider soft delete in production)
    db.delete(patient)
    db.commit()

    # Log audit event
    log_audit_event(
        user_id=str(current_user.id),
        action="DELETE",
        resource="patient",
        details={
            "patient_id": patient_id,
            "patient_name": patient_name,
        },
        success=True,
    )

    return None


@router.get("/{patient_id}/stats")
async def get_patient_stats(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get statistics for a specific patient

    Args:
        patient_id: Patient ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Patient statistics (appointments, prescriptions, etc.)

    Raises:
        HTTPException: If patient not found
    """
    # Get patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    # TODO: Add queries for appointments, prescriptions, images, etc.
    # For now, return basic stats
    stats = {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "age": patient.age,
        "total_appointments": 0,  # TODO: Query from appointments table
        "total_prescriptions": 0,  # TODO: Query from prescriptions table
        "total_images": 0,  # TODO: Query from images table
        "last_visit": None,  # TODO: Query last appointment
    }

    return stats
