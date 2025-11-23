import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def login(username, password):
    print(f"Trying login with {username}...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": username, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            print("Login successful!")
            return response.json()["access_token"]
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def check_conflicts(token):
    print("Checking conflicts...")
    headers = {"Authorization": f"Bearer {token}"}
    # Use data from the failed drag attempt (approximate)
    data = {
        "doctor_id": 1, # Assuming doctor ID 1
        "start_time": "2025-11-26T10:00:00.000Z",
        "end_time": "2025-11-26T10:30:00.000Z",
        "exclude_appointment_id": 1 # Assuming ID 1
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/appointments/check-conflicts",
            json=data,
            headers=headers,
            timeout=10 # Short timeout to detect hang
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except requests.exceptions.Timeout:
        print("Request timed out!")
    except Exception as e:
        print(f"Request error: {e}")

def register(email, password, role="doctor"):
    print(f"Registering {email}...")
    data = {
        "email": email,
        "password": password,
        "full_name": "Debug User",
        "role": role,
        "phone": "1234567890"
    }
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 201:
            print("Registration successful!")
            return True
        elif response.status_code == 400 and "Email already registered" in response.text:
            print("User already exists.")
            return True
        else:
            print(f"Registration failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Registration error: {e}")
        return False

# Register first
register("debug@example.com", "Password123!")
token = login("debug@example.com", "Password123!")

if token:
    check_conflicts(token)
else:
    print("Could not get token.")
