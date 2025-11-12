"""
Access control utilities for authorization checks
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.prescription import Prescription
from app.models.image import ConsultationImage


def check_patient_ownership(
    patient_id: int,
    current_user: User,
    db: Session
) -> Patient:
    """
    Verify that the current user (doctor) owns the patient.

    Args:
        patient_id: Patient ID to check
        current_user: Current authenticated user
        db: Database session

    Returns:
        Patient object if access is allowed

    Raises:
        HTTPException: 404 if patient not found, 403 if not authorized
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient non trouvé"
        )

    # Check if patient belongs to current doctor
    if patient.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce patient"
        )

    return patient


def check_consultation_ownership(
    consultation_id: int,
    current_user: User,
    db: Session
) -> Consultation:
    """
    Verify that the current user (doctor) owns the consultation.

    Args:
        consultation_id: Consultation ID to check
        current_user: Current authenticated user
        db: Database session

    Returns:
        Consultation object if access is allowed

    Raises:
        HTTPException: 404 if consultation not found, 403 if not authorized
    """
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation non trouvée"
        )

    # Check if consultation belongs to current doctor
    if consultation.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cette consultation"
        )

    return consultation


def check_prescription_ownership(
    prescription_id: int,
    current_user: User,
    db: Session
) -> Prescription:
    """
    Verify that the current user (doctor) owns the prescription.

    Args:
        prescription_id: Prescription ID to check
        current_user: Current authenticated user
        db: Database session

    Returns:
        Prescription object if access is allowed

    Raises:
        HTTPException: 404 if prescription not found, 403 if not authorized
    """
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée"
        )

    # Get the consultation to verify doctor ownership
    consultation = db.query(Consultation).filter(
        Consultation.id == prescription.consultation_id
    ).first()

    if not consultation or consultation.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cette ordonnance"
        )

    return prescription


def check_image_ownership(
    image_id: int,
    current_user: User,
    db: Session
) -> ConsultationImage:
    """
    Verify that the current user (doctor) owns the image.

    Args:
        image_id: Image ID to check
        current_user: Current authenticated user
        db: Database session

    Returns:
        ConsultationImage object if access is allowed

    Raises:
        HTTPException: 404 if image not found, 403 if not authorized
    """
    image = db.query(ConsultationImage).filter(
        ConsultationImage.id == image_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image non trouvée"
        )

    # Get the consultation to verify doctor ownership
    consultation = db.query(Consultation).filter(
        Consultation.id == image.consultation_id
    ).first()

    if not consultation or consultation.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cette image"
        )

    return image
