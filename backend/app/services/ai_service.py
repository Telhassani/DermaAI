"""
AI Service - Handles multi-model AI requests with streaming support
Supports Claude (Anthropic), GPT (OpenAI), and other models
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

# ============================================================================
# Models & Enums
# ============================================================================


class AIModel(str, Enum):
    """Available AI models"""
    CLAUDE_OPUS = "claude-3-opus-20250219"
    CLAUDE_SONNET = "claude-3-5-sonnet-20241022"
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

    def get_available_models(self) -> list[str]:
        """Get list of available models based on configured API keys"""
        available = []

        # Add Claude models if Anthropic key is available
        if settings.ANTHROPIC_API_KEY:
            available.extend([
                AIModel.CLAUDE_OPUS.value,
                AIModel.CLAUDE_SONNET.value,
            ])

        # Add GPT models if OpenAI key is available
        if settings.OPENAI_API_KEY:
            available.extend([
                AIModel.GPT_4_TURBO.value,
                AIModel.GPT_4O.value,
            ])

        return available

    def validate_model(self, model: str) -> bool:
        """Validate if model is available for current configuration"""
        return model in self.get_available_models()

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
        if not self.validate_model(model):
            available = self.get_available_models()
            raise AIServiceError(
                f"Model {model} not available. Available: {available}"
            )

        # Use defaults from config if not provided
        temperature = temperature or settings.AI_MODEL_TEMPERATURE
        max_tokens = max_tokens or settings.AI_MODEL_MAX_TOKENS

        try:
            # Route to appropriate provider
            if model in [AIModel.CLAUDE_OPUS.value, AIModel.CLAUDE_SONNET.value]:
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
        if not self.validate_model(model):
            available = self.get_available_models()
            raise AIServiceError(
                f"Model {model} not available. Available: {available}"
            )

        # Use defaults from config if not provided
        temperature = temperature or settings.AI_MODEL_TEMPERATURE
        max_tokens = max_tokens or settings.AI_MODEL_MAX_TOKENS

        try:
            # Route to appropriate provider
            if model in [AIModel.CLAUDE_OPUS.value, AIModel.CLAUDE_SONNET.value]:
                async for chunk in self._stream_claude_message(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt,
                ):
                    yield chunk
            elif model in [AIModel.GPT_4_TURBO.value, AIModel.GPT_4O.value]:
                async for chunk in self._stream_gpt_message(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt,
                ):
                    yield chunk
            else:
                raise AIServiceError(f"Unknown model: {model}")

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
    ) -> AsyncGenerator[str, None]:
        """Stream message from Claude model"""
        if not self.anthropic_client:
            raise AIServiceError("Anthropic client not initialized")

        try:
            async with self.anthropic_client.messages.stream(
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
    ) -> AsyncGenerator[str, None]:
        """Stream message from GPT model"""
        if not self.openai_client:
            raise AIServiceError("OpenAI client not initialized")

        try:
            stream = await asyncio.wait_for(
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


# Global service instance
_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    """Get or create AI service singleton"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
