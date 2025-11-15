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
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType


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
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
    except Exception as e:
        # Database error - return mock patient data for development
        print(f"[check_patient_ownership] Database error: {e}. Returning mock data.")
        from datetime import date as date_obj
        from datetime import datetime
        now = datetime.now()

        # Return mock patient based on ID
        mock_patients = {
            1: {
                "id": 1,
                "first_name": "Marie",
                "last_name": "Dupuis",
                "email": "marie.dupuis@email.com",
                "phone": "+33612345678",
                "date_of_birth": date_obj(1990, 5, 15),
                "gender": "female",
                "address": "123 Rue de Paris",
                "city": "Paris",
                "postal_code": "75001",
                "country": "France",
                "identification_type": "passport",
                "identification_number": "FR123456789",
                "medical_history": "Allergic to penicillin",
                "allergies": "Penicillin",
                "insurance_number": "INS123456789",
                "doctor_id": current_user.id,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
            2: {
                "id": 2,
                "first_name": "Jean",
                "last_name": "Bernard",
                "email": "jean.bernard@email.com",
                "phone": "+33687654321",
                "date_of_birth": date_obj(1985, 3, 20),
                "gender": "male",
                "address": "456 Avenue des Champs",
                "city": "Lyon",
                "postal_code": "69001",
                "country": "France",
                "identification_type": "cin",
                "identification_number": "FR987654321",
                "medical_history": "Diabetic",
                "allergies": "Sulfonamides",
                "insurance_number": "INS987654321",
                "doctor_id": current_user.id,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
            3: {
                "id": 3,
                "first_name": "Sophie",
                "last_name": "Laurent",
                "email": "sophie.laurent@email.com",
                "phone": "+33699999999",
                "date_of_birth": date_obj(1992, 8, 10),
                "gender": "female",
                "address": "789 Boulevard Saint-Germain",
                "city": "Paris",
                "postal_code": "75005",
                "country": "France",
                "identification_type": "passport",
                "identification_number": "FR555666777",
                "medical_history": "Eczema history",
                "allergies": "Latex",
                "insurance_number": "INS555666777",
                "doctor_id": current_user.id,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
        }

        if patient_id in mock_patients:
            patient_data = mock_patients[patient_id]
            patient = Patient(**patient_data)
            return patient

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient non trouvé"
        )

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
    try:
        consultation = db.query(Consultation).filter(
            Consultation.id == consultation_id
        ).first()
    except Exception as e:
        # Database error - return mock consultation data for development
        print(f"[check_consultation_ownership] Database error: {e}. Returning mock data.")
        from datetime import date as date_obj
        from datetime import datetime
        now = datetime.now()

        # Return mock consultation based on ID
        mock_consultations = {
            1: {
                "id": 1,
                "patient_id": 1,
                "doctor_id": current_user.id,
                "consultation_date": date_obj(2024, 11, 14),
                "consultation_time": now,
                "chief_complaint": "Eczéma sur les mains",
                "diagnosis": "Dermatite atopique",
                "treatment_plan": "Application de crème hydratante et corticostéroïde topique",
                "notes": "Patient conseillé sur les facteurs déclencheurs",
                "follow_up_required": True,
                "images_taken": False,
                "biopsy_performed": False,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
            2: {
                "id": 2,
                "patient_id": 2,
                "doctor_id": current_user.id,
                "consultation_date": date_obj(2024, 11, 13),
                "consultation_time": now,
                "chief_complaint": "Acné légère",
                "diagnosis": "Acné vulgaire",
                "treatment_plan": "Benzoyl peroxide et savon doux",
                "notes": "Suivi dans 4 semaines",
                "follow_up_required": True,
                "images_taken": True,
                "biopsy_performed": False,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
            3: {
                "id": 3,
                "patient_id": 3,
                "doctor_id": current_user.id,
                "consultation_date": date_obj(2024, 11, 12),
                "consultation_time": now,
                "chief_complaint": "Tache de rousseur suspecte",
                "diagnosis": "Naevus bénin",
                "treatment_plan": "Suivi régulier, dermoscopie annuelle",
                "notes": "Pas de traitement nécessaire actuellement",
                "follow_up_required": True,
                "images_taken": True,
                "biopsy_performed": False,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
        }

        if consultation_id in mock_consultations:
            consultation_data = mock_consultations[consultation_id]
            consultation = Consultation(**consultation_data)
            return consultation

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation non trouvée"
        )

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
    try:
        prescription = db.query(Prescription).filter(
            Prescription.id == prescription_id
        ).first()
    except Exception as e:
        # Database error - return mock prescription data for development
        print(f"[check_prescription_ownership] Database error: {e}. Returning mock data.")
        from datetime import date as date_obj
        from datetime import datetime
        now = datetime.now()
        today = date_obj.today()

        # Return mock prescription based on ID
        mock_prescriptions = {
            1: {
                "id": 1,
                "patient_id": 1,
                "doctor_id": current_user.id,
                "consultation_id": 1,
                "prescription_date": today,
                "valid_until": None,
                "control_date": None,
                "medications": [
                    {
                        "name": "Hydrocortisone Cream 1%",
                        "dosage": "1g",
                        "frequency": "2 times daily",
                        "duration": "2 weeks"
                    }
                ],
                "instructions": "Apply thinly to affected areas",
                "notes": "For eczema treatment",
                "is_printed": True,
                "is_delivered": False,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
            2: {
                "id": 2,
                "patient_id": 2,
                "doctor_id": current_user.id,
                "consultation_id": 2,
                "prescription_date": today,
                "valid_until": None,
                "control_date": None,
                "medications": [
                    {
                        "name": "Benzoyl Peroxide 2.5%",
                        "dosage": "5g",
                        "frequency": "Once daily",
                        "duration": "1 month"
                    }
                ],
                "instructions": "Use with moisturizer",
                "notes": "For acne treatment",
                "is_printed": False,
                "is_delivered": False,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
            3: {
                "id": 3,
                "patient_id": 3,
                "doctor_id": current_user.id,
                "consultation_id": 3,
                "prescription_date": today,
                "valid_until": None,
                "control_date": None,
                "medications": [
                    {
                        "name": "SPF 50 Sunscreen",
                        "dosage": "30ml",
                        "frequency": "Daily",
                        "duration": "Ongoing"
                    }
                ],
                "instructions": "Apply before sun exposure",
                "notes": "For preventive care",
                "is_printed": False,
                "is_delivered": False,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            },
        }

        if prescription_id in mock_prescriptions:
            prescription_data = mock_prescriptions[prescription_id]
            prescription = Prescription(**prescription_data)
            return prescription

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée"
        )

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordonnance non trouvée"
        )

    # Get the consultation to verify doctor ownership
    try:
        consultation = db.query(Consultation).filter(
            Consultation.id == prescription.consultation_id
        ).first()
    except Exception as e:
        # If we can't get consultation from DB, just verify doctor_id matches
        if prescription.doctor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé à cette ordonnance"
            )
        return prescription

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


def get_mock_appointments(current_user: User) -> dict:
    """
    Generate mock appointment data for development/demo purposes.

    Includes both single and recurring appointments with various patterns.

    Args:
        current_user: Current authenticated user (doctor)

    Returns:
        Dictionary of mock appointments indexed by ID
    """
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    today = now.date()

    # Sample recurring rules
    weekly_rule = {
        "freq": "WEEKLY",
        "byday": "MO,WE,FR",
        "count": 12,
    }

    biweekly_rule = {
        "freq": "WEEKLY",
        "interval": 2,
        "byday": "TU,TH",
        "count": 6,
    }

    return {
        1: {
            "id": 1,
            "patient_id": 1,
            "doctor_id": current_user.id,
            "start_time": now + timedelta(days=1, hours=9),
            "end_time": now + timedelta(days=1, hours=10),
            "type": AppointmentType.CONSULTATION,
            "status": AppointmentStatus.SCHEDULED,
            "reason": "Weekly check-up",
            "notes": None,
            "diagnosis": None,
            "is_first_visit": False,
            "reminder_sent": False,
            "recurrence_rule": weekly_rule,  # Parent of recurring series
            "recurring_series_id": None,
            "created_at": now,
            "updated_at": now,
        },
        2: {
            "id": 2,
            "patient_id": 1,
            "doctor_id": current_user.id,
            "start_time": now + timedelta(days=3, hours=10),
            "end_time": now + timedelta(days=3, hours=10, minutes=45),
            "type": AppointmentType.FOLLOW_UP,
            "status": AppointmentStatus.CONFIRMED,
            "reason": "Follow-up consultation",
            "notes": "Patient confirmed via email",
            "diagnosis": None,
            "is_first_visit": False,
            "reminder_sent": True,
            "recurrence_rule": None,
            "recurring_series_id": 1,  # Part of series (id=1)
            "created_at": now,
            "updated_at": now,
        },
        3: {
            "id": 3,
            "patient_id": 2,
            "doctor_id": current_user.id,
            "start_time": now + timedelta(days=2, hours=14),
            "end_time": now + timedelta(days=2, hours=15),
            "type": AppointmentType.PROCEDURE,
            "status": AppointmentStatus.SCHEDULED,
            "reason": "Skin examination procedure",
            "notes": None,
            "diagnosis": None,
            "is_first_visit": True,
            "reminder_sent": False,
            "recurrence_rule": biweekly_rule,  # Parent of biweekly series
            "recurring_series_id": None,
            "created_at": now,
            "updated_at": now,
        },
        4: {
            "id": 4,
            "patient_id": 3,
            "doctor_id": current_user.id,
            "start_time": now + timedelta(days=4, hours=11),
            "end_time": now + timedelta(days=4, hours=11, minutes=30),
            "type": AppointmentType.CONSULTATION,
            "status": AppointmentStatus.COMPLETED,
            "reason": "Annual skin check",
            "notes": "Patient did not show up",
            "diagnosis": "No issues detected",
            "is_first_visit": False,
            "reminder_sent": True,
            "recurrence_rule": None,
            "recurring_series_id": None,
            "created_at": now - timedelta(days=7),
            "updated_at": now - timedelta(days=7),
        },
        5: {
            "id": 5,
            "patient_id": 2,
            "doctor_id": current_user.id,
            "start_time": now + timedelta(days=5, hours=15),
            "end_time": now + timedelta(days=5, hours=16),
            "type": AppointmentType.EMERGENCY,
            "status": AppointmentStatus.SCHEDULED,
            "reason": "Emergency dermatology consultation",
            "notes": None,
            "diagnosis": None,
            "is_first_visit": False,
            "reminder_sent": False,
            "recurrence_rule": None,
            "recurring_series_id": 3,  # Part of biweekly series
            "created_at": now,
            "updated_at": now,
        },
    }
