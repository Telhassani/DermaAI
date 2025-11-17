"""
AI Image Analysis Service - Claude 3.5 Sonnet integration.

Provides dermatology image analysis using Claude 3.5 Sonnet's vision capabilities.
Analyzes skin conditions, identifies potential issues, and provides clinical insights.
"""

import base64
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    logger.warning("Anthropic SDK not installed. Image analysis unavailable.")


class AIAnalysisService:
    """
    Image analysis service using Claude 3.5 Sonnet vision capabilities.

    Features:
    - Dermatology-specific image analysis
    - Condition identification
    - Clinical recommendations
    - Severity assessment
    - Follow-up suggestions
    """

    def __init__(self):
        """Initialize Anthropic client."""
        self.client: Optional[anthropic.Anthropic] = None
        self.is_configured = False
        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize Anthropic client with API key."""
        if not ANTHROPIC_AVAILABLE:
            logger.warning("Anthropic SDK not installed. AI analysis disabled.")
            return

        try:
            if not settings.ANTHROPIC_API_KEY:
                logger.warning("ANTHROPIC_API_KEY not configured. AI analysis disabled.")
                return

            self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.is_configured = True
            logger.info("Anthropic client initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Anthropic client: {str(e)}")
            self.is_configured = False

    async def analyze_image(
        self,
        image_data: str,
        mime_type: str = "image/jpeg",
        additional_notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a dermatology image using Claude 3.5 Sonnet.

        Args:
            image_data: Base64-encoded image data
            mime_type: MIME type of the image (default: image/jpeg)
            additional_notes: Additional clinical context (optional)

        Returns:
            Dictionary with analysis results including:
            - condition: Identified skin condition(s)
            - severity: Severity assessment (mild/moderate/severe)
            - observations: Clinical observations
            - differential_diagnoses: Possible diagnoses to consider
            - recommendations: Clinical recommendations
            - follow_up: Follow-up suggestions
            - confidence: Analysis confidence level (0-100)
        """
        if not self.is_configured:
            logger.warning("AI analysis not configured")
            return {
                "error": "AI analysis service not configured",
                "condition": None,
                "confidence": 0,
            }

        try:
            # Build the analysis prompt
            system_prompt = """You are an experienced dermatologist AI assistant analyzing skin images.

Provide a detailed clinical analysis including:
1. Identified Condition(s) - Name specific skin conditions visible
2. Severity - Rate as mild, moderate, or severe
3. Observations - Describe visible characteristics (color, texture, distribution, size, borders, etc.)
4. Differential Diagnoses - List other conditions to rule out
5. Recommendations - Suggest appropriate treatments or further investigation
6. Follow-up - Suggest when/how to monitor
7. Confidence - Rate your confidence in the analysis (0-100%)

Format response as JSON with keys: condition, severity, observations, differential_diagnoses,
recommendations, follow_up, confidence_percent

Important: This is AI-assisted analysis only. Always recommend professional medical consultation."""

            user_prompt = f"""Please analyze this dermatology image and provide clinical insights.

{'Additional clinical context: ' + additional_notes if additional_notes else ''}"""

            # Call Claude API with vision
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": mime_type,
                                    "data": image_data,
                                },
                            },
                            {
                                "type": "text",
                                "text": user_prompt,
                            },
                        ],
                    }
                ],
            )

            # Extract response text
            response_text = message.content[0].text

            # Parse JSON response
            import json
            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError:
                # If response isn't valid JSON, parse it as text
                analysis = {
                    "condition": "Unable to parse structured response",
                    "severity": "unknown",
                    "observations": response_text,
                    "differential_diagnoses": [],
                    "recommendations": ["Please consult a dermatologist"],
                    "follow_up": "Medical consultation recommended",
                    "confidence_percent": 0,
                }

            # Add metadata
            analysis["status"] = "success"
            analysis["model"] = "claude-3-5-sonnet-20241022"
            analysis["tokens_used"] = {
                "input": message.usage.input_tokens,
                "output": message.usage.output_tokens,
            }

            logger.info(
                f"Image analysis completed successfully. "
                f"Tokens: {message.usage.input_tokens + message.usage.output_tokens}"
            )

            return analysis

        except anthropic.APIError as e:
            logger.error(f"Anthropic API error: {str(e)}")
            return {
                "error": f"API error: {str(e)}",
                "condition": None,
                "confidence": 0,
                "status": "error",
            }
        except Exception as e:
            logger.error(f"Unexpected error during image analysis: {str(e)}")
            return {
                "error": f"Analysis error: {str(e)}",
                "condition": None,
                "confidence": 0,
                "status": "error",
            }

    async def check_drug_interactions(
        self,
        medications: list[str],
    ) -> Dict[str, Any]:
        """
        Check for drug interactions using Claude.

        Args:
            medications: List of medication names to check

        Returns:
            Dictionary with interaction analysis
        """
        if not self.is_configured:
            return {"error": "AI analysis not configured", "interactions": []}

        try:
            prompt = f"""Analyze potential drug interactions for these medications:
{', '.join(medications)}

Provide output as JSON with:
- medications: list of medications analyzed
- interactions: list of interaction objects with: medication_pair, severity, description, recommendation
- summary: brief clinical summary
- requires_consultation: boolean indicating if medical consultation is needed"""

            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            response_text = message.content[0].text

            # Parse response
            import json
            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError:
                analysis = {
                    "medications": medications,
                    "interactions": [],
                    "summary": response_text,
                    "requires_consultation": True,
                }

            analysis["status"] = "success"
            return analysis

        except Exception as e:
            logger.error(f"Drug interaction check error: {str(e)}")
            return {
                "error": str(e),
                "interactions": [],
                "status": "error",
            }

    async def analyze_lab_results(
        self,
        lab_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Analyze lab results in context of skin condition.

        Args:
            lab_data: Dictionary with lab test results and values

        Returns:
            Clinical interpretation
        """
        if not self.is_configured:
            return {"error": "AI analysis not configured"}

        try:
            prompt = f"""Please analyze these lab results and provide clinical interpretation:

{json.dumps(lab_data, indent=2)}

Consider dermatological implications and provide:
- interpretation: overall interpretation
- abnormalities: list of abnormal findings
- implications: how this relates to skin health
- recommendations: suggested follow-up or treatment adjustments"""

            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            response_text = message.content[0].text

            # Parse response
            import json
            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError:
                analysis = {
                    "interpretation": response_text,
                    "abnormalities": [],
                    "recommendations": [],
                }

            analysis["status"] = "success"
            return analysis

        except Exception as e:
            logger.error(f"Lab analysis error: {str(e)}")
            return {"error": str(e), "status": "error"}


# Global AI service instance
ai_service = AIAnalysisService()
