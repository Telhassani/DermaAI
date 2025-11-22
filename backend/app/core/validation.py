"""
Input Validation and Sanitization Module

Provides security utilities for validating and sanitizing user inputs,
preventing common attacks like XSS, SQL injection, and file upload exploits.

Features:
- File upload validation (type, size, extension)
- HTML sanitization (remove dangerous tags)
- Text input validation (length, format)
- XSS prevention
- SQL injection detection
"""

import re
import logging
from typing import Set, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)

# ============================================================================
# File Upload Validation
# ============================================================================

# Allowed MIME types for medical images
ALLOWED_IMAGE_MIMES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
}

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"}

# Maximum file size (in bytes)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Dangerous file extensions to reject
DANGEROUS_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".scr",
    ".vbs",
    ".js",
    ".jar",
    ".zip",
    ".rar",
    ".7z",
}


def validate_file_upload(
    filename: str,
    content_type: str,
    file_size: int,
) -> tuple[bool, Optional[str]]:
    """
    Validate file upload based on extension, MIME type, and size.

    Args:
        filename: Name of the uploaded file
        content_type: MIME type reported by client (don't trust this!)
        file_size: File size in bytes

    Returns:
        Tuple of (is_valid, error_message)
        is_valid: True if file passes all validation
        error_message: Validation error message if invalid, None if valid
    """
    # Check file size
    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File size exceeds maximum {MAX_FILE_SIZE_BYTES} bytes"

    if file_size == 0:
        return False, "File is empty"

    # Check filename for suspicious patterns FIRST (before extension check)
    suspicious_patterns = [
        r"[<>:\"|?*]",  # Invalid filename characters
        r"\.\.[\\/]",  # Directory traversal
        r"^\s*\.",  # Hidden files
        r"\x00",  # Null byte
    ]

    for pattern in suspicious_patterns:
        if re.search(pattern, filename):
            return False, f"Filename contains suspicious characters: {filename}"

    # Get file extension
    file_path = Path(filename)
    extension = file_path.suffix.lower()

    # Check for dangerous extensions
    if extension in DANGEROUS_EXTENSIONS:
        return False, f"File type .{extension} is not allowed"

    # Check for allowed extensions
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return False, f"File extension {extension} not allowed. Allowed: {ALLOWED_IMAGE_EXTENSIONS}"

    # Check MIME type (note: can be spoofed, so don't rely on this alone)
    if content_type and content_type not in ALLOWED_IMAGE_MIMES:
        logger.warning(
            f"Suspicious MIME type: {content_type} for file {filename}"
        )
        # We allow it but log it - MIME type can be spoofed anyway

    return True, None


def validate_filename(filename: str) -> tuple[bool, Optional[str]]:
    """
    Validate filename for safety and prevent directory traversal.

    Args:
        filename: Filename to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Remove any path components
    safe_filename = Path(filename).name

    # Check if filename changed (attempt to include path)
    if safe_filename != filename:
        return False, "Filename contains invalid path components"

    # Check length
    if len(safe_filename) > 255:
        return False, "Filename too long (max 255 characters)"

    # Check for empty filename
    if not safe_filename:
        return False, "Filename cannot be empty"

    return True, None


# ============================================================================
# HTML Sanitization
# ============================================================================

# HTML tags that are safe to allow (if using bleach library)
ALLOWED_HTML_TAGS = [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "h1",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
]

# HTML attributes that are safe to allow
ALLOWED_HTML_ATTRIBUTES = {
    "*": ["class"],
    "a": ["href", "title"],
    "img": ["src", "alt", "title"],
}


def sanitize_html(html_content: str, allow_html: bool = False) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.

    Args:
        html_content: Raw HTML content from user
        allow_html: If False, strips all HTML. If True, allows safe tags.

    Returns:
        Sanitized HTML/text content

    Note:
        - If allow_html=False, all HTML tags are stripped
        - If allow_html=True, only safe tags are kept
        - All script tags are always removed
        - All event handlers (onclick, onerror, etc.) are removed
    """
    if not html_content:
        return ""

    # Remove script tags and their content
    html_content = re.sub(
        r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>",
        "",
        html_content,
        flags=re.IGNORECASE,
    )

    # Remove event handlers (onclick, onerror, onload, etc.)
    html_content = re.sub(
        r'\s*on\w+\s*=\s*["\']?[^\s"\']*["\']?',
        "",
        html_content,
        flags=re.IGNORECASE,
    )

    if not allow_html:
        # Strip all HTML tags
        html_content = re.sub(r"<[^>]+>", "", html_content)
    else:
        # Use bleach if available (pip install bleach)
        try:
            import bleach

            html_content = bleach.clean(
                html_content,
                tags=ALLOWED_HTML_TAGS,
                attributes=ALLOWED_HTML_ATTRIBUTES,
                strip=True,
            )
        except ImportError:
            logger.warning("bleach library not installed, stripping all HTML")
            html_content = re.sub(r"<[^>]+>", "", html_content)

    return html_content


