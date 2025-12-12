"""
Script to create an admin user in Supabase
This creates a user in both auth.users and profiles tables
"""

import os
import sys
import requests
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env file")
    sys.exit(1)

def create_admin_user(email: str, password: str, full_name: str):
    """Create an admin user using Supabase Admin API"""

    print(f"\n🔧 Creating admin user: {email}")
    print("=" * 60)

    # Step 1: Create user in Supabase Auth
    print("\n1️⃣ Creating user in auth.users...")

    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,  # Auto-confirm email
        "user_metadata": {
            "full_name": full_name,
        }
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200 or response.status_code == 201:
        user_data = response.json()
        user_id = user_data.get("id")
        print(f"   ✅ User created in auth.users")
        print(f"   📝 User ID: {user_id}")
        print(f"   📧 Email: {email}")

        # Step 2: Wait for trigger to create profile
        print("\n2️⃣ Waiting for database trigger to create profile...")
        time.sleep(1)

        # Step 3: Check if profile exists
        print("\n3️⃣ Checking if profile was created...")

        # Use Supabase REST API to check profile
        profile_url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
        profile_headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        }

        profile_response = requests.get(profile_url, headers=profile_headers)

        if profile_response.status_code == 200:
            profiles = profile_response.json()
            if profiles and len(profiles) > 0:
                print(f"   ✅ Profile found in profiles table")
                print(f"   📝 Profile role: {profiles[0].get('role')}")

                # Step 4: Update profile to ADMIN role
                print("\n4️⃣ Updating profile to ADMIN role...")

                update_url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
                update_headers = {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                }

                update_payload = {
                    "role": "ADMIN",
                    "full_name": full_name,
                }

                update_response = requests.patch(update_url, json=update_payload, headers=update_headers)

                if update_response.status_code == 200:
                    updated_profile = update_response.json()
                    print(f"   ✅ Profile updated successfully")
                    print(f"   📝 Role: {updated_profile[0].get('role')}")
                    print(f"   📝 Full Name: {updated_profile[0].get('full_name')}")

                    print("\n" + "=" * 60)
                    print("✅ SUCCESS! Admin user created successfully")
                    print("=" * 60)
                    print(f"\n📋 Login Credentials:")
                    print(f"   Email:    {email}")
                    print(f"   Password: {password}")
                    print(f"\n🌐 Login URL: http://localhost:3000/login")
                    print("\n")
                    return True
                else:
                    print(f"   ❌ Failed to update profile: {update_response.text}")
                    return False
            else:
                print(f"   ⚠️  Profile not found. Creating manually...")

                # Create profile manually
                create_profile_url = f"{SUPABASE_URL}/rest/v1/profiles"
                create_profile_headers = {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                }

                create_profile_payload = {
                    "id": user_id,
                    "email": email,
                    "full_name": full_name,
                    "role": "ADMIN",
                }

                create_profile_response = requests.post(
                    create_profile_url,
                    json=create_profile_payload,
                    headers=create_profile_headers
                )

                if create_profile_response.status_code in [200, 201]:
                    print(f"   ✅ Profile created manually")
                    print("\n" + "=" * 60)
                    print("✅ SUCCESS! Admin user created successfully")
                    print("=" * 60)
                    print(f"\n📋 Login Credentials:")
                    print(f"   Email:    {email}")
                    print(f"   Password: {password}")
                    print(f"\n🌐 Login URL: http://localhost:3000/login")
                    print("\n")
                    return True
                else:
                    print(f"   ❌ Failed to create profile: {create_profile_response.text}")
                    return False
        else:
            print(f"   ❌ Failed to check profile: {profile_response.text}")
            return False

    else:
        error_data = response.json()
        error_msg = error_data.get("msg", error_data.get("message", "Unknown error"))
        print(f"   ❌ Failed to create user: {error_msg}")

        # Check if user already exists
        if "already been registered" in error_msg or "User already registered" in error_msg:
            print(f"\n⚠️  User {email} already exists!")
            print("   You can try to log in with this email, or use a different email.")

        return False


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🔐 DermAI - Create Admin User Script")
    print("=" * 60)

    # Default admin credentials
    email = "admin@dermai.com"
    password = "Admin123!"
    full_name = "Administrateur DermAI"

    # Allow custom input
    print(f"\nDefault credentials:")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
    print(f"  Full Name: {full_name}")

    use_custom = input("\nUse custom credentials? (y/N): ").lower().strip()

    if use_custom == 'y':
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        full_name = input("Full Name: ").strip()

    # Create the admin user
    success = create_admin_user(email, password, full_name)

    if success:
        sys.exit(0)
    else:
        sys.exit(1)
