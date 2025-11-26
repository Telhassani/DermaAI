"""
Lab File Processor Service - Extracts lab values from PDF and image files using Claude Vision API

This service uses Claude's vision capabilities to:
1. Parse lab result files (PDF/images)
2. Extract lab value data (test name, value, unit, reference ranges)
3. Structure extracted data for AI analysis
"""

import base64
import json
import logging
import re
from typing import List, Dict, Any, Optional
from app.core.config import settings

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

logger = logging.getLogger(__name__)


# Model version mapping - maps short names to full Anthropic model IDs
MODEL_VERSION_MAP = {
    "claude-opus-4-1": "claude-opus-4-1-20250805",
    "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3-sonnet": "claude-3-sonnet-20240229",
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-3-haiku": "claude-3-haiku-20240307",
}


class LabFileProcessor:
    """
    Extracts structured lab data from PDF and image files using Claude Vision API
    """

    def __init__(self):
        """Initialize Anthropic client for file processing"""
        self.client: Optional[anthropic.Anthropic] = None
        self.is_configured = False
        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize Anthropic client with API key"""
        if not ANTHROPIC_AVAILABLE:
            logger.warning("Anthropic SDK not installed. Lab file processing unavailable.")
            return

        try:
            if not settings.ANTHROPIC_API_KEY:
                logger.warning("ANTHROPIC_API_KEY not configured. Lab file processing disabled.")
                return

            self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.is_configured = True
            logger.info("Anthropic client initialized for lab file processing")

        except Exception as e:
            logger.error(f"Failed to initialize Anthropic client: {str(e)}")
            self.is_configured = False

    def _resolve_model_name(self, model_id: str) -> str:
        """
        Resolve a short model name to the full Anthropic model ID

        Args:
            model_id: Short or full model ID (e.g. "claude-3-5-sonnet" or "claude-opus-4-1")

        Returns:
            Full model ID (e.g. "claude-opus-4-1-20250805")
        """
        # If already a full model ID with version, return as-is
        if model_id in MODEL_VERSION_MAP.values():
            return model_id

        # Map short name to full name
        if model_id in MODEL_VERSION_MAP:
            return MODEL_VERSION_MAP[model_id]

        # If not found in mapping, try using the model name as-is
        # (some models may not require versioning or use shorter names)
        logger.warning(f"Model ID '{model_id}' not in mapping. Attempting to use as-is with Anthropic API.")
        return model_id

    async def extract_lab_values(
        self,
        file_content: bytes,
        filename: str,
        file_type: str
    ) -> List[Dict[str, Any]]:
        """
        Extract lab values from a file (PDF or image) using Claude Vision API

        Args:
            file_content: Raw bytes of the file
            filename: Original filename
            file_type: MIME type (application/pdf, image/jpeg, image/png)

        Returns:
            List of extracted lab values in format:
            [
                {
                    "test_name": "Glucose",
                    "value": 115.0,
                    "unit": "mg/dL",
                    "reference_min": 70.0,
                    "reference_max": 100.0,
                    "is_abnormal": True
                },
                ...
            ]
        """
        if not self.is_configured or not self.client:
            logger.error("Anthropic client not configured")
            raise RuntimeError("AI service not available for lab file processing")

        try:
            logger.info(f"Processing lab file: {filename} ({file_type})")

            # Convert file to base64
            file_base64 = base64.standard_b64encode(file_content).decode('utf-8')

            # Determine media type for Claude
            media_type_map = {
                "application/pdf": "application/pdf",
                "image/jpeg": "image/jpeg",
                "image/jpg": "image/jpeg",
                "image/png": "image/png"
            }
            media_type = media_type_map.get(file_type, "image/jpeg")

            # Create the message with vision content
            prompt = """Please analyze this lab result document and extract all laboratory test values.

For each test found, provide the following information in JSON format:
{
    "lab_values": [
        {
            "test_name": "Test Name (e.g., Glucose, Hemoglobin)",
            "value": numeric_value,
            "unit": "unit (e.g., mg/dL, g/dL)",
            "reference_min": numeric_minimum_reference_or_null,
            "reference_max": numeric_maximum_reference_or_null,
            "is_abnormal": true/false
        }
    ]
}

