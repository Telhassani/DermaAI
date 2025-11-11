#!/usr/bin/env python3
"""Test patient creation"""

import requests
import json

# First get token
print("Getting authentication token...")
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    data={
        "username": "doctor@dermai.com",
        "password": "Doctor123!"
    }
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print(f"✓ Got token")

# Now create patient
print("\nCreating patient...")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

patient_data = {
    "identification_type": "cin",
    "identification_number": "TEST12345",
    "first_name": "Test",
    "last_name": "Patient",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "phone": "1234567890"
}

response = requests.post(
    "http://localhost:8000/api/v1/patients",
    json=patient_data,
    headers=headers
)

print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200:
    print("\n✅ Patient created successfully!")
else:
    print(f"\n❌ Failed to create patient")
