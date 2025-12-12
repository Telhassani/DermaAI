"""
Get a fresh Supabase token for the admin user
"""
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL:
    print("❌ SUPABASE_URL not found in .env")
    sys.exit(1)

# Supabase anon key from frontend .env.local
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ2htdWFleHVqZmhhZGt0bGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTYwNTMsImV4cCI6MjA4MDY5MjA1M30.2af2Hot2Wh4yYuMvsFXeO_PLiHPAsWhjDGFCAtExUxk"

EMAIL = "admin@dermai.com"
PASSWORD = "Admin123!"

print(f"🔑 Getting fresh token for {EMAIL}...")
print(f"🌐 Supabase URL: {SUPABASE_URL}")

# Sign in with Supabase Auth API
url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
headers = {
    "apikey": ANON_KEY,
    "Content-Type": "application/json"
}
payload = {
    "email": EMAIL,
    "password": PASSWORD
}

try:
    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        data = response.json()
        access_token = data.get("access_token")
        user_id = data.get("user", {}).get("id")

        print(f"\n✅ Successfully authenticated!")
        print(f"\n📋 User Details:")
        print(f"   UUID: {user_id}")
        print(f"   Email: {EMAIL}")
        print(f"\n🔑 Access Token (first 50 chars):")
        print(f"   {access_token[:50]}...")
        print(f"\n💾 Full token saved to token.txt")

        # Save full token to file
        with open("token.txt", "w") as f:
            f.write(access_token)

        print(f"\n✅ Test the token with:")
        print(f'   curl -H "Authorization: Bearer $(cat token.txt)" http://localhost:8000/api/v1/auth/me')

    else:
        print(f"\n❌ Authentication failed!")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    print(f"\n💡 Note: You may need to get the SUPABASE_ANON_KEY from your Supabase dashboard")
    print(f"   Go to: {SUPABASE_URL}/project/settings/api")
