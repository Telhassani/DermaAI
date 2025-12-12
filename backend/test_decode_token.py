"""
Test decoding the Supabase token to diagnose the issue
"""
import sys
from jose import jwt, JWTError

# Read token from file
with open("token.txt", "r") as f:
    token = f.read().strip()

print(f"Token (first 100 chars): {token[:100]}...")
print()

# Test 1: Get unverified claims
print("=" * 60)
print("TEST 1: Get unverified claims")
print("=" * 60)
try:
    unverified = jwt.get_unverified_claims(token)
    print("✅ Successfully decoded unverified claims:")
    print(f"   sub (UUID): {unverified.get('sub')}")
    print(f"   email: {unverified.get('email')}")
    print(f"   role: {unverified.get('role')}")
    print(f"   aud: {unverified.get('aud')}")
    print(f"   iss: {unverified.get('iss')}")
    print()
except Exception as e:
    print(f"❌ ERROR: {e}")
    sys.exit(1)

# Test 2: Decode with verification using correct secret
print("=" * 60)
print("TEST 2: Decode with JWT secret (HS256)")
print("=" * 60)

JWT_SECRET = "Xiswflp+l8/vIjXt9MXgeX2YUJ7WKe9BV+bQZmPKrYOzUXFVAY6H9mHkJXtJylSvyXEcgaeOIFq6lQApQ8lAJw=="

try:
    # Try with audience validation
    payload = jwt.decode(
        token,
        JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated"
    )
    print("✅ Successfully verified with audience='authenticated':")
    print(f"   sub: {payload.get('sub')}")
    print(f"   email: {payload.get('email')}")
    print()
except JWTError as e:
    print(f"⚠️  Failed with audience validation: {e}")
    print()

    # Try without audience validation
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        print("✅ Successfully verified WITHOUT audience validation:")
        print(f"   sub: {payload.get('sub')}")
        print(f"   email: {payload.get('email')}")
        print(f"   Full payload: {payload}")
    except JWTError as e2:
        print(f"❌ ERROR: {e2}")
        sys.exit(1)

print()
print("=" * 60)
print("✅ ALL TESTS PASSED")
print("=" * 60)
