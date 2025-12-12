#!/usr/bin/env python3
"""Test authentication and lab-conversations access"""
import requests
import json

# Test backend health
print("=== Testing Backend ===")
response = requests.get("http://localhost:8000/health")
print(f"Backend health: {response.json()}")

# Note: We can't test Supabase login from Python easily
# The user needs to test in browser
print("\n=== Manual Test Required ===")
print("Please test in browser:")
print("1. Go to http://localhost:3000/login")
print("2. Login with admin@dermai.com / Admin123!")
print("3. Check if dashboard loads")
print("4. Go to http://localhost:3000/dashboard/lab-conversations")
print("5. Verify no 403 errors")

# Test if lab-conversations endpoint is accessible (will fail without auth)
print("\n=== Testing Lab-Conversations Endpoint ===")
try:
    response = requests.get("http://localhost:8000/api/v1/lab-conversations/conversations")
    print(f"Status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Endpoint requires authentication (expected)")
    elif response.status_code == 403:
        print("❌ 403 Forbidden - role issue")
    else:
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
