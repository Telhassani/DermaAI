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
from app.models.consultation import Consultation
from app.models.prescription import Prescription

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
        return db.query(Appointment).all()

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


def create_test_consultations(db: Session, doctor: User, patients: list, appointments: list):
    """Create test consultations"""
    print("Creating test consultations...")

    # Check if consultations already exist
    existing = db.query(Consultation).first()
    if existing:
        print("  Test consultations already exist, skipping...")
        return db.query(Consultation).all()

    consultations_data = [
        {
            # Consultation 1: Alice Johnson - Dermatite de contact (linked to completed appointment)
            "patient_id": patients[0].id,
            "doctor_id": doctor.id,
            "appointment_id": appointments[3].id if len(appointments) > 3 else None,  # Link to completed appointment
            "consultation_date": datetime(2025, 11, 7).date(),
            "consultation_time": datetime(2025, 11, 7, 10, 0),
            "chief_complaint": "Éruption cutanée sur le bras droit",
            "symptoms": "Rougeur, démangeaisons, petites vésicules",
            "duration_symptoms": "3 jours",
            "clinical_examination": "Lésions érythémateuses vésiculeuses localisées sur l'avant-bras droit",
            "dermatological_examination": "Dermite de contact aiguë",
            "lesion_type": "Vésicules et érythème",
            "lesion_location": "Avant-bras droit",
            "lesion_size": "Zone de 5x3 cm",
            "lesion_color": "Rouge vif",
            "lesion_texture": "Vésiculeuse",
            "diagnosis": "Dermatite de contact allergique",
            "treatment_plan": "Corticothérapie topique, éviction de l'allergène",
            "follow_up_required": True,
            "follow_up_date": datetime(2025, 11, 21).date(),
            "notes": "Patient suspecte contact avec produit de nettoyage",
            "private_notes": "Envisager tests allergiques si récidive",
        },
        {
            # Consultation 2: Marc Dubois - Acné vulgaire
            "patient_id": patients[1].id,
            "doctor_id": doctor.id,
            "appointment_id": None,
            "consultation_date": datetime(2025, 10, 15).date(),
            "consultation_time": datetime(2025, 10, 15, 14, 30),
            "chief_complaint": "Acné persistante depuis plusieurs mois",
            "symptoms": "Points noirs, papules et pustules sur le visage",
            "duration_symptoms": "6 mois",
            "clinical_examination": "Lésions acnéiques grade II sur le visage",
            "dermatological_examination": "Comédons ouverts et fermés, papulo-pustules",
            "lesion_type": "Comédons, papules, pustules",
            "lesion_location": "Visage (front, joues, menton)",
            "lesion_size": "Multiple, 2-5mm",
            "lesion_color": "Rouge pour les papules",
            "lesion_texture": "Inflammatoire",
            "diagnosis": "Acné vulgaire grade II",
            "treatment_plan": "Peroxyde de benzoyle 5%, rétinoïde topique le soir",
            "follow_up_required": True,
            "follow_up_date": datetime(2025, 12, 15).date(),
            "notes": "Conseil: nettoyage doux matin et soir",
            "private_notes": "Si pas d'amélioration à 3 mois: envisager antibiotique oral",
        },
        {
            # Consultation 3: Sophie Martin - Psoriasis en plaques
            "patient_id": patients[2].id,
            "doctor_id": doctor.id,
            "appointment_id": None,
            "consultation_date": datetime(2025, 9, 20).date(),
            "consultation_time": datetime(2025, 9, 20, 11, 0),
            "chief_complaint": "Plaques squameuses sur les coudes et genoux",
            "symptoms": "Plaques rouges avec desquamation, démangeaisons modérées",
            "duration_symptoms": "Plusieurs années (poussée actuelle: 2 mois)",
            "clinical_examination": "Plaques psoriasiques typiques aux zones d'extension",
            "dermatological_examination": "Psoriasis en plaques bien délimité",
            "lesion_type": "Plaques érythémato-squameuses",
            "lesion_location": "Coudes, genoux, cuir chevelu",
            "lesion_size": "Plaques de 3-8 cm de diamètre",
            "lesion_color": "Rouge saumon",
            "lesion_texture": "Squames argentées bien adhérentes",
            "diagnosis": "Psoriasis en plaques (forme légère à modérée)",
            "treatment_plan": "Dermocorticoïdes classe forte + analogues vitamine D",
            "follow_up_required": True,
            "follow_up_date": datetime(2025, 11, 20).date(),
            "notes": "Expliquer chronicité de la maladie et facteurs déclenchants",
            "private_notes": "Si échec: envisager photothérapie UVB",
        },
        {
            # Consultation 4: Alice Johnson - Contrôle dermatologique annuel
            "patient_id": patients[0].id,
            "doctor_id": doctor.id,
            "appointment_id": None,
            "consultation_date": datetime(2025, 8, 10).date(),
            "consultation_time": datetime(2025, 8, 10, 9, 30),
            "chief_complaint": "Contrôle dermatologique annuel",
            "symptoms": "Aucun symptôme particulier",
            "duration_symptoms": "N/A",
            "clinical_examination": "Examen cutané complet sans anomalie significative",
            "dermatological_examination": "Quelques nevi bénins stables",
            "lesion_type": "N/A",
            "lesion_location": "N/A",
            "lesion_size": "N/A",
            "lesion_color": "N/A",
            "lesion_texture": "N/A",
            "diagnosis": "Examen dermatologique normal",
            "treatment_plan": "Surveillance annuelle, protection solaire",
            "follow_up_required": True,
            "follow_up_date": datetime(2026, 8, 10).date(),
            "notes": "Conseils de photoprotection donnés",
            "private_notes": "RAS",
        },
        {
            # Consultation 5: Marc Dubois - Eczéma atopique
            "patient_id": patients[1].id,
            "doctor_id": doctor.id,
            "appointment_id": None,
            "consultation_date": datetime(2025, 7, 5).date(),
            "consultation_time": datetime(2025, 7, 5, 15, 0),
            "chief_complaint": "Poussée d'eczéma aux plis des coudes",
            "symptoms": "Démangeaisons intenses, peau sèche et fissurée",
            "duration_symptoms": "10 jours",
            "clinical_examination": "Lésions eczématiformes des plis des coudes",
            "dermatological_examination": "Eczéma atopique en poussée",
            "lesion_type": "Plaques érythémateuses avec lichénification",
            "lesion_location": "Plis des coudes bilatéralement",
            "lesion_size": "5x4 cm chaque côté",
            "lesion_color": "Rouge violacé",
            "lesion_texture": "Lichénifiée avec excoriations",
            "diagnosis": "Dermatite atopique (poussée)",
            "treatment_plan": "Dermocorticoïdes classe II + émollients 2x/jour",
            "follow_up_required": True,
            "follow_up_date": datetime(2025, 8, 5).date(),
            "notes": "Éviter savons irritants, privilégier syndet",
            "private_notes": "Antécédents familiaux d'atopie",
        },
    ]

    consultations = []
    for data in consultations_data:
        consultation = Consultation(**data)
        db.add(consultation)
        consultations.append(consultation)

    db.commit()

    for consultation in consultations:
        db.refresh(consultation)
        print(f"  Created consultation: {consultation.diagnosis} - Patient {consultation.patient_id}")

    return consultations


