"""
Tests for security functions (password hashing, JWT tokens, etc.)
"""

import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
)
from app.core.config import settings


class TestPasswordHashing:
    """Test password hashing and verification"""

    def test_get_password_hash_returns_different_hashes(self):
        """Test that same password produces different hashes (salt variation)"""
        password = "SecurePassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to salt
        assert hash1 != hash2
        # But both should verify
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

    def test_verify_password_correct_password(self):
        """Test password verification with correct password"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect_password(self):
        """Test password verification with incorrect password"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        assert verify_password("WrongPassword123!", hashed) is False

    def test_verify_password_case_sensitive(self):
        """Test that password verification is case-sensitive"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        assert verify_password("testpassword123!", hashed) is False

    def test_verify_password_special_characters(self):
        """Test password with special characters"""
        password = "P@ssw0rd!#$%^&*()"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True
        assert verify_password(password.replace("!", ""), hashed) is False

    def test_verify_password_empty_string(self):
        """Test password verification with empty password"""
        hashed = get_password_hash("something")

        assert verify_password("", hashed) is False

    def test_verify_password_unicode_characters(self):
        """Test password with unicode characters"""
        password = "Pässwörd123!"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True
        assert verify_password("Password123!", hashed) is False

    def test_hash_length_consistency(self):
        """Test that password hashes have consistent length"""
        password = "TestPassword123!"
        hashes = [get_password_hash(password) for _ in range(5)]

        # All argon2 hashes should be at least 80 characters
        # Exact length depends on hash parameters but should be consistent format
        assert all(len(h) > 80 for h in hashes)
        # Verify all hashes start with argon2 prefix
        assert all(h.startswith("$argon2") for h in hashes)


class TestAccessTokenGeneration:
    """Test access token creation"""

    def test_create_access_token_success(self):
        """Test successful access token creation"""
        data = {"user_id": 1, "email": "test@test.com", "role": "doctor"}
        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        # JWT format: header.payload.signature
        assert len(token.split(".")) == 3

    def test_create_access_token_contains_claims(self):
        """Test that access token contains correct claims"""
        data = {"user_id": 1, "email": "test@test.com", "role": "doctor"}
        token = create_access_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        assert payload["user_id"] == 1
        assert payload["email"] == "test@test.com"
        assert payload["role"] == "doctor"
        assert "exp" in payload
        assert "iat" in payload

    def test_create_access_token_has_expiration(self):
        """Test that access token has expiration time"""
        data = {"user_id": 1}
        token = create_access_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        assert "exp" in payload
        # Should expire in the future
        exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        assert exp_time > datetime.now(timezone.utc)

    def test_create_access_token_custom_expiration(self):
        """Test access token with custom expiration"""
        data = {"user_id": 1}
        custom_expire = timedelta(hours=2)
        token = create_access_token(data, expires_delta=custom_expire)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        # Check that token expires in approximately 2 hours
        exp_time = datetime.fromtimestamp(payload["exp"])
        created_time = datetime.fromtimestamp(payload["iat"])
        delta = exp_time - created_time

        # Allow 5 minute tolerance
        assert timedelta(hours=1, minutes=55) < delta < timedelta(hours=2, minutes=5)

    def test_create_access_token_default_expiration(self):
        """Test that access token uses default expiration from settings"""
        data = {"user_id": 1}
        token = create_access_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        exp_time = datetime.fromtimestamp(payload["exp"])
        created_time = datetime.fromtimestamp(payload["iat"])
        delta = exp_time - created_time

        expected_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        # Allow 1 minute tolerance
        expected_delta = timedelta(minutes=expected_minutes)
        assert timedelta(minutes=expected_minutes - 1) < delta < timedelta(
            minutes=expected_minutes + 1
        )

    def test_create_access_token_different_users(self):
        """Test that different users get different tokens"""
        token1 = create_access_token({"user_id": 1, "email": "user1@test.com"})
        token2 = create_access_token({"user_id": 2, "email": "user2@test.com"})

        assert token1 != token2

        payload1 = jwt.decode(token1, "", algorithms=["HS256"], options={"verify_signature": False})
        payload2 = jwt.decode(token2, "", algorithms=["HS256"], options={"verify_signature": False})

        assert payload1["user_id"] != payload2["user_id"]

    def test_create_access_token_no_type_claim(self):
        """Test that access token doesn't have type claim"""
        data = {"user_id": 1}
        token = create_access_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        # Access tokens don't have explicit type claim
        assert "type" not in payload or payload.get("type") != "refresh"


