import sys
import os
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def reset_password():
    print("Starting password reset...")
    db = SessionLocal()
    try:
        email = "doctor@dermai.com"
        new_password = "Doctor123!"
        
        print(f"Querying user {email}...")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print("User not found!")
            return
            
        print(f"User found: {user.id}")
        
        print("Hashing new password...")
        user.hashed_password = get_password_hash(new_password)
        
        db.commit()
        print("Password updated successfully!")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()
        print("Done.")

if __name__ == "__main__":
    reset_password()
