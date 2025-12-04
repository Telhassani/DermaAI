"""
Initialize database - Create tables and seed data
Run this script to set up the database for the first time
"""

import sys
from pathlib import Path
from datetime import date, datetime, timedelta

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.db.base import Base
from app.db.session import engine
from app.models import User, Patient, Appointment
from app.models.consultation import Consultation
from app.models.prescription import Prescription
from app.models.appointment import AppointmentStatus, AppointmentType
from app.core.security import get_password_hash
from app.models.user import UserRole
from sqlalchemy.orm import Session


def create_tables():
    """Create all database tables"""
    print("🗄️  Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")


def seed_data():
    """Seed initial data (admin user, demo users, and sample patients)"""
    print("🌱 Seeding initial data...")

    db = Session(bind=engine)

    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@dermai.com").first()

        # Get or create users
        if existing_admin:
            print("⚠️  Admin user already exists. Updating password hash...")
            # Always update the password hash to ensure it's correct
            existing_admin.hashed_password = get_password_hash("password123")
            db.add(existing_admin)
            admin_user = existing_admin
        else:
            admin_user = User(
                email="admin@dermai.com",
                hashed_password=get_password_hash("password123"),
                full_name="DermAI Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                phone="+33123456789",
            )
            db.add(admin_user)

        # Check if doctor exists
        existing_doctor = db.query(User).filter(User.email == "doctor@dermai.com").first()
        if existing_doctor:
            print("⚠️  Doctor user already exists. Updating password hash...")
            # Always update the password hash to ensure it's correct
            existing_doctor.hashed_password = get_password_hash("password123")
            db.add(existing_doctor)
            doctor_user = existing_doctor
        else:
            doctor_user = User(
                email="doctor@dermai.com",
                hashed_password=get_password_hash("password123"),
                full_name="Dr. Jean Dupont",
                role=UserRole.DOCTOR,
                is_active=True,
                is_verified=True,
                phone="+33987654321",
            )
            db.add(doctor_user)

        # Check if secretary exists
        existing_secretary = db.query(User).filter(User.email == "secretary@dermai.com").first()
        if existing_secretary:
            print("⚠️  Secretary user already exists. Updating password hash...")
            # Always update the password hash to ensure it's correct
            existing_secretary.hashed_password = get_password_hash("password123")
            db.add(existing_secretary)
            secretary_user = existing_secretary
        else:
            secretary_user = User(
                email="secretary@dermai.com",
                hashed_password=get_password_hash("password123"),
                full_name="Marie Martin",
                role=UserRole.SECRETARY,
                is_active=True,
                is_verified=True,
                phone="+33555123456",
            )
            db.add(secretary_user)

        db.commit()

        if not existing_admin or not existing_doctor or not existing_secretary:
            print("✅ Users created successfully!")
            print("\n📝 Demo accounts created:")
            print("   🔐 Admin: admin@dermai.com / password123")
            print("   👨‍⚕️ Doctor: doctor@dermai.com / password123")
            print("   📋 Secretary: secretary@dermai.com / password123")

        # Create sample patients for the doctor (always check and create if missing)

        # Check how many patients already exist for this doctor
        existing_patients_count = db.query(Patient).filter(
            Patient.doctor_id == doctor_user.id,
            Patient.is_deleted == False
        ).count()

        if existing_patients_count == 0:
            print("🌱 Creating sample patients...")
            sample_patients = [
                Patient(
                    first_name="Marie",
                    last_name="Dupuis",
                    email="marie.dupuis@email.com",
                    phone="+33612345678",
                    date_of_birth=date(1990, 5, 15),
                    gender="female",
                    address="123 Rue de Paris",
                    city="Paris",
                    postal_code="75001",
                    country="France",
                    identification_type="passport",
                    identification_number="FR123456789",
                    medical_history="Allergic to penicillin",
                    allergies="Penicillin",
                    doctor_id=doctor_user.id,
                    is_deleted=False,
                ),
                Patient(
                    first_name="Jean",
                    last_name="Bernard",
                    email="jean.bernard@email.com",
                    phone="+33687654321",
                    date_of_birth=date(1985, 3, 20),
                    gender="male",
                    address="456 Avenue des Champs",
                    city="Lyon",
                    postal_code="69001",
                    country="France",
                    identification_type="cin",
                    identification_number="FR987654321",
                    medical_history="Diabetic",
                    allergies="Sulfonamides",
                    doctor_id=doctor_user.id,
                    is_deleted=False,
                ),
                Patient(
                    first_name="Sophie",
                    last_name="Laurent",
                    email="sophie.laurent@email.com",
                    phone="+33699999999",
                    date_of_birth=date(1992, 8, 10),
                    gender="female",
                    address="789 Boulevard Saint-Germain",
                    city="Paris",
                    postal_code="75005",
                    country="France",
                    identification_type="passport",
                    identification_number="FR555666777",
                    medical_history="Eczema history",
                    allergies="Latex",
                    doctor_id=doctor_user.id,
                    is_deleted=False,
                ),
            ]

            db.add_all(sample_patients)
            db.commit()

            print(f"✅ Sample patients created successfully! ({len(sample_patients)} patients)")
            print("\n⚠️  IMPORTANT: Change these passwords in production!")
        else:
            print(f"⚠️  Patients already exist for doctor ({existing_patients_count} patients). Skipping patient creation.")

        # Create sample appointments/rendez-vous for the calendar
        existing_appointments_count = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_user.id,
            Appointment.is_deleted == False
        ).count()

        if existing_appointments_count == 0:
            print("📅 Creating sample appointments for calendar...")
            now = datetime.now()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)

            sample_appointments = [
                # Today appointments
                Appointment(
                    patient_id=1,  # Marie
                    doctor_id=doctor_user.id,
                    start_time=today.replace(hour=9, minute=0),
                    end_time=today.replace(hour=9, minute=30),
                    type=AppointmentType.CONSULTATION,
                    status=AppointmentStatus.SCHEDULED,
                    reason="Eruption cutanée au visage",
                    notes="Patient a changé de savon récemment",
                    is_first_visit=False,
                    is_deleted=False,
                ),
                Appointment(
                    patient_id=2,  # Jean
                    doctor_id=doctor_user.id,
                    start_time=today.replace(hour=10, minute=0),
                    end_time=today.replace(hour=10, minute=45),
                    type=AppointmentType.FOLLOW_UP,
                    status=AppointmentStatus.CONFIRMED,
                    reason="Suivi psoriasis chronique",
                    notes="Contrôle du traitement",
                    is_first_visit=False,
                    is_deleted=False,
                ),
                Appointment(
                    patient_id=3,  # Sophie
                    doctor_id=doctor_user.id,
                    start_time=today.replace(hour=14, minute=0),
                    end_time=today.replace(hour=14, minute=30),
                    type=AppointmentType.CONSULTATION,
                    status=AppointmentStatus.SCHEDULED,
                    reason="Acné persistante",
                    notes="Deuxième consultation",
                    is_first_visit=False,
                    is_deleted=False,
                ),
                # Tomorrow appointments
                Appointment(
                    patient_id=1,  # Marie
                    doctor_id=doctor_user.id,
                    start_time=(today + timedelta(days=1)).replace(hour=11, minute=0),
                    end_time=(today + timedelta(days=1)).replace(hour=11, minute=30),
                    type=AppointmentType.PROCEDURE,
                    status=AppointmentStatus.SCHEDULED,
                    reason="Bilan dermatologique complet",
                    notes="Préparation requise",
                    is_first_visit=False,
                    is_deleted=False,
                ),
                # Next week appointments
                Appointment(
                    patient_id=2,  # Jean
                    doctor_id=doctor_user.id,
                    start_time=(today + timedelta(days=3)).replace(hour=9, minute=30),
                    end_time=(today + timedelta(days=3)).replace(hour=10, minute=15),
                    type=AppointmentType.FOLLOW_UP,
                    status=AppointmentStatus.SCHEDULED,
                    reason="Contrôle résultats analyses",
                    notes="Apporter les résultats d'analyse",
                    is_first_visit=False,
                    is_deleted=False,
                ),
                # Past appointments
                Appointment(
                    patient_id=3,  # Sophie
                    doctor_id=doctor_user.id,
                    start_time=(today - timedelta(days=2)).replace(hour=15, minute=0),
                    end_time=(today - timedelta(days=2)).replace(hour=15, minute=30),
                    type=AppointmentType.CONSULTATION,
                    status=AppointmentStatus.COMPLETED,
                    reason="Première consultation acné",
                    notes="Diagnostic établi",
                    is_first_visit=True,
                    is_deleted=False,
                ),
                Appointment(
                    patient_id=1,  # Marie (Emergency-like)
                    doctor_id=doctor_user.id,
                    start_time=(today - timedelta(days=5)).replace(hour=16, minute=0),
                    end_time=(today - timedelta(days=5)).replace(hour=16, minute=30),
                    type=AppointmentType.EMERGENCY,
                    status=AppointmentStatus.COMPLETED,
                    reason="Réaction allergique sévère",
                    diagnosis="Réaction allergique de contact",
                    notes="Traitement d'urgence appliqué",
                    is_first_visit=False,
                    is_deleted=False,
                ),
                # Cancelled appointment
                Appointment(
                    patient_id=2,  # Jean
                    doctor_id=doctor_user.id,
                    start_time=(today + timedelta(days=7)).replace(hour=10, minute=0),
                    end_time=(today + timedelta(days=7)).replace(hour=10, minute=30),
                    type=AppointmentType.PROCEDURE,
                    status=AppointmentStatus.CANCELLED,
                    reason="Biopsie cutanée",
                    notes="Annulée à la demande du patient",
                    is_first_visit=False,
                    is_deleted=False,
                ),
                # In progress (simulated)
                Appointment(
                    patient_id=3,  # Sophie
                    doctor_id=doctor_user.id,
                    start_time=now.replace(minute=0, second=0, microsecond=0) - timedelta(minutes=15),
                    end_time=now.replace(minute=0, second=0, microsecond=0) + timedelta(minutes=30),
                    type=AppointmentType.CONSULTATION,
                    status=AppointmentStatus.IN_PROGRESS,
                    reason="Suivi traitement acné",
                    notes="En cours de consultation",
                    is_first_visit=False,
                    is_deleted=False,
                ),
            ]

            db.add_all(sample_appointments)
            db.commit()
            print(f"✅ Sample appointments created successfully! ({len(sample_appointments)} appointments)")
        else:
            print(f"⚠️  Appointments already exist for doctor ({existing_appointments_count} appointments). Skipping appointment creation.")

        # Create sample consultations for patients
        existing_consultations_count = db.query(Consultation).count()
        if existing_consultations_count == 0:
            print("🏥 Creating sample consultations...")
            sample_consultations = [
                Consultation(
                    patient_id=1,  # Marie
                    doctor_id=doctor_user.id,
                    consultation_date=date.today(),
                    consultation_time=datetime.now(),
                    chief_complaint="Eruption cutanée au visage",
                    symptoms="Rougeurs et démangeaisons",
                    duration_symptoms="1 semaine",
                    clinical_examination="Érythème facial, petites vésicules",
                    dermatological_examination="Dermatite allergique probable",
                    lesion_type="Érythème avec vésicules",
                    lesion_location="Visage (joues, front)",
                    lesion_color="Rouge",
                    diagnosis="Dermatite allergique",
                    differential_diagnosis="Dermatite de contact, Eczéma",
                    treatment_plan="Éviter les allergènes, Crème hydrocortisone",
                    follow_up_required=True,
                    follow_up_date=date.today() + timedelta(days=14),
                    notes="Patient a changé de savon récemment",
                    is_deleted=False,
                ),
                Consultation(
                    patient_id=2,  # Jean
                    doctor_id=doctor_user.id,
                    consultation_date=date.today() - timedelta(days=3),
                    consultation_time=datetime.now() - timedelta(days=3),
                    chief_complaint="Psoriasis chronique",
                    symptoms="Plaques squameuses, démangeaisons",
                    duration_symptoms="6 mois",
                    clinical_examination="Plaques érythémateuses avec écailles",
                    dermatological_examination="Psoriasis en plaques",
                    lesion_type="Plaques érythémateuses",
                    lesion_location="Coudes, genoux",
                    lesion_color="Rouge vif",
                    diagnosis="Psoriasis",
                    treatment_plan="Crème topique, Émollient quotidien",
                    follow_up_required=True,
                    follow_up_date=date.today() + timedelta(days=30),
                    notes="Antécédents familiaux de psoriasis",
                    is_deleted=False,
                ),
                Consultation(
                    patient_id=3,  # Sophie
                    doctor_id=doctor_user.id,
                    consultation_date=date.today() - timedelta(days=7),
                    consultation_time=datetime.now() - timedelta(days=7),
                    chief_complaint="Acné persistante",
                    symptoms="Comédons et pustules",
                    duration_symptoms="3 mois",
                    clinical_examination="Acné modérée, principalement au menton",
                    dermatological_examination="Acné vulgarisa",
                    lesion_type="Comédons ouverts et pustules",
                    lesion_location="Menton, joues",
                    lesion_color="Rouge, jaune (pustules)",
                    diagnosis="Acné vulgarisa",
                    treatment_plan="Nettoyage doux, Rétinoïde topique",
                    follow_up_required=True,
                    follow_up_date=date.today() + timedelta(days=21),
                    notes="Patient adolescent, amélioration avec l'âge probable",
                    is_deleted=False,
                ),
            ]
            db.add_all(sample_consultations)
            db.commit()
            print(f"✅ Sample consultations created successfully! ({len(sample_consultations)} consultations)")

            # Create sample prescriptions for consultations
            print("💊 Creating sample prescriptions...")
            sample_prescriptions = [
                Prescription(
                    consultation_id=1,
                    patient_id=1,
                    doctor_id=doctor_user.id,
                    prescription_date=date.today(),
                    valid_until=date.today() + timedelta(days=30),
                    control_date=date.today() + timedelta(days=14),
                    medications=[
                        {
                            "name": "Crème hydrocortisone 1%",
                            "dosage": "Appliquer 2 fois par jour",
                            "duration": "14 jours",
                            "quantity": "1 tube de 30g",
                            "instructions": "Appliquer sur les zones affectées après le nettoyage",
                        },
                        {
                            "name": "Savon dermatologique doux",
                            "dosage": "Utiliser pour se laver",
                            "duration": "Continu",
                            "quantity": "1 pain",
                            "instructions": "Utiliser 2 fois par jour pour nettoyer en douceur",
                        },
                    ],
                    instructions="Éviter tous les produits contenant les allergènes détectés",
                    notes="Suivi dans 2 semaines",
                    is_printed=False,
                    is_delivered=False,
                    is_deleted=False,
                ),
                Prescription(
                    consultation_id=2,
                    patient_id=2,
                    doctor_id=doctor_user.id,
                    prescription_date=date.today() - timedelta(days=3),
                    valid_until=date.today() + timedelta(days=27),
                    control_date=date.today() + timedelta(days=30),
                    medications=[
                        {
                            "name": "Crème à base de corticostéroïde faible",
                            "dosage": "Appliquer 1 fois par jour",
                            "duration": "3 semaines",
                            "quantity": "1 tube",
                            "instructions": "Appliquer sur les plaques affectées",
                        },
                        {
                            "name": "Émollient riche",
                            "dosage": "Appliquer 2-3 fois par jour",
                            "duration": "Continu",
                            "quantity": "200ml",
                            "instructions": "Hydrater la peau régulièrement",
                        },
                    ],
                    instructions="Éviter stress et facteurs déclenchants connus",
                    notes="Psoriasis chronique, suivi régulier recommandé",
                    is_printed=False,
                    is_delivered=False,
                    is_deleted=False,
                ),
                Prescription(
                    consultation_id=3,
                    patient_id=3,
                    doctor_id=doctor_user.id,
                    prescription_date=date.today() - timedelta(days=7),
                    valid_until=date.today() + timedelta(days=23),
                    control_date=date.today() + timedelta(days=21),
                    medications=[
                        {
                            "name": "Adapalène 0.1% gel",
                            "dosage": "Appliquer 1 fois par jour le soir",
                            "duration": "8-12 semaines",
                            "quantity": "1 tube 30g",
                            "instructions": "Appliquer pois de taille noisette sur peau propre et sèche",
                        },
                        {
                            "name": "Nettoyant doux sans savon",
                            "dosage": "Utiliser 2 fois par jour",
                            "duration": "Continu",
                            "quantity": "150ml",
                            "instructions": "Nettoyer le visage le matin et le soir",
                        },
                        {
                            "name": "Écran solaire SPF 30",
                            "dosage": "Appliquer quotidiennement",
                            "duration": "Continu",
                            "quantity": "50ml",
                            "instructions": "Obligatoire avec le traitement au rétinoïde",
                        },
                    ],
                    instructions="Éviter l'exposition excessive au soleil, Patient peut ressentir une sécheresse initialement",
                    notes="Acné juvénile, amélioration attendue en 6-8 semaines",
                    is_printed=False,
                    is_delivered=False,
                    is_deleted=False,
                ),
            ]
            db.add_all(sample_prescriptions)
            db.commit()
            print(f"✅ Sample prescriptions created successfully! ({len(sample_prescriptions)} prescriptions)")
        else:
            print(f"⚠️  Consultations already exist ({existing_consultations_count} consultations). Skipping consultation creation.")

    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("🚀 DermAI Database Initialization")
    print("=" * 50)

    create_tables()
    seed_data()

    print("\n" + "=" * 50)
    print("✅ Database initialization complete!")
    print("=" * 50)
