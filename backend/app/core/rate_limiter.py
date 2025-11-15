"""
Rate limiting configuration for DermAI

Uses slowapi library for per-IP rate limiting to prevent brute force attacks
and DOS attempts.

Disabled in development mode for easier testing.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.config import settings


class NoOpLimiter:
    """A no-op limiter that disables rate limiting"""
    def limit(self, *args, **kwargs):
        """Return a pass-through decorator"""
        def decorator(func):
            return func
        return decorator


# Initialize rate limiter based on environment
if settings.ENVIRONMENT == "development":
    # Disable rate limiting in development mode
    limiter = NoOpLimiter()
else:
    # Enable rate limiting in production
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
