import sys
import os
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import verify_password

def debug_login():
    print("Starting debug_login...")
    db = SessionLocal()
    try:
        email = "doctor@dermai.com"
        password = "Doctor123!"
        
        print(f"Querying user {email}...")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print("User not found!")
            return
            
        print(f"User found: {user.id}")
        
        print("Verifying password...")
        if verify_password(password, user.hashed_password):
            print("Password verified!")
        else:
            print("Invalid password!")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()
        print("Done.")

if __name__ == "__main__":
    debug_login()
