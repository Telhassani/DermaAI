import requests
import sys

# Configuration
API_URL = "http://localhost:8000/api/v1"
USERNAME = "admin@dermaai.com"
PASSWORD = "adminpassword"

def get_access_token():
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            data={"username": USERNAME, "password": PASSWORD}
        )
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"Error logging in: {e}")
        sys.exit(1)

def test_get_consultation_images(token, consultation_id):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        print(f"Fetching images for consultation {consultation_id}...")
        response = requests.get(
            f"{API_URL}/images/consultation/{consultation_id}",
            headers=headers
        )
        if response.status_code == 500:
            print("Reproduced 500 Error!")
            print("Response:", response.text)
        else:
            print(f"Status Code: {response.status_code}")
            # print("Response:", response.json()) # Commented out to avoid spamming logs
    except Exception as e:
        print(f"Error fetching images: {e}")

if __name__ == "__main__":
    token = get_access_token()
    # Try with a consultation ID that likely exists or was used in the screenshot
    # The screenshot shows "Fetching statistics for patientId: 2"
    # I'll try consultation ID 1, 2, etc.
    test_get_consultation_images(token, 1)
    test_get_consultation_images(token, 2)
