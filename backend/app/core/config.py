"""
Configuration settings for DermAI Backend
Using Pydantic Settings for environment variable management
"""

from typing import List, Optional, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, field_validator, ConfigDict
from pydantic_settings.sources import DotEnvSettingsSource, EnvSettingsSource


class CustomEnvSettingsSource(EnvSettingsSource):
    """Custom env source that handles empty values for optional fields"""

    def prepare_field_value(self, field_name: str, field, field_value: Any, value_is_complex: bool):
        # Skip JSON parsing for empty values
        if isinstance(field_value, str) and field_value.strip() == "":
            return None
        return super().prepare_field_value(field_name, field, field_value, value_is_complex)


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        settings_sources=(CustomEnvSettingsSource, DotEnvSettingsSource),
    )

    # =====================================
    # APPLICATION
    # =====================================
    PROJECT_NAME: str = "DermAI API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # =====================================
    # DATABASE
    # =====================================
    DATABASE_URL: str  # Required - must be set via .env file

    # =====================================
    # REDIS
    # =====================================
    REDIS_URL: str  # Required - must be set via .env file

    # =====================================
    # SECURITY
    # =====================================
    SECRET_KEY: str  # Required - must be set via .env file, generate with: openssl rand -hex 32
    ALGORITHM: str = "HS256"
    # Token expiry: 1 hour for access token, 7 days for refresh token
    # NOTE: This is TOTAL token lifetime, not inactivity timeout
    # Inactivity timeout (if not using token) is handled on frontend
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # =====================================
    # CORS
    # =====================================
    ALLOWED_ORIGINS_STR: str = '["http://localhost:3000","http://localhost:3001","http://127.0.0.1:3000","http://127.0.0.1:3001"]'
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        """Parse ALLOWED_ORIGINS from string"""
        import json
        if isinstance(self.ALLOWED_ORIGINS_STR, str):
            try:
                return json.loads(self.ALLOWED_ORIGINS_STR)
            except (json.JSONDecodeError, TypeError):
                return [origin.strip() for origin in self.ALLOWED_ORIGINS_STR.split(",")]
        return self.ALLOWED_ORIGINS_STR

    # =====================================
    # AI APIs
    # =====================================
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    KANTESTI_API_KEY: Optional[str] = None

    # Multi-model support API keys
    MEDGEMMA_API_KEY: Optional[str] = None
    PALM2_API_KEY: Optional[str] = None
    BIOGPT_API_KEY: Optional[str] = None
    CLINICAL_BERT_API_KEY: Optional[str] = None
    GPT5_API_KEY: Optional[str] = None
    DEEPSEEK_R1_API_KEY: Optional[str] = None

    # API Key encryption for session storage
    API_KEY_ENCRYPTION_KEY: Optional[str] = None

    # =====================================
    # EMAIL (SMTP)
    # =====================================
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "DermAI <noreply@dermai.com>"

    # =====================================
    # FILE STORAGE
    # =====================================
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # AWS S3 (Production)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # =====================================
    # MONITORING
    # =====================================
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"

    # =====================================
    # RATE LIMITING
    # =====================================
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # =====================================
    # HIPAA COMPLIANCE
    # =====================================
    HIPAA_AUDIT_ENABLED: bool = True
    HIPAA_AUDIT_LOG_DIR: str = "./logs/audit"
    DATA_RETENTION_DAYS: int = 2555  # 7 years

    # =====================================
    # BACKUP
    # =====================================
    BACKUP_ENABLED: bool = True
    BACKUP_SCHEDULE: str = "0 2 * * *"  # Daily at 2 AM
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_DIR: str = "./backups"

    # =====================================
    # CELERY
    # =====================================
    CELERY_BROKER_URL: Optional[str] = None  # Defaults to REDIS_URL if not set
    CELERY_RESULT_BACKEND: Optional[str] = None  # Defaults to REDIS_URL if not set
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_TIMEZONE: str = "UTC"


# Create global settings instance
settings = Settings()
