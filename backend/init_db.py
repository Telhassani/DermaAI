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
    """Seed initial data (admin user, etc.)"""
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

        print("✅ Seed data created successfully!")
        print("\n📝 Demo accounts created:")
        print("   🔐 Admin: admin@dermai.com / Admin123!")
        print("   👨‍⚕️ Doctor: doctor@dermai.com / Doctor123!")
        print("   📋 Secretary: secretary@dermai.com / Secretary123!")
        print("\n⚠️  IMPORTANT: Change these passwords in production!")

    except Exception as e:
        print(f"❌ Error seeding data: {e}")
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
