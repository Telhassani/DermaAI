"""
Rate limiting configuration for DermAI

Uses slowapi library for per-IP rate limiting to prevent brute force attacks
and DOS attempts.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom error handler for rate limit exceeded

    Returns a JSON response instead of default text response
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded",
            "message": f"Too many requests. {exc.detail}",
        },
    )