def create_test_prescriptions(db: Session, doctor: User, patients: list, consultations: list):
    """Create test prescriptions"""
    print("Creating test prescriptions...")

    # Check if prescriptions already exist
    existing = db.query(Prescription).first()
    if existing:
        print("  Test prescriptions already exist, skipping...")
        return db.query(Prescription).all()

    prescriptions_data = [
        {
            # Prescription 1: For consultation 1 (Dermatite de contact)
            "consultation_id": consultations[0].id,
            "patient_id": patients[0].id,
            "doctor_id": doctor.id,
            "prescription_date": datetime(2025, 11, 7).date(),
            "valid_until": datetime(2025, 12, 7).date(),
            "medications": [
                {
                    "name": "Diprosone 0.05% crème",
                    "dosage": "Application 2 fois par jour",
                    "duration": "7 jours puis 1 fois/jour pendant 7 jours",
                    "quantity": "1 tube de 30g",
                    "instructions": "Appliquer en couche mince sur les lésions",
                },
                {
                    "name": "Cétirizine 10mg",
                    "dosage": "1 comprimé le soir",
                    "duration": "10 jours",
                    "quantity": "10 comprimés",
                    "instructions": "En cas de démangeaisons importantes",
                },
            ],
            "instructions": "Éviter tout contact avec les produits de nettoyage. Porter des gants si nécessaire.",
            "notes": "Consulter si aggravation ou pas d'amélioration sous 5 jours",
        },
        {
            # Prescription 2: For consultation 2 (Acné)
            "consultation_id": consultations[1].id,
            "patient_id": patients[1].id,
            "doctor_id": doctor.id,
            "prescription_date": datetime(2025, 10, 15).date(),
            "valid_until": datetime(2026, 1, 15).date(),
            "medications": [
                {
                    "name": "Peroxyde de benzoyle 5% gel",
                    "dosage": "Application le matin",
                    "duration": "3 mois",
                    "quantity": "1 tube de 40g",
                    "instructions": "Appliquer après nettoyage doux du visage",
                },
                {
                    "name": "Adapalène 0.1% gel",
                    "dosage": "Application le soir",
                    "duration": "3 mois",
                    "quantity": "1 tube de 30g",
                    "instructions": "Appliquer en évitant le contour des yeux et lèvres",
                },
                {
                    "name": "Nettoyant doux visage",
                    "dosage": "2 fois par jour",
                    "duration": "Usage continu",
                    "quantity": "1 flacon de 200ml",
                    "instructions": "Nettoyer matin et soir sans frotter",
                },
            ],
            "instructions": "Traitement sur 3 mois minimum. Appliquer protection solaire SPF 30+ le matin. Éviter exposition solaire excessive.",
            "notes": "Rendez-vous de contrôle dans 2 mois",
        },
        {
            # Prescription 3: For consultation 3 (Psoriasis)
            "consultation_id": consultations[2].id,
            "patient_id": patients[2].id,
            "doctor_id": doctor.id,
            "prescription_date": datetime(2025, 9, 20).date(),
            "valid_until": datetime(2025, 12, 20).date(),
            "medications": [
                {
                    "name": "Bétaméthasone 0.05% pommade",
                    "dosage": "Application 2 fois/jour",
                    "duration": "3 semaines puis dégressif",
                    "quantity": "2 tubes de 30g",
                    "instructions": "Appliquer sur les plaques psoriasiques",
                },
                {
                    "name": "Calcipotriol 50μg/g pommade",
                    "dosage": "Application 2 fois/jour",
                    "duration": "En relais après corticoïdes",
                    "quantity": "2 tubes de 30g",
                    "instructions": "Continuer en traitement d'entretien",
                },
                {
                    "name": "Émollient corps",
                    "dosage": "Application quotidienne généreuse",
                    "duration": "Usage continu",
                    "quantity": "2 flacons de 400ml",
                    "instructions": "Appliquer sur l'ensemble du corps après la douche",
                },
            ],
            "instructions": "Douches tièdes courtes. Éviter traumatismes cutanés. Réduire stress si possible.",
            "notes": "Renouvellement possible. Contrôle dans 2 mois",
        },
        # Prescription 4: Pas de prescription pour consultation 4 (contrôle normal) - on skip
        {
            # Prescription 5: For consultation 5 (Eczéma)
            "consultation_id": consultations[4].id,
            "patient_id": patients[1].id,
            "doctor_id": doctor.id,
            "prescription_date": datetime(2025, 7, 5).date(),
            "valid_until": datetime(2025, 10, 5).date(),
            "medications": [
                {
                    "name": "Desonide 0.05% crème",
                    "dosage": "Application 2 fois/jour sur lésions",
                    "duration": "14 jours",
                    "quantity": "1 tube de 30g",
                    "instructions": "Appliquer uniquement sur les zones eczémateuses",
                },
                {
                    "name": "Cérat de Galien",
                    "dosage": "Application généreuse 3 fois/jour minimum",
                    "duration": "Usage continu",
                    "quantity": "2 pots de 200g",
                    "instructions": "Émollient à utiliser quotidiennement même hors poussée",
                },
                {
                    "name": "Syndet sans savon",
                    "dosage": "À chaque douche",
                    "duration": "Usage continu",
                    "quantity": "1 flacon de 400ml",
                    "instructions": "Remplace le savon classique",
                },
            ],
            "instructions": "Douches tièdes et courtes. Sécher en tamponnant sans frotter. Appliquer émollient immédiatement après séchage.",
            "notes": "Contrôle dans 1 mois. Si pas d'amélioration: envisager anti-histaminique oral",
        },
    ]

    prescriptions = []
    for data in prescriptions_data:
        prescription = Prescription(**data)
        db.add(prescription)
        prescriptions.append(prescription)

    db.commit()

    for prescription in prescriptions:
        db.refresh(prescription)
        print(f"  Created prescription: {len(prescription.medications)} medications - Patient {prescription.patient_id}")

    return prescriptions


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
        consultations = create_test_consultations(db, doctor, patients, appointments)
        prescriptions = create_test_prescriptions(db, doctor, patients, consultations)

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
        print(f"  - {len(consultations)} consultations")
        print(f"  - {len(prescriptions)} prescriptions")
        print("\n")

    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
