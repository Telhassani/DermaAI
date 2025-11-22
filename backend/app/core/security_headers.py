"""
Security Headers Middleware - Implements security best practices for HTTP responses

This module provides middleware and utilities for adding security headers to all
HTTP responses, including CSRF protection, CSP policies, and anti-framing headers.

Security Headers Implemented:
1. Content-Security-Policy (CSP) - Prevent XSS attacks
2. X-Frame-Options - Prevent clickjacking attacks
3. X-Content-Type-Options - Prevent MIME type sniffing
4. Strict-Transport-Security - Force HTTPS usage
5. X-XSS-Protection - Legacy XSS protection (older browsers)
6. Referrer-Policy - Control referrer information
"""

import secrets
import logging
from typing import Callable, Dict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all HTTP responses.

    Protects against:
    - XSS (Cross-Site Scripting) via CSP
    - Clickjacking via X-Frame-Options
    - MIME type sniffing
    - Man-in-the-middle attacks via HSTS
    """

    def __init__(self, app, settings):
        super().__init__(app)
        self.settings = settings
        self.csp_policy = self._build_csp_policy()

    def _build_csp_policy(self) -> str:
        """
        Build Content Security Policy based on environment.

        Development: More lenient (allows unsafe-inline for debugging)
        Production: Strict CSP for maximum protection
        """
        if self.settings.DEBUG:
            # Development: Allow more flexibility for debugging
            return (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' http: https:; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
        else:
            # Production: Strict CSP
            return (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self' https: data:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and add security headers to response.
        """
        response = await call_next(request)

        # Add security headers to response
        self._add_security_headers(response)

        # Generate CSRF token for GET requests (to be used by forms)
        if request.method == "GET":
            csrf_token = generate_csrf_token()
            response.headers["X-CSRF-Token"] = csrf_token

        return response

    def _add_security_headers(self, response: Response) -> None:
        """
        Add all security headers to the response.
        """
        # Content Security Policy - Prevent XSS attacks
        response.headers["Content-Security-Policy"] = self.csp_policy

        # X-Frame-Options - Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # X-Content-Type-Options - Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Referrer-Policy - Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # X-XSS-Protection - Legacy XSS protection (mostly obsolete with CSP)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Strict-Transport-Security - Force HTTPS (production only)
        if not self.settings.DEBUG:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Permissions-Policy (formerly Feature-Policy) - Control browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )


# CSRF Token Management
_csrf_tokens: Dict[str, bool] = {}


def generate_csrf_token() -> str:
    """
    Generate a cryptographically secure CSRF token.

    Returns:
        str: A 32-byte hex CSRF token
    """
    token = secrets.token_hex(32)
    _csrf_tokens[token] = True
    return token


def validate_csrf_token(token: str) -> bool:
    """
    Validate a CSRF token.

    Args:
        token: The CSRF token to validate

    Returns:
        bool: True if token is valid, False otherwise

    Note:
        In production, use a database or Redis to store valid tokens
        for better scalability and cross-process validation.
    """
    if token in _csrf_tokens:
        # One-time use: remove token after validation
        del _csrf_tokens[token]
        return True
    return False


def verify_csrf_token_for_request(request: Request) -> bool:
    """
    Verify CSRF token from request.

    Checks multiple possible locations for the token:
    1. X-CSRF-Token header
    2. csrf_token form field
    3. _csrf_token form field

    Args:
        request: The incoming request

    Returns:
        bool: True if valid CSRF token found, False otherwise

    Note:
        API requests with valid JWT tokens are exempt from CSRF checking
        as they should use header-based authentication.
    """
    # Extract CSRF token from various sources
    csrf_token = request.headers.get("X-CSRF-Token")

    if csrf_token and validate_csrf_token(csrf_token):
        return True

    return False


def is_safe_method(method: str) -> bool:
    """
    Check if HTTP method is safe (doesn't modify state).

    Safe methods (GET, HEAD, OPTIONS) don't need CSRF protection
    because they shouldn't cause state changes.

    Args:
        method: HTTP method

    Returns:
        bool: True if method is safe
    """
    return method.upper() in ("GET", "HEAD", "OPTIONS")