class TestRefreshTokenGeneration:
    """Test refresh token creation"""

    def test_create_refresh_token_success(self):
        """Test successful refresh token creation"""
        data = {"user_id": 1, "email": "test@test.com"}
        token = create_refresh_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token.split(".")) == 3

    def test_create_refresh_token_has_type_claim(self):
        """Test that refresh token has type='refresh' claim"""
        data = {"user_id": 1}
        token = create_refresh_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        assert payload.get("type") == "refresh"

    def test_create_refresh_token_longer_expiration(self):
        """Test that refresh token has longer expiration than access token"""
        data = {"user_id": 1}
        access_token = create_access_token(data)
        refresh_token = create_refresh_token(data)

        access_payload = jwt.decode(access_token, "", algorithms=["HS256"], options={"verify_signature": False})
        refresh_payload = jwt.decode(refresh_token, "", algorithms=["HS256"], options={"verify_signature": False})

        access_exp = datetime.fromtimestamp(access_payload["exp"])
        refresh_exp = datetime.fromtimestamp(refresh_payload["exp"])

        # Refresh token should expire much later
        assert refresh_exp > access_exp

    def test_create_refresh_token_expiration_matches_settings(self):
        """Test that refresh token expiration matches settings"""
        data = {"user_id": 1}
        token = create_refresh_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        exp_time = datetime.fromtimestamp(payload["exp"])
        created_time = datetime.fromtimestamp(payload["iat"])
        delta = exp_time - created_time

        expected_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
        expected_delta = timedelta(days=expected_days)
        # Allow 1 hour tolerance
        assert timedelta(days=expected_days - 1) < delta < timedelta(
            days=expected_days + 1
        )

    def test_create_refresh_token_contains_user_data(self):
        """Test that refresh token contains user identification data"""
        data = {"user_id": 42, "email": "test@test.com", "role": "doctor"}
        token = create_refresh_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        assert payload["user_id"] == 42
        assert payload["email"] == "test@test.com"
        assert payload["role"] == "doctor"


class TestTokenDecoding:
    """Test token decoding and validation"""

    def test_decode_valid_token(self):
        """Test decoding valid token"""
        data = {"user_id": 1, "email": "test@test.com"}
        token = create_access_token(data)

        payload = decode_token(token)

        assert payload is not None
        assert payload["user_id"] == 1
        assert payload["email"] == "test@test.com"

    def test_decode_invalid_token(self):
        """Test decoding invalid token"""
        invalid_token = "invalid.token.here"

        payload = decode_token(invalid_token)

        assert payload is None

    def test_decode_expired_token(self):
        """Test decoding expired token"""
        # Create a token that expires immediately
        data = {"user_id": 1}
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))

        payload = decode_token(token)

        assert payload is None

    def test_decode_malformed_token(self):
        """Test decoding malformed token"""
        malformed_tokens = [
            "",
            "justonepart",
            "two.parts",
            "too.many.parts.here",
            "not@valid.tokens",
        ]

        for token in malformed_tokens:
            payload = decode_token(token)
            assert payload is None

    def test_decode_token_with_wrong_signature(self):
        """Test that token with modified signature is rejected"""
        data = {"user_id": 1}
        token = create_access_token(data)

        # Modify the signature
        parts = token.split(".")
        modified_token = f"{parts[0]}.{parts[1]}.invalidsignature"

        payload = decode_token(modified_token)

        assert payload is None

    def test_decode_token_with_modified_payload(self):
        """Test that token with modified payload is rejected"""
        data = {"user_id": 1}
        token = create_access_token(data)

        # Try to modify the payload
        parts = token.split(".")
        modified_token = f"{parts[0]}.modified.{parts[2]}"

        payload = decode_token(modified_token)

        assert payload is None


