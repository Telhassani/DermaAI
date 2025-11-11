"""
Configuration settings for DermAI Backend
Using Pydantic Settings for environment variable management
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
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
    DATABASE_URL: str = "postgresql://dermai_user:dermai_pass_dev_only@localhost:5432/dermai_db"

    # =====================================
    # REDIS
    # =====================================
    REDIS_URL: str = "redis://:dermai_redis_pass_dev@localhost:6379/0"

    # =====================================
    # SECURITY
    # =====================================
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # =====================================
    # CORS
    # =====================================
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # =====================================
    # AI APIs
    # =====================================
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    KANTESTI_API_KEY: Optional[str] = None

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
    BASE_URL: str = "http://localhost:8000"
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
    CELERY_BROKER_URL: str = "redis://:dermai_redis_pass_dev@localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://:dermai_redis_pass_dev@localhost:6379/0"
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_TIMEZONE: str = "UTC"


# Create global settings instance
settings = Settings()
