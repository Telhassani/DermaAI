"""
Seed script to populate the database with test data
"""
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.patient import Patient, Gender, IdentificationType
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_test_users(db: Session):
    """Create test users"""
    print("Creating test users...")

    # Check if users already exist
    existing = db.query(User).filter(User.email == "dr.smith@dermai.com").first()
    if existing:
        print("  Test users already exist, skipping...")
        return existing

    # Create a test doctor
    doctor = User(
        email="dr.smith@dermai.com",
        full_name="Dr. John Smith",
        role=UserRole.DOCTOR,
        hashed_password=pwd_context.hash("password123"),
        is_active=True,
        is_verified=True,
        phone="+1234567890"
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    print(f"  Created doctor: {doctor.email}")

    return doctor


def create_test_patients(db: Session):
    """Create test patients"""
    print("Creating test patients...")

    # Check if patients already exist
    existing = db.query(Patient).filter(Patient.email == "patient1@example.com").first()
    if existing:
        print("  Test patients already exist, skipping...")
        return db.query(Patient).all()

    patients_data = [
        {
            "email": "patient1@example.com",
            "first_name": "Alice",
            "last_name": "Johnson",
            "date_of_birth": datetime(1985, 3, 15),
            "gender": Gender.FEMALE,
            "phone": "+33612345678",
            "address": "123 Avenue des Champs-Élysées",
            "city": "Paris",
            "postal_code": "75008",
            "country": "France",
            "identification_type": IdentificationType.CIN,
            "identification_number": "123456789",
            "insurance_number": "1850315123456",
            "allergies": "Pénicilline",
            "medical_history": "Aucun antécédent majeur",
        },
        {
            "email": "patient2@example.com",
            "first_name": "Marc",
            "last_name": "Dubois",
            "date_of_birth": datetime(1990, 7, 22),
            "gender": Gender.MALE,
            "phone": "+33623456789",
            "address": "456 Rue de la République",
            "city": "Lyon",
            "postal_code": "69002",
            "country": "France",
            "identification_type": IdentificationType.CIN,
            "identification_number": "987654321",
            "insurance_number": "1900722987654",
            "allergies": "Aucune allergie connue",
            "medical_history": "Eczéma dans l'enfance",
        },
        {
            "email": "patient3@example.com",
            "first_name": "Sophie",
            "last_name": "Martin",
            "date_of_birth": datetime(1978, 11, 30),
            "gender": Gender.FEMALE,
            "phone": "+33634567890",
            "address": "789 Boulevard Haussmann",
            "city": "Paris",
            "postal_code": "75009",
            "country": "France",
            "identification_type": IdentificationType.PASSPORT,
            "identification_number": "78FR45612",
            "insurance_number": "1781130456789",
            "allergies": "Latex",
            "medical_history": "Psoriasis léger",
        },
    ]

    patients = []
    for data in patients_data:
        patient = Patient(**data)
        db.add(patient)
        patients.append(patient)

    db.commit()

    for patient in patients:
        db.refresh(patient)
        print(f"  Created patient: {patient.first_name} {patient.last_name}")

    return patients


def create_test_appointments(db: Session, doctor: User, patients: list):
    """Create test appointments"""
    print("Creating test appointments...")

    # Check if appointments already exist
    existing = db.query(Appointment).first()
    if existing:
        print("  Test appointments already exist, skipping...")
        return

    now = datetime.now()

    appointments_data = [
        {
            "patient_id": patients[0].id,
            "doctor_id": doctor.id,
            "type": AppointmentType.CONSULTATION,
            "start_time": now + timedelta(days=1, hours=9),
            "end_time": now + timedelta(days=1, hours=10),
            "status": AppointmentStatus.SCHEDULED,
            "reason": "Contrôle dermatologique de routine",
            "notes": "Patient signale une légère éruption cutanée sur le bras",
        },
        {
            "patient_id": patients[1].id,
            "doctor_id": doctor.id,
            "type": AppointmentType.FOLLOW_UP,
            "start_time": now + timedelta(days=2, hours=14),
            "end_time": now + timedelta(days=2, hours=15),
            "status": AppointmentStatus.SCHEDULED,
            "reason": "Suivi traitement de l'acné",
            "notes": "Vérifier les progrès du traitement prescrit",
        },
        {
            "patient_id": patients[2].id,
            "doctor_id": doctor.id,
            "type": AppointmentType.CONSULTATION,
            "start_time": now + timedelta(days=3, hours=11),
            "end_time": now + timedelta(days=3, hours=12),
            "status": AppointmentStatus.SCHEDULED,
            "reason": "Examen d'un grain de beauté",
            "notes": "Patient inquiet d'un grain de beauté qui change",
        },
        # Past appointment
        {
            "patient_id": patients[0].id,
            "doctor_id": doctor.id,
            "type": AppointmentType.CONSULTATION,
            "start_time": now - timedelta(days=7, hours=10),
            "end_time": now - timedelta(days=7, hours=11),
            "status": AppointmentStatus.COMPLETED,
            "reason": "Consultation initiale",
            "notes": "Crème topique prescrite",
        },
    ]

    appointments = []
    for data in appointments_data:
        appointment = Appointment(**data)
        db.add(appointment)
        appointments.append(appointment)

    db.commit()

    for appointment in appointments:
        db.refresh(appointment)
        print(f"  Created appointment: {appointment.reason} - {appointment.status}")

    return appointments


def main():
    """Main seeding function"""
    print("\n" + "="*60)
    print("DermAI Database Seeding Script")
    print("="*60 + "\n")

    db = SessionLocal()

    try:
        # Create test data
        doctor = create_test_users(db)
        patients = create_test_patients(db)
        appointments = create_test_appointments(db, doctor, patients)

        print("\n" + "="*60)
        print("Database seeding completed successfully!")
        print("="*60)
        print(f"\nTest credentials:")
        print(f"  Email: dr.smith@dermai.com")
        print(f"  Password: password123")
        print(f"\nCreated:")
        print(f"  - 1 doctor user")
        print(f"  - {len(patients)} patients")
        print(f"  - {len(appointments) if appointments else 4} appointments")
        print("\n")

    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
