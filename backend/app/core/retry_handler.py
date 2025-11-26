"""
Retry Handler - Implements retry logic with exponential backoff for API calls
Provides decorators and utilities for handling transient failures
"""

import asyncio
import logging
import time
from functools import wraps
from typing import Optional, Callable, Any, TypeVar, Awaitable

from app.core.config import settings
from app.core.logging import logger

# Type variables for generic retry decorator
F = TypeVar('F', bound=Callable[..., Any])
AsyncF = TypeVar('AsyncF', bound=Callable[..., Awaitable[Any]])


# ============================================================================
# RETRY DECORATORS
# ============================================================================

class RetryConfig:
    """Configuration for retry behavior"""

    def __init__(
        self,
        max_attempts: int = settings.AI_MODEL_RETRY_ATTEMPTS,
        base_delay: float = settings.AI_MODEL_RETRY_DELAY_SECONDS,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
    ):
        """
        Initialize retry configuration.

        Args:
            max_attempts: Maximum number of attempts (default from config)
            base_delay: Initial delay in seconds
            max_delay: Maximum delay between retries (cap exponential growth)
            exponential_base: Base for exponential backoff calculation
            jitter: Add random jitter to prevent thundering herd
        """
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter

    def calculate_delay(self, attempt: int) -> float:
        """
        Calculate delay for given attempt number.

        Uses exponential backoff: delay = base_delay * (exponential_base ^ attempt)
        with optional jitter and max cap.
        """
        # Exponential backoff: base_delay * (2 ^ attempt)
        delay = self.base_delay * (self.exponential_base ** attempt)

        # Cap at maximum delay
        delay = min(delay, self.max_delay)

        # Add jitter: random value between 0 and delay
        if self.jitter:
            import random
            delay = random.uniform(0, delay)

        return delay


def retry_async(
    config: Optional[RetryConfig] = None,
    exceptions: tuple = (Exception,),
    on_retry: Optional[Callable[[int, Exception], None]] = None,
) -> Callable[[AsyncF], AsyncF]:
    """
    Decorator for retrying async functions with exponential backoff.

    Args:
        config: RetryConfig instance (uses default if not provided)
        exceptions: Tuple of exceptions to catch and retry on
        on_retry: Callback function called on retry (attempt number, exception)

    Example:
        @retry_async()
        async def call_api():
            return await ai_service.send_message(...)
    """
    if config is None:
        config = RetryConfig()

    def decorator(func: AsyncF) -> AsyncF:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exception: Optional[Exception] = None

            for attempt in range(config.max_attempts):
                try:
                    return await func(*args, **kwargs)

                except exceptions as e:
                    last_exception = e
                    is_last_attempt = (attempt == config.max_attempts - 1)

                    if is_last_attempt:
                        logger.error(
                            f"Retry exhausted for {func.__name__} after "
                            f"{config.max_attempts} attempts: {str(e)}"
                        )
                        raise

                    # Calculate delay with exponential backoff
                    delay = config.calculate_delay(attempt)

                    # Call on_retry callback if provided
                    if on_retry:
                        on_retry(attempt + 1, e)

                    logger.warning(
                        f"Retrying {func.__name__} after {delay:.2f}s "
                        f"(attempt {attempt + 1}/{config.max_attempts}): {str(e)}"
                    )

                    # Wait before retrying
                    await asyncio.sleep(delay)

            # This should never be reached, but just in case
            if last_exception:
                raise last_exception
            raise RuntimeError(f"Unexpected error in retry wrapper for {func.__name__}")

        return wrapper  # type: ignore

    return decorator


def retry_sync(
    config: Optional[RetryConfig] = None,
    exceptions: tuple = (Exception,),
    on_retry: Optional[Callable[[int, Exception], None]] = None,
) -> Callable[[F], F]:
    """
    Decorator for retrying sync functions with exponential backoff.

    Args:
        config: RetryConfig instance (uses default if not provided)
        exceptions: Tuple of exceptions to catch and retry on
        on_retry: Callback function called on retry (attempt number, exception)

    Example:
        @retry_sync()
        def call_api():
            return ai_service.send_message(...)
    """
    if config is None:
        config = RetryConfig()

    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exception: Optional[Exception] = None

            for attempt in range(config.max_attempts):
                try:
                    return func(*args, **kwargs)

                except exceptions as e:
                    last_exception = e
                    is_last_attempt = (attempt == config.max_attempts - 1)

                    if is_last_attempt:
                        logger.error(
                            f"Retry exhausted for {func.__name__} after "
                            f"{config.max_attempts} attempts: {str(e)}"
                        )
                        raise

                    # Calculate delay with exponential backoff
                    delay = config.calculate_delay(attempt)

                    # Call on_retry callback if provided
                    if on_retry:
                        on_retry(attempt + 1, e)

                    logger.warning(
                        f"Retrying {func.__name__} after {delay:.2f}s "
                        f"(attempt {attempt + 1}/{config.max_attempts}): {str(e)}"
                    )

                    # Wait before retrying
                    time.sleep(delay)

            # This should never be reached, but just in case
            if last_exception:
                raise last_exception
            raise RuntimeError(f"Unexpected error in retry wrapper for {func.__name__}")

        return wrapper  # type: ignore

    return decorator


# ============================================================================
# CIRCUIT BREAKER PATTERN
# ============================================================================

class CircuitBreaker:
    """
    Circuit breaker pattern implementation for API resilience.

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Failures exceeded threshold, requests are rejected immediately
    - HALF_OPEN: Testing if service recovered, limited requests allowed
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        expected_exception: type = Exception,
    ):
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before trying half-open state
            expected_exception: Exception type that triggers circuit breaker
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        self.state = "CLOSED"  # CLOSED, OPEN, or HALF_OPEN

    def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """Execute function through circuit breaker"""
        if self.state == "OPEN":
            if self._should_attempt_reset():
                self.state = "HALF_OPEN"
                self.success_count = 0
                logger.info(f"Circuit breaker entering HALF_OPEN state")
            else:
                raise RuntimeError(
                    f"Circuit breaker is OPEN (recovering in "
                    f"{self.recovery_timeout - (time.time() - self.last_failure_time):.1f}s)"
                )

        try:
            result = func(*args, **kwargs)

            if self.state == "HALF_OPEN":
                self.success_count += 1
                if self.success_count >= 2:  # 2 successful calls to close
                    self._reset()
                    logger.info(f"Circuit breaker CLOSED (service recovered)")

            elif self.state == "CLOSED":
                self.failure_count = 0

            return result

        except self.expected_exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.state == "HALF_OPEN":
                # Failure in half-open immediately opens circuit
                self.state = "OPEN"
                logger.error(f"Circuit breaker OPEN (failure in recovery attempt)")

            elif self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.error(
                    f"Circuit breaker OPEN (threshold of {self.failure_threshold} failures exceeded)"
                )

            raise

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt recovery"""
        if self.last_failure_time is None:
            return False
        return (time.time() - self.last_failure_time) >= self.recovery_timeout

    def _reset(self) -> None:
        """Reset circuit breaker to CLOSED state"""
        self.state = "CLOSED"
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None

    def get_state(self) -> str:
        """Get current circuit breaker state"""
        return self.state


# ============================================================================
# ERROR RESPONSE SCHEMAS
# ============================================================================

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Standard error detail"""
    error: str
    message: str
    details: Optional[dict] = None
    timestamp: Optional[str] = None


class RetryableError(Exception):
    """Error that can be retried"""
    pass


class CircuitBreakerOpenError(Exception):
    """Error when circuit breaker is open"""
    pass


class TimeoutError(Exception):
    """Request timeout error"""
    pass
