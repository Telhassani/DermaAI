"""
Service for analyzing medical images using Claude Vision API
"""

import base64
import logging
from typing import Optional
from app.core.config import settings

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

logger = logging.getLogger(__name__)


class ImageAIAnalyzer:
    """
    Service to analyze medical images with Claude Vision API.
    Supports analyzing patient dermatology images with optional context.
    """

    def __init__(self):
        """Initialize the ImageAIAnalyzer with Anthropic client"""
        self.client = None
        self.is_configured = False

        if ANTHROPIC_AVAILABLE:
            try:
                self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                self.is_configured = True
                logger.info("ImageAIAnalyzer initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize ImageAIAnalyzer: {str(e)}")
                self.is_configured = False

    async def analyze_image(
        self,
        image_data: bytes,
        filename: str,
        user_prompt: Optional[str] = None,
        selected_model: str = "claude-3-5-sonnet-20241022",
        patient_context: Optional[dict] = None
    ) -> str:
        """
        Analyze a medical image using Claude Vision API.

        Args:
            image_data: Image file content as bytes
            filename: Original filename for logging
            user_prompt: Optional user prompt for custom analysis
            selected_model: Claude model to use for analysis
            patient_context: Optional dict with patient info (patient_id, patient_name)

        Returns:
            Analysis result as string

        Raises:
            ValueError: If image analysis fails
            Exception: If API call fails
        """
        if not self.is_configured:
            raise ValueError("ImageAIAnalyzer is not properly configured. ANTHROPIC_API_KEY not found.")

        # Encode image to base64
        image_base64 = base64.standard_b64encode(image_data).decode("utf-8")

        # Determine media type from filename
        media_type = self._get_media_type(filename)

        # Build the prompt with context
        analysis_prompt = self._build_prompt(user_prompt, patient_context)

        logger.info(f"Analyzing image: {filename} with model: {selected_model}")

        try:
            # Call Claude Vision API
            response = self.client.messages.create(
                model=selected_model,
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_base64,
                                },
                            },
                            {
                                "type": "text",
                                "text": analysis_prompt,
                            }
                        ],
                    }
                ],
            )

            # Extract the analysis text
            analysis_text = response.content[0].text

            logger.info(f"Successfully analyzed image: {filename}")
            return analysis_text

        except Exception as e:
            logger.error(f"Failed to analyze image {filename}: {str(e)}")
            raise ValueError(f"Image analysis failed: {str(e)}")

    def _get_media_type(self, filename: str) -> str:
        """Determine media type from filename"""
        filename_lower = filename.lower()

        if filename_lower.endswith(('.jpg', '.jpeg')):
            return "image/jpeg"
        elif filename_lower.endswith('.png'):
            return "image/png"
        elif filename_lower.endswith('.gif'):
            return "image/gif"
        elif filename_lower.endswith('.webp'):
            return "image/webp"
        else:
            # Default to jpeg if unknown
            return "image/jpeg"

    def _build_prompt(self, user_prompt: Optional[str], patient_context: Optional[dict]) -> str:
        """
        Build the analysis prompt with context.

        Args:
            user_prompt: Custom prompt from user
            patient_context: Patient information for context

        Returns:
            Full prompt for Claude
        """
        base_prompt = """You are an expert dermatologist analyzing a medical image of a skin lesion or dermatological condition.

Please provide a detailed clinical analysis of the image, including:
1. Visual characteristics (color, size, shape, borders, texture)
2. Possible differential diagnoses
3. Clinical observations and severity assessment
4. Recommended next steps or specialist referral if needed

Format your response clearly with sections for each aspect of the analysis."""

        # Add patient context if available
        if patient_context and patient_context.get('patient_name'):
            context_info = f"\nPatient: {patient_context['patient_name']} (ID: {patient_context.get('patient_id', 'N/A')})"
        else:
            context_info = ""

        # Add custom user prompt if provided
        if user_prompt:
            full_prompt = f"{base_prompt}{context_info}\n\nAdditional instructions from clinician: {user_prompt}"
        else:
            full_prompt = f"{base_prompt}{context_info}"

        return full_prompt


# Create singleton instance
image_ai_analyzer = ImageAIAnalyzer()
