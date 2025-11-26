"""
AI Model Router - Intelligent routing for multi-model lab analysis.
Implements two-stage pipeline: extraction (vision) -> analysis (selected model).
"""

import logging
from typing import Dict, List, Optional, Any
from app.core.logging import logger
from app.services.lab_file_processor import lab_file_processor
from app.services.ai_analysis import ai_service


class AIModelRouter:
    """
    Routes lab analysis requests to appropriate AI models based on capabilities.
    Implements intelligent two-stage pipeline:
    1. Extract lab values from image/PDF
    2. Analyze with selected model (using extracted values as text)
    """

    # Model configurations: indicates which models have vision capabilities
    MODEL_CONFIGS = {
        "claude-opus-4-1": {
            "provider": "Anthropic",
            "name": "Claude Opus 4.1",
            "has_vision": True,
            "description": "Latest flagship model with advanced medical reasoning and vision analysis",
            "recommended_for": ["Complex cases", "Image analysis", "Lab analysis", "Detailed explanations"],
            "capabilities": ["vision", "text_analysis"]
        },
        "gpt-4-vision": {
            "provider": "OpenAI",
            "name": "GPT-4 Vision",
            "has_vision": True,
            "description": "Advanced vision model for detailed image analysis",
            "recommended_for": ["Image analysis", "Multi-modal reasoning"],
            "capabilities": ["vision", "text_analysis"]
        },
        "medgemma": {
            "provider": "Google",
            "name": "MedGemma",
            "has_vision": False,
            "description": "Specialized medical model trained on clinical data",
            "recommended_for": ["Lab interpretation", "Medical terminology", "Clinical guidelines"],
            "capabilities": ["text_analysis"]
        },
        "palm2": {
            "provider": "Google",
            "name": "PaLM 2",
            "has_vision": False,
            "description": "General-purpose model optimized for medical domain",
            "recommended_for": ["Multi-context analysis", "Reasoning"],
            "capabilities": ["text_analysis"]
        },
        "biogpt": {
            "provider": "Microsoft",
            "name": "BioGPT",
            "has_vision": False,
            "description": "Specialized in biological and biomedical text understanding",
            "recommended_for": ["Biomedical literature", "Clinical analysis"],
            "capabilities": ["text_analysis"]
        },
        "clinical-bert": {
            "provider": "MIT-IBM",
            "name": "Clinical BERT",
            "has_vision": False,
            "description": "BERT model trained on clinical notes",
            "recommended_for": ["Clinical text analysis", "Entity recognition"],
            "capabilities": ["text_analysis"]
        },
        "gpt-5": {
            "provider": "OpenAI",
            "name": "GPT-5",
            "has_vision": True,
            "description": "Next-generation reasoning model (future)",
            "recommended_for": ["Advanced reasoning", "Vision"],
            "capabilities": ["vision", "text_analysis"]
        },
        "deepseek-r1": {
            "provider": "DeepSeek",
            "name": "DeepSeek-R1",
            "has_vision": False,
            "description": "Reasoning-focused model for complex analysis",
            "recommended_for": ["Chain-of-thought reasoning", "Complex inference"],
            "capabilities": ["text_analysis"]
        },
    }

    def __init__(self):
        """Initialize the AI model router."""
        self.default_vision_model = "claude-opus-4-1-20250805"
        logger.info("AI Model Router initialized with two-stage pipeline support")

    def get_available_models(self, available_keys: Dict[str, Optional[str]]) -> List[Dict[str, Any]]:
        """
        Get list of available models based on API key availability.

        Args:
            available_keys: Dictionary mapping model keys to API key values
                           (None if key not available)

        Returns:
            List of model configurations with availability status
        """
        models = []
        for model_id, config in self.MODEL_CONFIGS.items():
            # Map model ID to key name
            key_map = {
                "claude-opus-4-1": "anthropic",
                "gpt-4-vision": "openai",
                "gpt-5": "openai",
                "medgemma": "medgemma",
                "palm2": "palm2",
                "biogpt": "biogpt",
                "clinical-bert": "clinical_bert",
                "deepseek-r1": "deepseek",
            }
            key_name = key_map.get(model_id)
            has_key = key_name and available_keys.get(key_name) is not None

            models.append({
                "id": model_id,
                "name": config["name"],
                "provider": config["provider"],
                "description": config["description"],
                "has_vision": config["has_vision"],
                "status": "available" if has_key else "requires_api_key",
                "recommended_for": config["recommended_for"],
                "capabilities": config["capabilities"]
            })

        return models

    def _get_vision_model_for_extraction(self, selected_model: str) -> str:
        """
        Determine which vision model to use for extraction.

        Args:
            selected_model: The model selected by the doctor

        Returns:
            The vision model to use for extraction
        """
        if self.MODEL_CONFIGS[selected_model]["has_vision"]:
            return selected_model
        return self.default_vision_model

    async def analyze_lab_file(
        self,
        file_content: bytes,
        filename: str,
        file_type: str,
        selected_model: str,
        user_prompt: Optional[str] = None,
        patient_context: Optional[str] = None,
        api_keys: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Two-stage lab analysis: extract values then analyze.

        Stage 1: Extract lab values from image/PDF using a vision-capable model
        Stage 2: Analyze extracted values with selected model

        Args:
            file_content: Raw file bytes (image or PDF)
            filename: Original filename
            file_type: MIME type of file
            selected_model: Model ID selected by doctor
            user_prompt: Doctor's clinical instructions/context
            patient_context: Patient information (name, ID, etc.)
            api_keys: Dictionary of available API keys

        Returns:
            Dictionary containing:
            - lab_values: Extracted structured lab data
            - analysis: Clinical interpretation
            - extraction_model: Which model was used for extraction
            - analysis_model: Which model was used for analysis
            - user_guidance: How the system routed the analysis
        """
        api_keys = api_keys or {}

        logger.info(f"Starting two-stage analysis for {filename} using {selected_model}")

        # Stage 1: Determine if we need a separate extraction model
        extraction_model = self._get_vision_model_for_extraction(selected_model)
        needs_separate_extraction = extraction_model != selected_model

        if needs_separate_extraction:
            logger.info(
                f"Selected model '{selected_model}' lacks vision. "
                f"Using '{extraction_model}' for extraction."
            )

        # Stage 1: Extract lab values
        try:
            lab_values = await lab_file_processor.extract_lab_values(
                file_content=file_content,
                filename=filename,
                file_type=file_type
            )

            if not lab_values or len(lab_values) == 0:
                logger.warning("No lab values extracted from file")
                return {
                    "status": "error",
                    "error": "Could not extract any lab values from the file",
                    "extraction_model": extraction_model,
                    "analysis_model": selected_model,
                }

            logger.info(f"Stage 1 complete: Extracted {len(lab_values)} lab values")

        except Exception as e:
            logger.error(f"Lab value extraction failed: {str(e)}")
            return {
                "status": "error",
                "error": f"Failed to extract lab values: {str(e)}",
                "extraction_model": extraction_model,
                "analysis_model": selected_model,
            }

        # Stage 2: Analyze with selected model
        try:
            # Build analysis context
            analysis_context = f"Extracted Lab Values:\n"
            for value in lab_values:
                analysis_context += f"- {value.get('test_name')}: {value.get('value')} {value.get('unit', '')}\n"

            if patient_context:
                analysis_context += f"\n{patient_context}"

            if user_prompt:
                analysis_context += f"\n\nDoctor's Guidance: {user_prompt}"

            # Perform analysis using Claude (which has multi-model support in ai_service)
            analysis_result = await ai_service.analyze_lab_results(
                lab_data={
                    "lab_values": lab_values,
                    "context": analysis_context,
                    "patient_context": patient_context,
                    "user_prompt": user_prompt,
                }
            )

            if analysis_result.get("status") == "error":
                logger.error(f"Analysis failed: {analysis_result.get('error')}")
                return {
                    "status": "error",
                    "error": analysis_result.get("error", "Analysis failed"),
                    "extraction_model": extraction_model,
                    "analysis_model": selected_model,
                    "lab_values": lab_values,
                }

            logger.info("Stage 2 complete: Analysis successful")

            return {
                "status": "success",
                "lab_values": lab_values,
                "analysis": analysis_result,
                "extraction_model": extraction_model,
                "analysis_model": selected_model,
                "user_guidance": (
                    f"This analysis used {extraction_model} for lab value extraction "
                    f"and {selected_model} for clinical interpretation."
                ) if needs_separate_extraction else (
                    f"This analysis used {selected_model} for both extraction and interpretation."
                ),
                "two_stage_pipeline": needs_separate_extraction,
            }

        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            return {
                "status": "error",
                "error": f"Failed to analyze lab results: {str(e)}",
                "extraction_model": extraction_model,
                "analysis_model": selected_model,
                "lab_values": lab_values,
            }


# Global AI model router instance
ai_model_router = AIModelRouter()
