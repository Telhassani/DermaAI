"""
Initialize database - Create tables and seed data
Run this script to set up the database for the first time
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.db.base import Base
from app.db.session import engine
from app.models import User, Patient, Appointment
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
        if existing_admin:
            print("⚠️  Admin user already exists. Skipping seed.")
            return

        # Create admin user
        admin_user = User(
            email="admin@dermai.com",
            hashed_password=get_password_hash("Admin123!"),  # Change in production!
            full_name="DermAI Admin",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            phone="+33123456789",
        )

        # Create demo doctor
        doctor_user = User(
            email="doctor@dermai.com",
            hashed_password=get_password_hash("Doctor123!"),  # Change in production!
            full_name="Dr. Jean Dupont",
            role=UserRole.DOCTOR,
            is_active=True,
            is_verified=True,
            phone="+33987654321",
        )

        # Create demo secretary
        secretary_user = User(
            email="secretary@dermai.com",
            hashed_password=get_password_hash("Secretary123!"),  # Change in production!
            full_name="Marie Martin",
            role=UserRole.SECRETARY,
            is_active=True,
            is_verified=True,
            phone="+33555123456",
        )

        db.add(admin_user)
        db.add(doctor_user)
        db.add(secretary_user)
        db.commit()

        print("✅ Users created successfully!")
        print("\n📝 Demo accounts created:")
        print("   🔐 Admin: admin@dermai.com / Admin123!")
        print("   👨‍⚕️ Doctor: doctor@dermai.com / Doctor123!")
        print("   📋 Secretary: secretary@dermai.com / Secretary123!")

        # Create sample patients for the doctor
        from datetime import date
        sample_patients = [
            Patient(
                first_name="Marie",
                last_name="Dupuis",
                email="marie.dupuis@email.com",
                phone="+33612345678",
                date_of_birth=date(1990, 5, 15),
                gender="F",
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
                gender="M",
                address="456 Avenue des Champs",
                city="Lyon",
                postal_code="69001",
                country="France",
                identification_type="id_card",
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
                gender="F",
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