Guidelines:
1. Extract ALL visible lab test results from the document
2. Parse numeric values and units accurately
3. Identify reference ranges if provided
4. Mark values as abnormal if they fall outside reference ranges
5. If reference ranges are not provided, set them to null
6. Return valid JSON only, no additional text

If no lab values can be found, return: {"lab_values": []}"""

            # Use claude-opus-4-1 which is available with the current API key
            # This model is superior to claude-3-5-sonnet for lab analysis
            model_id = "claude-opus-4-1-20250805"

            if file_type == "application/pdf":
                # For PDF files
                response = self.client.messages.create(
                    model=model_id,
                    max_tokens=2048,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "document",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "application/pdf",
                                        "data": file_base64
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                )
            else:
                # For image files
                response = self.client.messages.create(
                    model=model_id,
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
                                        "data": file_base64
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                )

            # Parse Claude's response
            response_text = response.content[0].text
            logger.info(f"Claude response text: {response_text[:500]}")  # Log first 500 chars

            # Try to extract JSON from response (Claude might include extra text)
            try:
                # First, try direct JSON parsing
                parsed_response = json.loads(response_text)
            except json.JSONDecodeError:
                # If that fails, try to extract JSON from the response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    try:
                        parsed_response = json.loads(json_match.group())
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse extracted JSON: {str(e)}")
                        logger.error(f"Full Claude response: {response_text}")
                        raise ValueError(f"Lab file processing failed: Could not parse Claude response as JSON. Response: {response_text[:200]}")
                else:
                    logger.error(f"No JSON found in Claude response: {response_text}")
                    raise ValueError(f"Lab file processing failed: Claude did not return JSON format. Response: {response_text[:200]}")

            lab_values = parsed_response.get("lab_values", [])

            # Validate and clean extracted values
            validated_values = self._validate_lab_values(lab_values)

            logger.info(f"Successfully extracted {len(validated_values)} lab values from {filename}")
            return validated_values

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {str(e)}")
            raise ValueError("Lab file processing failed: Invalid response format")
        except Exception as e:
            logger.error(f"Error processing lab file: {str(e)}", exc_info=True)
            raise

    def _validate_lab_values(self, lab_values: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validate and clean extracted lab values

        Args:
            lab_values: Raw extracted values from Claude

        Returns:
            Cleaned and validated lab values
        """
        validated = []

        for value in lab_values:
            try:
                # Required fields
                if not value.get("test_name") or not value.get("value") or not value.get("unit"):
                    logger.warning(f"Skipping incomplete lab value: {value}")
                    continue

                # Clean and convert numeric values
                try:
                    numeric_value = float(value.get("value"))
                except (ValueError, TypeError):
                    logger.warning(f"Invalid numeric value in {value.get('test_name')}")
                    continue

                # Parse reference ranges
                ref_min = None
                ref_max = None
                if value.get("reference_min") is not None:
                    try:
                        ref_min = float(value.get("reference_min"))
                    except (ValueError, TypeError):
                        pass

                if value.get("reference_max") is not None:
                    try:
                        ref_max = float(value.get("reference_max"))
                    except (ValueError, TypeError):
                        pass

                # Determine if abnormal
                is_abnormal = value.get("is_abnormal", False)
                if ref_min is not None and ref_max is not None:
                    is_abnormal = numeric_value < ref_min or numeric_value > ref_max

                # Add validated value
                validated.append({
                    "test_name": str(value.get("test_name")).strip(),
                    "value": numeric_value,
                    "unit": str(value.get("unit")).strip(),
                    "reference_min": ref_min,
                    "reference_max": ref_max,
                    "is_abnormal": bool(is_abnormal)
                })

            except Exception as e:
                logger.warning(f"Error validating lab value: {str(e)}")
                continue

        return validated


# Create singleton instance
lab_file_processor = LabFileProcessor()
