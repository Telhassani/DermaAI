"""
Check Supabase database schema to understand the setup
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

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

# Create database engine
engine = create_engine(DATABASE_URL)

print(f"\n📋 Checking database schema...")

with engine.connect() as conn:
    # Check if auth.users table exists
    print("\n1️⃣ Checking auth.users (Supabase auth table):")
    try:
        result = conn.execute(
            text("SELECT id, email FROM auth.users WHERE email = :email LIMIT 1"),
            {"email": ADMIN_EMAIL}
        )
        user = result.fetchone()
        if user:
            print(f"   ✅ Found in auth.users:")
            print(f"      ID: {user[0]}")
            print(f"      Email: {user[1]}")
        else:
            print(f"   ❌ NOT found in auth.users")
    except Exception as e:
        print(f"   ❌ Error accessing auth.users: {e}")

    # Check profiles table structure
    print("\n2️⃣ Checking profiles table structure:")
    try:
        result = conn.execute(
            text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'profiles' AND table_schema = 'public'
                ORDER BY ordinal_position
            """)
        )
        columns = result.fetchall()
        for col in columns:
            print(f"   - {col[0]}: {col[1]} (nullable: {col[2]})")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # Check foreign key constraints
    print("\n3️⃣ Checking foreign key constraints on profiles:")
    try:
        result = conn.execute(
            text("""
                SELECT
                    tc.constraint_name,
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_schema AS foreign_table_schema,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_name = 'profiles'
            """)
        )
        fks = result.fetchall()
        for fk in fks:
            print(f"   - {fk[0]}: {fk[1]}.{fk[2]} -> {fk[3]}.{fk[4]}.{fk[5]}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # Check if profile exists
    print(f"\n4️⃣ Checking if profile exists for {ADMIN_EMAIL}:")
    try:
        result = conn.execute(
            text("SELECT id, email, role FROM profiles WHERE email = :email"),
            {"email": ADMIN_EMAIL}
        )
        profile = result.fetchone()
        if profile:
            print(f"   ✅ Profile exists:")
            print(f"      ID: {profile[0]}")
            print(f"      Email: {profile[1]}")
            print(f"      Role: {profile[2]}")
        else:
            print(f"   ❌ Profile does NOT exist")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # List all profiles
    print(f"\n5️⃣ Listing all existing profiles:")
    try:
        result = conn.execute(
            text("SELECT id, email, role FROM profiles LIMIT 10")
        )
        profiles = result.fetchall()
        if profiles:
            for p in profiles:
                print(f"   - {p[0]} | {p[1]} | {p[2]}")
        else:
            print(f"   (No profiles found)")
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n✅ Schema check complete!")
