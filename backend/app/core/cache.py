"""
Redis caching service for DermAI application.

Provides a Redis client wrapper with connection pooling and error handling
for distributed caching of expensive operations (image analysis, patient data, etc).
"""

import json
import redis
from typing import Any, Optional
from functools import wraps
from datetime import timedelta
from app.core.config import settings
from app.core.logging import logger


class RedisCache:
    """
    Redis cache service with connection pooling and automatic serialization.

    Implements caching for:
    - Image analysis results (key: image:{image_id}:analysis)
    - Patient search results (key: patient:search:{query})
    - Prescription interactions (key: prescription:{prescription_id}:interactions)
    """

    def __init__(self):
        """Initialize Redis connection pool."""
        self.client: Optional[redis.Redis] = None
        self.is_connected = False
        self._initialize_connection()

    def _initialize_connection(self) -> None:
        """Initialize Redis connection with error handling."""
        try:
            if not settings.REDIS_URL:
                logger.warning("REDIS_URL not configured. Caching disabled.")
                self.is_connected = False
                return

            # Create connection pool with automatic retry
            self.client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30,
            )

            # Test connection
            self.client.ping()
            self.is_connected = True
            logger.info("Redis cache connected successfully")

        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {str(e)}. Caching disabled.")
            self.client = None
            self.is_connected = False

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve a value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value (automatically deserialized from JSON) or None
        """
        if not self.is_connected:
            return None

        try:
            value = self.client.get(key)
            if value is None:
                return None

            # Deserialize JSON
            return json.loads(value)
        except Exception as e:
            logger.warning(f"Cache get error for key {key}: {str(e)}")
            return None

    def set(
        self,
        key: str,
        value: Any,
        expire_seconds: int = 3600,
    ) -> bool:
        """
        Store a value in cache.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            expire_seconds: TTL in seconds (default: 1 hour)

        Returns:
            True if successful, False otherwise
        """
        if not self.is_connected:
            return False

        try:
            # Serialize to JSON
            serialized = json.dumps(value, default=str)

            # Store with TTL
            self.client.setex(
                key,
                timedelta(seconds=expire_seconds),
                serialized,
            )
            return True
        except Exception as e:
            logger.warning(f"Cache set error for key {key}: {str(e)}")
            return False

    def delete(self, key: str) -> bool:
        """
        Delete a key from cache.

        Args:
            key: Cache key to delete

        Returns:
            True if key existed and was deleted, False otherwise
        """
        if not self.is_connected:
            return False

        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.warning(f"Cache delete error for key {key}: {str(e)}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern.

        Args:
            pattern: Redis glob pattern (e.g., "image:*:analysis")

        Returns:
            Number of keys deleted
        """
        if not self.is_connected:
            return 0

        try:
            keys = self.client.keys(pattern)
            if not keys:
                return 0

            return self.client.delete(*keys)
        except Exception as e:
            logger.warning(f"Cache delete_pattern error for pattern {pattern}: {str(e)}")
            return 0

    def clear_all(self) -> bool:
        """
        Flush all keys from the database.

        WARNING: This clears the entire Redis database!

        Returns:
            True if successful, False otherwise
        """
        if not self.is_connected:
            return False

        try:
            self.client.flushdb()
            logger.info("Redis cache flushed")
            return True
        except Exception as e:
            logger.warning(f"Cache flush error: {str(e)}")
            return False

    def exists(self, key: str) -> bool:
        """
        Check if a key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists, False otherwise
        """
        if not self.is_connected:
            return False

        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.warning(f"Cache exists error for key {key}: {str(e)}")
            return False

    def get_ttl(self, key: str) -> int:
        """
        Get remaining TTL for a key.

        Args:
            key: Cache key

        Returns:
            TTL in seconds (-1 if no expiry, -2 if key doesn't exist, 0+ if has TTL)
        """
        if not self.is_connected:
            return -2

        try:
            return self.client.ttl(key)
        except Exception as e:
            logger.warning(f"Cache ttl error for key {key}: {str(e)}")
            return -2


# Global cache instance
redis_cache = RedisCache()


def cache_result(
    expire_seconds: int = 3600,
    key_prefix: str = "",
):
    """
    Decorator to cache function results using Redis.

    Usage:
        @cache_result(expire_seconds=1800, key_prefix="analysis")
        async def analyze_image(image_id: int) -> Dict[str, Any]:
            # Do expensive operation
            return result

    Args:
        expire_seconds: Cache TTL in seconds
        key_prefix: Prefix for cache keys (default: function name)
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key from function name, prefix, and arguments
            prefix = key_prefix or func.__name__

            # Create unique key from args/kwargs
            key_parts = [prefix]
            for arg in args:
                if isinstance(arg, (int, str)):
                    key_parts.append(str(arg))
            for k, v in kwargs.items():
                if isinstance(v, (int, str)):
                    key_parts.append(f"{k}:{v}")

            cache_key = ":".join(key_parts)

            # Try to get from cache
            cached = redis_cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached

            # Cache miss - execute function
            result = await func(*args, **kwargs)

            # Store in cache
            redis_cache.set(cache_key, result, expire_seconds)
            logger.debug(f"Cache set for {cache_key}")

            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key from function name, prefix, and arguments
            prefix = key_prefix or func.__name__

            # Create unique key from args/kwargs
            key_parts = [prefix]
            for arg in args:
                if isinstance(arg, (int, str)):
                    key_parts.append(str(arg))
            for k, v in kwargs.items():
                if isinstance(v, (int, str)):
                    key_parts.append(f"{k}:{v}")

            cache_key = ":".join(key_parts)

            # Try to get from cache
            cached = redis_cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached

            # Cache miss - execute function
            result = func(*args, **kwargs)

            # Store in cache
            redis_cache.set(cache_key, result, expire_seconds)
            logger.debug(f"Cache set for {cache_key}")

            return result

        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator
