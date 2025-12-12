"""
AI Service - Handles multi-model AI requests with streaming support
Supports Claude (Anthropic), GPT (OpenAI), and Ollama (Local)
"""

import asyncio
import json
import logging
from typing import AsyncGenerator, Optional, Dict, Any
from enum import Enum

from anthropic import Anthropic, AsyncAnthropic
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logging import logger
from app.core.retry_handler import retry_async, RetryConfig
from app.services.ollama_service import ollama_service

# ============================================================================
# Models & Enums
# ============================================================================


class AIModel(str, Enum):
    """Available AI models"""
    # Claude 4.5 models (latest - recommended)
    CLAUDE_OPUS_4_5 = "claude-opus-4-5-20251101"
    CLAUDE_SONNET_4_5 = "claude-sonnet-4-5-20250929"
    CLAUDE_HAIKU_4_5 = "claude-haiku-4-5-20251001"

    # Claude 3.x models (legacy)
    CLAUDE_HAIKU_3_5 = "claude-3-5-haiku-20241022"
    CLAUDE_SONNET_3_7 = "claude-3-7-sonnet-20250219"
    CLAUDE_HAIKU_3 = "claude-3-haiku-20240307"

    # OpenAI models
    GPT_4_TURBO = "gpt-4-turbo"
    GPT_4O = "gpt-4o"

    @classmethod
    def is_valid(cls, model: str) -> bool:
        """Check if model is available"""
        try:
            cls(model)
            return True
        except ValueError:
            return False


class AIServiceError(Exception):
    """AI Service specific exception"""
    pass


# ============================================================================
# AI Service
# ============================================================================


class AIService:
    """Multi-model AI service with streaming support"""

    def __init__(self):
        """Initialize AI service with available models"""
        self.logger = logger
        self._validate_api_keys()
        self.anthropic_client = AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY
        ) if settings.ANTHROPIC_API_KEY else None
        self.openai_client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY
        ) if settings.OPENAI_API_KEY else None

    def _validate_api_keys(self) -> None:
        """Validate that at least one AI API key is configured"""
        if not settings.ANTHROPIC_API_KEY and not settings.OPENAI_API_KEY:
            raise AIServiceError(
                "No AI API keys configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY"
            )

    async def get_available_models(self) -> list[str]:
        """Get list of available models based on configured API keys and Ollama availability"""
        available = []

        # Add Claude models if Anthropic key is available
        # All Claude models support vision/images
        if settings.ANTHROPIC_API_KEY:
            available.extend([
                # Claude 4.5 models (recommended for vision)
                AIModel.CLAUDE_SONNET_4_5.value,
                AIModel.CLAUDE_HAIKU_4_5.value,
                AIModel.CLAUDE_OPUS_4_5.value,
                # Claude 3.x models (legacy, still support vision)
                AIModel.CLAUDE_HAIKU_3_5.value,
                AIModel.CLAUDE_SONNET_3_7.value,
                AIModel.CLAUDE_HAIKU_3.value,
            ])

        # Add Ollama models if enabled and available
        if settings.OLLAMA_ENABLED:
            try:
                if await ollama_service.is_available():
                    # Only add vision-capable Ollama models
                    vision_models = await ollama_service.get_vision_models()
                    available.extend(vision_models)
                    logger.info(f"Added {len(vision_models)} Ollama vision models")
            except Exception as e:
                logger.warning(f"Failed to get Ollama models: {e}")

        # Note: GPT models removed - use Claude for vision tasks
        # GPT-4 Vision support is inconsistent with our message format

        return available

    async def validate_model(self, model: str) -> bool:
        """Validate if model is available for current configuration"""
        available = await self.get_available_models()
        return model in available

    async def send_message(
        self,
        model: str,
        messages: list[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Send message to AI model and get response.

        Args:
            model: Model identifier
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens in response
            system_prompt: System prompt to set model behavior

        Returns:
            Model response text
        """
        if not await self.validate_model(model):
            available = await self.get_available_models()
            raise AIServiceError(
                f"Model {model} not available. Available: {available}"
            )

        # Use defaults from config if not provided
        temperature = temperature or settings.AI_MODEL_TEMPERATURE
        max_tokens = max_tokens or settings.AI_MODEL_MAX_TOKENS

        try:
            # Route to appropriate provider
            if model.startswith('claude-'):
                return await self._send_claude_message(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt,
                )
            elif model in [AIModel.GPT_4_TURBO.value, AIModel.GPT_4O.value]:
                return await self._send_gpt_message(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt,
                )
            else:
                raise AIServiceError(f"Unknown model: {model}")

        except asyncio.TimeoutError:
            raise AIServiceError(
                f"Request to {model} timed out after {settings.AI_MODEL_REQUEST_TIMEOUT_SECONDS}s"
            )
        except Exception as e:
            self.logger.error(f"Error calling {model}: {str(e)}")
            raise AIServiceError(f"Error calling {model}: {str(e)}")

    async def stream_message(
        self,
        model: str,
        messages: list[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,

        system_prompt: Optional[str] = None,
        api_keys: Optional[Dict[str, Optional[str]]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream message from AI model.

        Args:
            model: Model identifier
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens in response
            system_prompt: System prompt to set model behavior

        Yields:
            Streaming response chunks
        """
        if not await self.validate_model(model):
            available = await self.get_available_models()
            raise AIServiceError(
                f"Model {model} not available. Available: {available}"
            )

        # Use defaults from config if not provided
        temperature = temperature or settings.AI_MODEL_TEMPERATURE
        max_tokens = max_tokens or settings.AI_MODEL_MAX_TOKENS

        try:
            # Route to appropriate provider
            if model.startswith('claude-'):
                async for chunk in self._stream_claude_message(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt,
                    api_key=api_keys.get("anthropic") if api_keys else None,
                ):
                    yield chunk
            elif model in [AIModel.GPT_4_TURBO.value, AIModel.GPT_4O.value]:
                async for chunk in self._stream_gpt_message(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt,
                    api_key=api_keys.get("openai") if api_keys else None,
                ):
                    yield chunk
            else:
                # Try Ollama for unknown models
                async for chunk in self._stream_ollama_message(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    system_prompt=system_prompt,
                ):
                    yield chunk

        except asyncio.TimeoutError:
            raise AIServiceError(
                f"Stream from {model} timed out after {settings.AI_MODEL_REQUEST_TIMEOUT_SECONDS}s"
            )
        except Exception as e:
            self.logger.error(f"Error streaming from {model}: {str(e)}")
            raise AIServiceError(f"Error streaming from {model}: {str(e)}")

    async def _send_claude_message(
        self,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
    ) -> str:
        """Send message to Claude model"""
        if not self.anthropic_client:
            raise AIServiceError("Anthropic client not initialized")

        try:
            response = await asyncio.wait_for(
                self.anthropic_client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt or "You are a helpful medical AI assistant.",
                    messages=messages,
                ),
                timeout=settings.AI_MODEL_REQUEST_TIMEOUT_SECONDS,
            )
            return response.content[0].text
        except asyncio.TimeoutError:
            raise
        except Exception as e:
            raise AIServiceError(f"Claude API error: {str(e)}")

    async def _stream_claude_message(
        self,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
        api_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream message from Claude model"""
        client = self.anthropic_client
        # Only use provided API key if it's not empty/None
        if api_key and api_key.strip():
            client = AsyncAnthropic(api_key=api_key)

        if not client:
            raise AIServiceError("Anthropic client not initialized and no API key provided")

        try:
            async with client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt or "You are a helpful medical AI assistant.",
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except asyncio.TimeoutError:
            raise
        except Exception as e:
            raise AIServiceError(f"Claude streaming error: {str(e)}")

    async def _send_gpt_message(
        self,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
    ) -> str:
        """Send message to GPT model"""
        if not self.openai_client:
            raise AIServiceError("OpenAI client not initialized")

        try:
            response = await asyncio.wait_for(
                self.openai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": system_prompt or "You are a helpful medical AI assistant.",
                        },
                        *messages,
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                ),
                timeout=settings.AI_MODEL_REQUEST_TIMEOUT_SECONDS,
            )
            return response.choices[0].message.content or ""
        except asyncio.TimeoutError:
            raise
        except Exception as e:
            raise AIServiceError(f"GPT API error: {str(e)}")

    async def _stream_gpt_message(
        self,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
        api_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream message from GPT model"""
        client = self.openai_client
        # Only use provided API key if it's not empty/None
        if api_key and api_key.strip():
            client = AsyncOpenAI(api_key=api_key)

        if not client:
            raise AIServiceError("OpenAI client not initialized and no API key provided")

        try:
            stream = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": system_prompt or "You are a helpful medical AI assistant.",
                        },
                        *messages,
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                ),
                timeout=settings.AI_MODEL_REQUEST_TIMEOUT_SECONDS,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except asyncio.TimeoutError:
            raise
        except Exception as e:
            raise AIServiceError(f"GPT streaming error: {str(e)}")

    async def _stream_ollama_message(
        self,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        system_prompt: Optional[str],
    ) -> AsyncGenerator[str, None]:
        """Stream message from Ollama model"""
        try:
            # Add system prompt to messages if provided
            ollama_messages = []
            if system_prompt:
                ollama_messages.append({
                    "role": "system",
                    "content": system_prompt
                })
            ollama_messages.extend(messages)

            async for chunk in ollama_service.stream_chat(
                model=model,
                messages=ollama_messages,
                temperature=temperature,
            ):
                yield chunk
        except Exception as e:
            raise AIServiceError(f"Ollama streaming error: {str(e)}")


# Global service instance
_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    """Get or create AI service singleton"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
