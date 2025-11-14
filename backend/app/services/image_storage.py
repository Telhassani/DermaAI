"""
Image Storage Service
Handles file uploads, compression, thumbnail generation, and storage
"""

import os
import io
import uuid
import shutil
from pathlib import Path
from typing import Tuple, Optional
from datetime import datetime
from PIL import Image, ExifTags
import magic

from app.core.config import settings


class ImageStorageService:
    """Service for handling medical image storage"""

    # Allowed MIME types
    ALLOWED_MIME_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/heic",  # iPhone photos
        "image/webp",
    ]

    # Maximum file size (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

    # Thumbnail configuration
    THUMBNAIL_SIZE = (300, 300)
    THUMBNAIL_QUALITY = 85

    # Image compression quality
    IMAGE_QUALITY = 90

    def __init__(self):
        """Initialize image storage service"""
        # Base upload directory
        self.upload_dir = Path(settings.UPLOAD_DIR if hasattr(settings, 'UPLOAD_DIR') else "uploads/consultation_images")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

        # Subdirectories
        self.images_dir = self.upload_dir / "full"
        self.thumbnails_dir = self.upload_dir / "thumbnails"

        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.thumbnails_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(self, file_content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
        """
        Validate uploaded file

        Args:
            file_content: File content bytes
            filename: Original filename

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file size
        if len(file_content) > self.MAX_FILE_SIZE:
            return False, f"File size exceeds maximum of {self.MAX_FILE_SIZE / 1024 / 1024}MB"

        # Detect MIME type
        try:
            mime_type = magic.from_buffer(file_content, mime=True)
        except Exception as e:
            return False, f"Could not detect file type: {str(e)}"

        # Check MIME type
        if mime_type not in self.ALLOWED_MIME_TYPES:
            return False, f"File type {mime_type} not allowed. Allowed types: {', '.join(self.ALLOWED_MIME_TYPES)}"

        # Try to open as image
        try:
            Image.open(io.BytesIO(file_content))
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"

        return True, None

    def generate_filename(self, original_filename: str) -> str:
        """
        Generate unique filename

        Args:
            original_filename: Original uploaded filename

        Returns:
            Unique filename with UUID and timestamp
        """
        ext = Path(original_filename).suffix.lower()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"{timestamp}_{unique_id}{ext}"

    def extract_exif(self, image: Image.Image) -> dict:
        """
        Extract EXIF metadata from image

        Args:
            image: PIL Image object

        Returns:
            Dictionary with EXIF data
        """
        exif_data = {}

        try:
            exif = image._getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)

                    # Extract useful metadata
                    if tag == "DateTime":
                        try:
                            exif_data["captured_at"] = datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
                        except:
                            pass
                    elif tag == "Model":
                        exif_data["camera_model"] = value
        except:
            pass  # No EXIF data or error reading it

        return exif_data

    def create_thumbnail(self, image_path: Path, thumbnail_path: Path) -> Tuple[int, int]:
        """
        Create thumbnail from image

        Args:
            image_path: Path to original image
            thumbnail_path: Path to save thumbnail

        Returns:
            Tuple of (thumbnail_width, thumbnail_height)
        """
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Create thumbnail
            img.thumbnail(self.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)

            # Save thumbnail
            img.save(
                thumbnail_path,
                "JPEG",
                quality=self.THUMBNAIL_QUALITY,
                optimize=True
            )

            return img.size

    def compress_image(self, image_path: Path) -> None:
        """
        Compress image to reduce file size while maintaining quality

        Args:
            image_path: Path to image to compress
        """
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Save compressed version
            img.save(
                image_path,
                "JPEG",
                quality=self.IMAGE_QUALITY,
                optimize=True
            )

    async def save_image(
        self,
        file_content: bytes,
        original_filename: str
    ) -> Tuple[str, str, int, str, int, int, dict]:
        """
        Save uploaded image and create thumbnail

        Args:
            file_content: File content bytes
            original_filename: Original filename

        Returns:
            Tuple of (
                image_url,
                thumbnail_url,
                file_size,
                mime_type,
                width,
                height,
                exif_data
            )
        """
        # Validate file
        is_valid, error = self.validate_file(file_content, original_filename)
        if not is_valid:
            raise ValueError(error)

        # Generate unique filename
        filename = self.generate_filename(original_filename)

        # Save full image
        image_path = self.images_dir / filename
        with open(image_path, "wb") as f:
            f.write(file_content)

        # Compress image
        self.compress_image(image_path)

        # Get final file size after compression
        file_size = image_path.stat().st_size

        # Open image to get dimensions and EXIF
        with Image.open(image_path) as img:
            width, height = img.size
            exif_data = self.extract_exif(img)

        # Create thumbnail
        thumbnail_filename = f"thumb_{filename}"
        thumbnail_path = self.thumbnails_dir / thumbnail_filename
        self.create_thumbnail(image_path, thumbnail_path)

        # Get MIME type
        mime_type = magic.from_file(str(image_path), mime=True)

        # Generate URLs (relative paths)
        image_url = f"/uploads/consultation_images/full/{filename}"
        thumbnail_url = f"/uploads/consultation_images/thumbnails/{thumbnail_filename}"

        return (
            image_url,
            thumbnail_url,
            file_size,
            mime_type,
            width,
            height,
            exif_data
        )

    def delete_image(self, image_url: str, thumbnail_url: Optional[str] = None) -> None:
        """
        Delete image and its thumbnail

        Args:
            image_url: URL/path to image
            thumbnail_url: URL/path to thumbnail (optional)
        """
        # Extract filename from URL
        image_filename = Path(image_url).name
        image_path = self.images_dir / image_filename

        # Delete main image
        if image_path.exists():
            image_path.unlink()

        # Delete thumbnail
        if thumbnail_url:
            thumbnail_filename = Path(thumbnail_url).name
            thumbnail_path = self.thumbnails_dir / thumbnail_filename
            if thumbnail_path.exists():
                thumbnail_path.unlink()

    def get_image_path(self, image_url: str) -> Path:
        """
        Get absolute file system path from URL

        Args:
            image_url: Image URL

        Returns:
            Absolute path to image file
        """
        filename = Path(image_url).name
        return self.images_dir / filename


# Create singleton instance
image_storage_service = ImageStorageService()
