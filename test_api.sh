#!/bin/bash

# Generate a demo JWT token like the frontend does
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjogMSwgImVtYWlsIjogImRvY3RvckBkZXJtYWkuY29tIiwgInJvbGUiOiAiZG9jdG9yIn0.test"

echo "Testing API endpoints..."
echo ""
echo "=== Testing /api/v1/patients ==="
curl -s -X GET "http://localhost:8001/api/v1/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -c 500

echo ""
echo ""
echo "=== Testing /api/v1/consultations ==="
curl -s -X GET "http://localhost:8001/api/v1/consultations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -c 500

echo ""
echo ""
echo "=== Testing /api/v1/prescriptions ==="
curl -s -X GET "http://localhost:8001/api/v1/prescriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -c 500

echo ""
echo ""
echo "=== Testing /api/v1/appointments ==="
curl -s -X GET "http://localhost:8001/api/v1/appointments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -c 500

echo ""
