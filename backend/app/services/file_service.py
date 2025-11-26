"""
File Service - Handles file upload validation and storage
Validates file types, sizes, and metadata before storage
"""

import os
import hashlib
import logging
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime
from enum import Enum

from app.core.config import settings
from app.core.logging import logger


class FileType(str, Enum):
    """Supported file types"""
    # Images
    JPEG = "image/jpeg"
    PNG = "image/png"
    GIF = "image/gif"
    WEBP = "image/webp"

    # Documents
    PDF = "application/pdf"
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    @classmethod
    def is_image(cls, mime_type: str) -> bool:
        """Check if file is an image"""
        return mime_type in [cls.JPEG.value, cls.PNG.value, cls.GIF.value, cls.WEBP.value]

    @classmethod
    def is_document(cls, mime_type: str) -> bool:
        """Check if file is a document"""
        return mime_type in [cls.PDF.value, cls.DOCX.value]

    @classmethod
    def is_valid(cls, mime_type: str) -> bool:
        """Check if mime type is supported"""
        return mime_type in [f.value for f in cls]


class FileValidationError(Exception):
    """File validation error"""
    pass


class FileService:
    """File upload validation and storage service"""

    # Default allowed MIME types
    ALLOWED_MIME_TYPES = [
        FileType.JPEG.value,
        FileType.PNG.value,
        FileType.GIF.value,
        FileType.WEBP.value,
        FileType.PDF.value,
        FileType.DOCX.value,
    ]

    # File extension mapping to MIME types (for validation)
    EXTENSION_MIME_MAP = {
        ".jpg": FileType.JPEG.value,
        ".jpeg": FileType.JPEG.value,
        ".png": FileType.PNG.value,
        ".gif": FileType.GIF.value,
        ".webp": FileType.WEBP.value,
        ".pdf": FileType.PDF.value,
        ".docx": FileType.DOCX.value,
    }

    # Image-specific constraints (in bytes)
    IMAGE_MAX_SIZE = 20 * 1024 * 1024  # 20 MB
    IMAGE_MIN_SIZE = 100  # 100 bytes

    # Document-specific constraints (in bytes)
    DOCUMENT_MAX_SIZE = 50 * 1024 * 1024  # 50 MB
    DOCUMENT_MIN_SIZE = 100  # 100 bytes

    def __init__(self):
        """Initialize file service"""
        self.logger = logger
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(
        self,
        filename: str,
        file_size: int,
        mime_type: str,
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate file before upload.

        Args:
            filename: Original filename
            file_size: File size in bytes
            mime_type: MIME type of file

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check filename
        if not filename:
            return False, "Filename cannot be empty"

        # Check filename length
        if len(filename) > 255:
            return False, "Filename too long (max 255 characters)"

        # Check for dangerous characters in filename
        dangerous_chars = ['..', '\x00', '\n', '\r']
        if any(char in filename for char in dangerous_chars):
            return False, "Filename contains invalid characters"

        # Get file extension
        file_ext = Path(filename).suffix.lower()
        if not file_ext:
            return False, "File must have an extension"

        # Validate extension
        if file_ext not in self.EXTENSION_MIME_MAP:
            supported = ', '.join(self.EXTENSION_MIME_MAP.keys())
            return False, f"Unsupported file type. Supported: {supported}"

        # Validate MIME type matches extension
        expected_mime = self.EXTENSION_MIME_MAP[file_ext]
        if mime_type != expected_mime:
            return False, f"File extension ({file_ext}) doesn't match MIME type ({mime_type})"

        # Check if MIME type is allowed
        if mime_type not in self.ALLOWED_MIME_TYPES:
            return False, f"MIME type {mime_type} not allowed"

        # Validate file size
        max_size_error = self._validate_file_size(file_size, mime_type)
        if max_size_error:
            return False, max_size_error

        return True, None

    def _validate_file_size(self, file_size: int, mime_type: str) -> Optional[str]:
        """Validate file size based on type"""
        # Check minimum size
        if file_size < 100:
            return "File is too small (minimum 100 bytes)"

        # Check maximum size based on type
        if FileType.is_image(mime_type):
            if file_size > self.IMAGE_MAX_SIZE:
                max_mb = self.IMAGE_MAX_SIZE / (1024 * 1024)
                return f"Image file too large (max {max_mb:.0f} MB)"
        elif FileType.is_document(mime_type):
            if file_size > self.DOCUMENT_MAX_SIZE:
                max_mb = self.DOCUMENT_MAX_SIZE / (1024 * 1024)
                return f"Document file too large (max {max_mb:.0f} MB)"

        # Generic max size check
        max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_size:
            return f"File too large (max {settings.MAX_UPLOAD_SIZE_MB} MB)"

        return None

    def generate_file_hash(self, file_content: bytes) -> str:
        """
        Generate SHA256 hash of file content.

        Args:
            file_content: Raw file bytes

        Returns:
            Hex-encoded SHA256 hash
        """
        sha256_hash = hashlib.sha256()
        sha256_hash.update(file_content)
        return sha256_hash.hexdigest()

    def generate_safe_filename(
        self,
        original_filename: str,
        file_hash: str,
    ) -> str:
        """
        Generate safe filename for storage.

        Args:
            original_filename: Original filename from upload
            file_hash: SHA256 hash of file content

        Returns:
            Safe filename for storage
        """
        # Get file extension
        file_ext = Path(original_filename).suffix.lower()

        # Create timestamp component
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        # Use hash prefix (first 8 chars) + timestamp + extension
        safe_name = f"{file_hash[:8]}_{timestamp}{file_ext}"

        return safe_name

    def save_file(
        self,
        file_content: bytes,
        safe_filename: str,
        subdirectory: Optional[str] = None,
    ) -> str:
        """
        Save file to disk.

        Args:
            file_content: Raw file bytes
            safe_filename: Safe filename for storage
            subdirectory: Optional subdirectory within upload_dir

        Returns:
            Relative path to saved file

        Raises:
            FileValidationError: If save fails
        """
        try:
            # Determine target directory
            if subdirectory:
                target_dir = self.upload_dir / subdirectory
            else:
                target_dir = self.upload_dir

            # Create directory if needed
            target_dir.mkdir(parents=True, exist_ok=True)

            # Full path to file
            file_path = target_dir / safe_filename

            # Prevent path traversal
            if not str(file_path).startswith(str(self.upload_dir)):
                raise FileValidationError("Invalid file path")

            # Write file
            file_path.write_bytes(file_content)

            # Return relative path from upload_dir
            relative_path = file_path.relative_to(self.upload_dir)
            return str(relative_path)

        except Exception as e:
            self.logger.error(f"Error saving file: {str(e)}")
            raise FileValidationError(f"Failed to save file: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from storage.

        Args:
            file_path: Relative path to file

        Returns:
            True if deleted, False otherwise
        """
        try:
            full_path = self.upload_dir / file_path

            # Prevent path traversal
            if not str(full_path).startswith(str(self.upload_dir)):
                self.logger.warning(f"Attempted path traversal: {file_path}")
                return False

            if full_path.exists():
                full_path.unlink()
                self.logger.info(f"Deleted file: {file_path}")
                return True

            return False

        except Exception as e:
            self.logger.error(f"Error deleting file: {str(e)}")
            return False

    def get_file_path(self, file_path: str) -> Optional[Path]:
        """
        Get full file path with security checks.

        Args:
            file_path: Relative path to file

        Returns:
            Full Path object or None if invalid
        """
        try:
            full_path = self.upload_dir / file_path

            # Prevent path traversal
            if not str(full_path).startswith(str(self.upload_dir)):
                self.logger.warning(f"Attempted path traversal: {file_path}")
                return None

            if full_path.exists() and full_path.is_file():
                return full_path

            return None

        except Exception as e:
            self.logger.error(f"Error getting file path: {str(e)}")
            return None


# Global service instance
_file_service: Optional[FileService] = None


def get_file_service() -> FileService:
    """Get or create file service singleton"""
    global _file_service
    if _file_service is None:
        _file_service = FileService()
    return _file_service
