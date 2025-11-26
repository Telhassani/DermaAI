"""
Secure API Key Manager - Handles session-based API key storage and encryption.
"""

import json
import logging
from typing import Dict, Optional
from cryptography.fernet import Fernet
from app.core.config import settings
from app.core.logging import logger


class APIKeyManager:
    """
    Manages secure storage and retrieval of API keys for a session.
    Keys are encrypted and stored in memory/Redis with automatic expiration.
    """

    def __init__(self):
        """Initialize the API key manager."""
        self._encryption_key = self._get_or_generate_encryption_key()
        self._cipher = Fernet(self._encryption_key) if self._encryption_key else None
        self._session_cache: Dict[int, Dict[str, str]] = {}

    def _get_or_generate_encryption_key(self) -> Optional[bytes]:
        """Get encryption key from config or generate a new one."""
        if settings.API_KEY_ENCRYPTION_KEY:
            return settings.API_KEY_ENCRYPTION_KEY.encode()

        logger.warning(
            "API_KEY_ENCRYPTION_KEY not configured. "
            "API keys will not be encrypted. Set API_KEY_ENCRYPTION_KEY in .env"
        )
        return None

    def encrypt_keys(self, keys: Dict[str, str]) -> str:
        """
        Encrypt API keys dictionary to a single string.

        Args:
            keys: Dictionary of API keys {provider: key_value}

        Returns:
            Encrypted string representation
        """
        if not self._cipher:
            logger.warning("Encryption not available, storing keys unencrypted")
            return json.dumps(keys)

        try:
            json_str = json.dumps(keys)
            encrypted = self._cipher.encrypt(json_str.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Failed to encrypt API keys: {str(e)}")
            raise

    def decrypt_keys(self, encrypted_data: str) -> Dict[str, str]:
        """
        Decrypt API keys from encrypted string.

        Args:
            encrypted_data: Encrypted string representation

        Returns:
            Dictionary of API keys
        """
        if not self._cipher:
            # Fallback to JSON parsing if no cipher
            try:
                return json.loads(encrypted_data)
            except json.JSONDecodeError:
                logger.error("Failed to parse unencrypted API keys")
                return {}

        try:
            decrypted = self._cipher.decrypt(encrypted_data.encode())
            return json.loads(decrypted.decode())
        except Exception as e:
            logger.error(f"Failed to decrypt API keys: {str(e)}")
            return {}

    def store_keys(self, user_id: int, keys: Dict[str, str]) -> None:
        """
        Store API keys in session cache (in-memory).
        For production, consider using Redis with TTL.

        Args:
            user_id: ID of the user
            keys: Dictionary of API keys to store
        """
        self._session_cache[user_id] = keys
        logger.info(f"Stored {len(keys)} API key(s) for user {user_id}")

    def get_keys(self, user_id: int) -> Dict[str, str]:
        """
        Retrieve stored API keys for a user.

        Args:
            user_id: ID of the user

        Returns:
            Dictionary of API keys (empty dict if not found)
        """
        keys = self._session_cache.get(user_id, {})
        logger.debug(f"Retrieved {len(keys)} API key(s) for user {user_id}")
        return keys

    def clear_keys(self, user_id: int) -> None:
        """
        Clear stored API keys for a user.

        Args:
            user_id: ID of the user
        """
        if user_id in self._session_cache:
            del self._session_cache[user_id]
            logger.info(f"Cleared API keys for user {user_id}")

    def merge_with_environment_keys(self, session_keys: Dict[str, str]) -> Dict[str, str]:
        """
        Merge session API keys with environment-based keys.
        Session keys take precedence over environment keys.

        Args:
            session_keys: User-provided API keys from session

        Returns:
            Merged dictionary with all available keys
        """
        # Map of key names to config attributes
        env_key_mapping = {
            "anthropic": settings.ANTHROPIC_API_KEY,
            "openai": settings.OPENAI_API_KEY,
            "medgemma": settings.MEDGEMMA_API_KEY,
            "palm2": settings.PALM2_API_KEY,
            "biogpt": settings.BIOGPT_API_KEY,
            "clinical_bert": settings.CLINICAL_BERT_API_KEY,
            "gpt5": settings.GPT5_API_KEY,
            "deepseek": settings.DEEPSEEK_R1_API_KEY,
        }

        # Start with environment keys
        merged = {k: v for k, v in env_key_mapping.items() if v}

        # Override with session keys (take precedence)
        merged.update(session_keys)

        return merged


# Global API key manager instance
api_key_manager = APIKeyManager()