def sanitize_text(text: str, max_length: int = 5000) -> str:
    """
    Sanitize plain text input.

    Args:
        text: Raw text input from user
        max_length: Maximum allowed length

    Returns:
        Sanitized text

    - Strips whitespace
    - Limits length
    - Removes control characters
    - Removes null bytes
    """
    if not text:
        return ""

    # Remove null bytes
    text = text.replace("\x00", "")

    # Remove control characters except newlines and tabs
    text = "".join(
        char for char in text if ord(char) >= 32 or char in "\n\t"
    )

    # Limit length
    if len(text) > max_length:
        text = text[: max_length]

    # Strip leading/trailing whitespace
    text = text.strip()

    return text


# ============================================================================
# Text Field Validation
# ============================================================================

# Patterns for common fields
PATTERNS = {
    "email": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    "phone": r"^[\d\s()+-]+$",  # Allow digits, spaces, parentheses, plus, hyphen
    "url": r"^https?://[^\s/$.?#].[^\s]*$",
    "username": r"^[a-zA-Z0-9_-]{3,20}$",
    "cin": r"^[A-Z]{2}\d{6}$",  # Example: AB123456
    "passport": r"^[A-Z0-9]{6,9}$",
}


def validate_email(email: str) -> bool:
    """Validate email address format."""
    if not email or len(email) > 254:
        return False
    return bool(re.match(PATTERNS["email"], email))


def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    if not phone or len(phone) > 20:
        return False
    # Must have at least 10 digits
    digits = "".join(c for c in phone if c.isdigit())
    return len(digits) >= 10


def validate_identification(
    identification_number: str, identification_type: str
) -> bool:
    """
    Validate identification number based on type.

    Args:
        identification_number: ID number
        identification_type: Type of ID ('cin', 'passport', etc.)

    Returns:
        True if valid, False otherwise
    """
    if not identification_number or not identification_type:
        return False

    pattern = PATTERNS.get(identification_type.lower())
    if not pattern:
        return False

    return bool(re.match(pattern, identification_number))


def validate_text_length(text: str, min_length: int = 1, max_length: int = 5000) -> bool:
    """
    Validate text field length.

    Args:
        text: Text to validate
        min_length: Minimum allowed length
        max_length: Maximum allowed length

    Returns:
        True if length is valid
    """
    if not isinstance(text, str):
        return False
    return min_length <= len(text) <= max_length


# ============================================================================
# SQL Injection Detection (for logging/monitoring)
# ============================================================================

# SQL keywords that might indicate injection attempt
SQL_INJECTION_PATTERNS = [
    r"(\bunion\b.*\bselect\b)",
    r"(\bdrop\b.*\btable\b)",
    r"(\binsert\b.*\binto\b)",
    r"(\bupdate\b.*\bset\b)",
    r"(\bdelete\b.*\bfrom\b)",
    r"(--|#|/\*)",  # SQL comments
    r"(;.*\b(select|drop|insert|update|delete)\b)",
]


def detect_sql_injection_attempt(input_text: str) -> bool:
    """
    Detect potential SQL injection attempts in input.

    Note: This is for logging/alerting only. Never trust this for actual
    protection - use parameterized queries and ORMs which DermAI already does.

    Args:
        input_text: Input to check

    Returns:
        True if potential injection detected, False otherwise
    """
    if not isinstance(input_text, str):
        return False

    # Convert to lowercase for pattern matching
    text_lower = input_text.lower()

    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True

    return False


# ============================================================================
# XSS Prevention Helpers
# ============================================================================

# Characters that need to be escaped for HTML context
HTML_ESCAPE_TABLE = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#x27;",
    ">": "&gt;",
    "<": "&lt;",
}


def escape_html(text: str) -> str:
    """
    Escape HTML special characters.

    Args:
        text: Text to escape

    Returns:
        HTML-escaped text
    """
    if not text:
        return ""
    return "".join(HTML_ESCAPE_TABLE.get(c, c) for c in text)


def is_safe_string(text: str) -> bool:
    """
    Check if string contains potentially dangerous content.

    Args:
        text: String to check

    Returns:
        True if string appears safe, False if it contains suspicious content
    """
    if not isinstance(text, str):
        return False

    # Check for script tags
    if re.search(r"<script", text, re.IGNORECASE):
        return False

    # Check for event handlers
    if re.search(r"on\w+\s*=", text, re.IGNORECASE):
        return False

    # Check for data URLs (can execute JavaScript)
    if re.search(r"data:text/html", text, re.IGNORECASE):
        return False

    # Check for JavaScript protocol
    if re.search(r"javascript:", text, re.IGNORECASE):
        return False

    return True
