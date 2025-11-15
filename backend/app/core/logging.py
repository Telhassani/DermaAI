"""
Logging configuration for DermAI Backend
Structured logging with JSON format for production
"""

import logging
import sys
from pathlib import Path
from pythonjsonlogger import jsonlogger

from app.core.config import settings

# Module-level logger instance
logger = logging.getLogger("app")


def setup_logging():
    """Configure logging for the application"""

    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Create audit logs directory for HIPAA compliance
    if settings.HIPAA_AUDIT_ENABLED:
        audit_dir = Path(settings.HIPAA_AUDIT_LOG_DIR)
        audit_dir.mkdir(parents=True, exist_ok=True)

    # Root logger configuration
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))

    # Console handler (human-readable for development)
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler (JSON format for production)
    if not settings.DEBUG:
        file_handler = logging.FileHandler("logs/app.log")
        json_formatter = jsonlogger.JsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s"
        )
        file_handler.setFormatter(json_formatter)
        logger.addHandler(file_handler)

    # Audit logger (HIPAA compliance)
    if settings.HIPAA_AUDIT_ENABLED:
        audit_logger = logging.getLogger("audit")
        audit_handler = logging.FileHandler(
            f"{settings.HIPAA_AUDIT_LOG_DIR}/audit.log"
        )
        audit_formatter = jsonlogger.JsonFormatter(
            "%(timestamp)s %(level)s %(user)s %(action)s %(resource)s %(message)s"
        )
        audit_handler.setFormatter(audit_formatter)
        audit_logger.addHandler(audit_handler)
        audit_logger.setLevel(logging.INFO)

    # Disable unnecessary loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

    return logger


def log_audit_event(
    user_id: str,
    action: str,
    resource: str,
    details: dict = None,
    success: bool = True,
):
    """
    Log audit event for HIPAA compliance

    Args:
        user_id: ID of the user performing the action
        action: Type of action (CREATE, READ, UPDATE, DELETE, etc.)
        resource: Resource being accessed (patient, appointment, etc.)
        details: Additional details about the action
        success: Whether the action was successful
    """
    if not settings.HIPAA_AUDIT_ENABLED:
        return

    audit_logger = logging.getLogger("audit")
    audit_logger.info(
        f"{action} on {resource}",
        extra={
            "user": user_id,
            "action": action,
            "resource": resource,
            "details": details or {},
            "success": success,
        },
    )
