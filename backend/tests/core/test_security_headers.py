"""
Tests for Security Headers Middleware

Validates that all security headers are present and correctly configured
in API responses.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.security_headers import (
    SecurityHeadersMiddleware,
    generate_csrf_token,
    validate_csrf_token,
    is_safe_method,
)
from app.core.config import settings


class TestSecurityHeadersMiddleware:
    """Test security headers are added to all responses"""

    @pytest.fixture
    def app(self):
        """Create a test FastAPI app with security headers middleware"""
        app = FastAPI()
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)

        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}

        @app.post("/test")
        async def test_post():
            return {"message": "test"}

        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return TestClient(app)

    def test_content_security_policy_header_present(self, client):
        """Test that CSP header is present in response"""
        response = client.get("/test")
        assert "content-security-policy" in response.headers
        assert response.status_code == 200

    def test_content_security_policy_development(self, client):
        """Test that CSP is lenient in development"""
        response = client.get("/test")
        csp = response.headers.get("content-security-policy", "")

        if settings.DEBUG:
            # Development: allows unsafe-inline
            assert "unsafe-inline" in csp
            assert "unsafe-eval" in csp
        else:
            # Production: strict CSP
            assert "unsafe-inline" not in csp
            assert "unsafe-eval" not in csp

    def test_x_frame_options_header(self, client):
        """Test X-Frame-Options header prevents clickjacking"""
        response = client.get("/test")
        assert response.headers.get("X-Frame-Options") == "DENY"

    def test_x_content_type_options_header(self, client):
        """Test X-Content-Type-Options prevents MIME sniffing"""
        response = client.get("/test")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"

    def test_referrer_policy_header(self, client):
        """Test Referrer-Policy header"""
        response = client.get("/test")
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_x_xss_protection_header(self, client):
        """Test X-XSS-Protection header for legacy browser support"""
        response = client.get("/test")
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"

    def test_permissions_policy_header(self, client):
        """Test Permissions-Policy header restricts browser features"""
        response = client.get("/test")
        perms = response.headers.get("Permissions-Policy", "")

        # Should restrict sensitive features
        assert "geolocation=()" in perms
        assert "microphone=()" in perms
        assert "camera=()" in perms

    def test_strict_transport_security_production_only(self, client):
        """Test HSTS header only in production"""
        response = client.get("/test")
        hsts = response.headers.get("Strict-Transport-Security")

        if not settings.DEBUG:
            # Production: HSTS should be present
            assert hsts is not None
            assert "max-age=31536000" in hsts
            assert "includeSubDomains" in hsts
        else:
            # Development: HSTS not required
            # (may or may not be present depending on env)
            pass

    def test_csrf_token_generated_on_get(self, client):
        """Test CSRF token is generated for GET requests"""
        response = client.get("/test")
        assert "X-CSRF-Token" in response.headers
        assert len(response.headers["X-CSRF-Token"]) > 0

    def test_csrf_token_different_each_request(self, client):
        """Test each request gets a different CSRF token"""
        response1 = client.get("/test")
        response2 = client.get("/test")

        token1 = response1.headers.get("X-CSRF-Token")
        token2 = response2.headers.get("X-CSRF-Token")

        # Tokens should be different
        assert token1 != token2

    def test_security_headers_on_post(self, client):
        """Test security headers are applied to POST requests too"""
        response = client.post("/test")

        # All security headers should be present
        assert "content-security-policy" in response.headers
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-Content-Type-Options") == "nosniff"

    def test_security_headers_on_error_responses(self, app, client):
        """Test security headers are applied to error responses"""
        # Request non-existent endpoint
        response = client.get("/nonexistent")

        # Even 404 responses should have security headers
        assert "content-security-policy" in response.headers
        assert response.headers.get("X-Frame-Options") == "DENY"


class TestCSRFTokenFunctions:
    """Test CSRF token generation and validation"""

    def test_csrf_token_generation(self):
        """Test CSRF tokens are generated correctly"""
        token = generate_csrf_token()

        assert token is not None
        assert isinstance(token, str)
        assert len(token) == 64  # 32 bytes hex = 64 characters

    def test_csrf_token_validation(self):
        """Test CSRF token validation"""
        token = generate_csrf_token()

        # Token should be valid immediately after generation
        assert validate_csrf_token(token) is True

    def test_csrf_token_one_time_use(self):
        """Test CSRF tokens are one-time use only"""
        token = generate_csrf_token()

        # First validation succeeds
        assert validate_csrf_token(token) is True

        # Second validation fails (token already consumed)
        assert validate_csrf_token(token) is False

    def test_csrf_token_invalid_token(self):
        """Test invalid token validation fails"""
        invalid_token = "invalid_token_not_generated"
        assert validate_csrf_token(invalid_token) is False

    def test_csrf_token_security(self):
        """Test CSRF tokens are cryptographically random"""
        tokens = [generate_csrf_token() for _ in range(100)]

        # All tokens should be unique
        assert len(tokens) == len(set(tokens))


class TestSafeMethodDetection:
    """Test HTTP safe method detection"""

    def test_safe_methods_get(self):
        """Test GET is identified as safe"""
        assert is_safe_method("GET") is True
        assert is_safe_method("get") is True

    def test_safe_methods_head(self):
        """Test HEAD is identified as safe"""
        assert is_safe_method("HEAD") is True
        assert is_safe_method("head") is True

    def test_safe_methods_options(self):
        """Test OPTIONS is identified as safe"""
        assert is_safe_method("OPTIONS") is True
        assert is_safe_method("options") is True

    def test_unsafe_methods_post(self):
        """Test POST is identified as unsafe"""
        assert is_safe_method("POST") is False
        assert is_safe_method("post") is False

    def test_unsafe_methods_put(self):
        """Test PUT is identified as unsafe"""
        assert is_safe_method("PUT") is False
        assert is_safe_method("put") is False

    def test_unsafe_methods_delete(self):
        """Test DELETE is identified as unsafe"""
        assert is_safe_method("DELETE") is False
        assert is_safe_method("delete") is False

    def test_unsafe_methods_patch(self):
        """Test PATCH is identified as unsafe"""
        assert is_safe_method("PATCH") is False
        assert is_safe_method("patch") is False


class TestCSPPolicy:
    """Test Content Security Policy configuration"""

    @pytest.fixture
    def client_dev(self):
        """Client for development environment"""
        app = FastAPI()
        # Simulate dev environment
        from unittest.mock import MagicMock
        dev_settings = MagicMock()
        dev_settings.DEBUG = True
        app.add_middleware(SecurityHeadersMiddleware, settings=dev_settings)

        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}

        return TestClient(app)

    @pytest.fixture
    def client_prod(self):
        """Client for production environment"""
        app = FastAPI()
        # Simulate prod environment
        from unittest.mock import MagicMock
        prod_settings = MagicMock()
        prod_settings.DEBUG = False
        app.add_middleware(SecurityHeadersMiddleware, settings=prod_settings)

        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}

        return TestClient(app)

    def test_csp_allows_self_sources(self, client_dev):
        """Test CSP allows 'self' source in all directives"""
        response = client_dev.get("/test")
        csp = response.headers.get("content-security-policy", "")

        # All directives should include 'self'
        assert "default-src 'self'" in csp

    def test_csp_frame_ancestors_denied(self, client_dev):
        """Test CSP prevents framing from any source"""
        response = client_dev.get("/test")
        csp = response.headers.get("content-security-policy", "")

        assert "frame-ancestors 'none'" in csp

    def test_csp_form_action_restricted(self, client_dev):
        """Test CSP restricts form submissions to same origin"""
        response = client_dev.get("/test")
        csp = response.headers.get("content-security-policy", "")

        assert "form-action 'self'" in csp
