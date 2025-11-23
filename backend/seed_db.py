import os
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def seed_db():
    # Create tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        email = "doctor@dermai.com"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Creating user {email}...")
            user = User(
                email=email,
                hashed_password=get_password_hash("Doctor123!"),
                full_name="Dr. Derma",
                role=UserRole.DOCTOR,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            print("User created successfully.")
        else:
            print(f"User {email} already exists.")
    except Exception as e:
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
