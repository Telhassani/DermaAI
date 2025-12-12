"""
Quick script to create missing profile for admin user
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from uuid import UUID

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in environment")
    sys.exit(1)

print(f"✅ Using database: {DATABASE_URL[:50]}...")

# Admin user details from Supabase token
ADMIN_UUID = "39039de5-bd17-4dc9-a13e-3c66131ec327"
ADMIN_EMAIL = "admin@dermai.com"
ADMIN_NAME = "Administrateur DermAI"
ADMIN_ROLE = "ADMIN"

# Create database engine
engine = create_engine(DATABASE_URL)

print(f"\n🔍 Checking if profile exists for UUID: {ADMIN_UUID}")

with engine.connect() as conn:
    # Check if profile exists
    result = conn.execute(
        text("SELECT id, email, role FROM profiles WHERE id = :uuid"),
        {"uuid": ADMIN_UUID}
    )
    existing = result.fetchone()

    if existing:
        print(f"✅ Profile already exists:")
        print(f"   ID: {existing[0]}")
        print(f"   Email: {existing[1]}")
        print(f"   Role: {existing[2]}")
        sys.exit(0)

    print("❌ Profile does not exist. Creating...")

    # Insert profile
    conn.execute(
        text("""
            INSERT INTO profiles (id, email, full_name, role, is_active, is_verified)
            VALUES (:id, :email, :full_name, :role, true, true)
        """),
        {
            "id": ADMIN_UUID,
            "email": ADMIN_EMAIL,
            "full_name": ADMIN_NAME,
            "role": ADMIN_ROLE
        }
    )
    conn.commit()

    print(f"✅ Profile created successfully!")
    print(f"   UUID: {ADMIN_UUID}")
    print(f"   Email: {ADMIN_EMAIL}")
    print(f"   Name: {ADMIN_NAME}")
    print(f"   Role: {ADMIN_ROLE}")
    print(f"\n🎉 Admin user can now log in!")