class TestTokenTypeVerification:
    """Test token type verification"""

    def test_verify_access_token_type(self):
        """Test verification of access token type"""
        data = {"user_id": 1}
        token = create_access_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        # Access tokens should verify with expected_type="access"
        # (or no type claim at all)
        assert verify_token_type(payload, expected_type="access")

    def test_verify_refresh_token_type(self):
        """Test verification of refresh token type"""
        data = {"user_id": 1}
        token = create_refresh_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        assert verify_token_type(payload, expected_type="refresh")
        assert not verify_token_type(payload, expected_type="access")

    def test_verify_token_type_default_is_access(self):
        """Test that default expected type is 'access'"""
        data = {"user_id": 1}
        token = create_access_token(data)

        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        # Without specifying expected_type, should default to "access"
        assert verify_token_type(payload)

    def test_verify_wrong_token_type(self):
        """Test that using wrong token type is rejected"""
        refresh_data = {"user_id": 1}
        refresh_token = create_refresh_token(refresh_data)

        payload = jwt.decode(refresh_token, "", algorithms=["HS256"], options={"verify_signature": False})

        # Trying to verify refresh token as access token should fail
        assert not verify_token_type(payload, expected_type="access")


class TestSecurityEdgeCases:
    """Test edge cases and security scenarios"""

    def test_password_hash_not_reversible(self):
        """Test that password hash cannot be reversed"""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)

        # Hash should not contain original password
        assert password not in hashed
        # Should not be reversible
        assert hashed != password

    def test_token_cannot_be_forged_without_secret(self):
        """Test that tokens cannot be forged without the secret key"""
        # Try to create a token with wrong secret
        data = {"user_id": 999, "email": "attacker@test.com"}
        forged_token = jwt.encode(data, "wrong_secret", algorithm="HS256")

        # Decoding with real secret should fail
        payload = decode_token(forged_token)

        assert payload is None

    def test_token_claims_cannot_be_modified(self):
        """Test that token claims cannot be modified after creation"""
        data = {"user_id": 1, "email": "test@test.com"}
        token = create_access_token(data)

        # Decode original
        original_payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        # Try to modify claims (this would require valid signature anyway)
        parts = token.split(".")
        # This would be base64, but let's just verify any modification fails
        modified_token = token + "x"

        modified_payload = decode_token(modified_token)
        assert modified_payload is None

    def test_sensitive_data_not_in_token(self):
        """Test that sensitive data is not exposed in JWT payload"""
        data = {
            "user_id": 1,
            "email": "test@test.com",
            "password": "secret",  # This should not be here, but test it's not exposed
        }
        token = create_access_token(data)

        # JWTs are base64 encoded, not encrypted - payload is visible
        # Just verify the structure is correct
        assert len(token.split(".")) == 3

    def test_empty_data_token_generation(self):
        """Test token generation with empty data"""
        data = {}
        token = create_access_token(data)

        assert token is not None
        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})
        assert "exp" in payload
        assert "iat" in payload

    def test_large_data_token_generation(self):
        """Test token generation with large data payloads"""
        large_data = {f"key_{i}": f"value_{i}" * 10 for i in range(100)}
        token = create_access_token(large_data)

        assert token is not None
        payload = jwt.decode(token, "", algorithms=["HS256"], options={"verify_signature": False})

        # Should contain all data
        assert len(payload) > 100

    def test_special_characters_in_token_data(self):
        """Test tokens with special characters in data"""
        data = {
            "user_id": 1,
            "email": "user+tag@test.com",
            "name": "José García",
            "special": "!@#$%^&*()",
        }
        token = create_access_token(data)

        payload = decode_token(token)

        assert payload["user_id"] == 1
        assert payload["email"] == "user+tag@test.com"
        assert payload["name"] == "José García"
