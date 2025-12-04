import requests
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login"
ME_URL = f"{BASE_URL}/auth/me"

# Default credentials
USERNAME = "doctor@dermai.com"
PASSWORD = "Doctor123!"

def test_auth_flow():
    print(f"Testing auth flow against {BASE_URL}...")
    
    # 1. Login
    print(f"\n[1] Attempting login with {USERNAME}...")
    session = requests.Session()
    try:
        response = session.post(
            LOGIN_URL,
            data={"username": USERNAME, "password": PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to backend. Is it running on port 8000?")
        sys.exit(1)

    if response.status_code != 200:
        print(f"Login failed: {response.status_code} - {response.text}")
        sys.exit(1)
    
    print("Login successful!")
    data = response.json()
    access_token = data.get("access_token")
    
    if not access_token:
        print("Error: No access_token in response body")
    else:
        print("Access token received in body.")

    # Check cookies
    cookies = session.cookies.get_dict()
    if "access_token" in cookies:
        print("Access token cookie set.")
    else:
        print("Warning: access_token cookie NOT set.")

    # 2. Test /me with Header
    print(f"\n[2] Testing /me with Authorization Header...")
    header_response = requests.get(
        ME_URL,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    if header_response.status_code == 200:
        print("Success: /me worked with Header.")
        print(f"User: {header_response.json().get('email')}")
    else:
        print(f"Failure: /me failed with Header: {header_response.status_code} - {header_response.text}")

    # 3. Test /me with Cookie (no header)
    print(f"\n[3] Testing /me with Cookie (no header)...")
    # Create a new session to ensure no headers leak, but keep cookies
    cookie_session = requests.Session()
    cookie_session.cookies.update(session.cookies)
    
    cookie_response = cookie_session.get(ME_URL)
    
    if cookie_response.status_code == 200:
        print("Success: /me worked with Cookie.")
        print(f"User: {cookie_response.json().get('email')}")
    else:
        print(f"Failure: /me failed with Cookie: {cookie_response.status_code} - {cookie_response.text}")

if __name__ == "__main__":
    test_auth_flow()
