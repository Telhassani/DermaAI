#!/bin/bash

API_URL="http://localhost:8000/api/v1"
USERNAME="admin@dermaai.com"
PASSWORD="adminpassword"

# Get Access Token
TOKEN=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${USERNAME}&password=${PASSWORD}" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Error: Failed to get access token"
  exit 1
fi

echo "Got Access Token: ${TOKEN:0:10}..."

# Test Consultation 1
echo "Fetching images for consultation 1..."
curl -v "${API_URL}/images/consultation/1" \
  -H "Authorization: Bearer ${TOKEN}"

# Test Consultation 2
echo "Fetching images for consultation 2..."
curl -v "${API_URL}/images/consultation/2" \
  -H "Authorization: Bearer ${TOKEN}"
