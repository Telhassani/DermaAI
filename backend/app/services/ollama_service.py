"""
Ollama Service - Local AI model integration
Provides access to locally-running Ollama models including vision-capable models like LLaVA
"""

import httpx
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
import json

logger = logging.getLogger(__name__)


class OllamaService:
    """Service for interacting with local Ollama models"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)
        
    async def is_available(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama not available: {e}")
            return False
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List all available Ollama models"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return data.get("models", [])
            return []
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
            return []
    
    def is_vision_model(self, model_name: str) -> bool:
        """Check if a model supports vision/image input"""
        vision_keywords = ["vision", "llava", "bakllava", "moondream"]
        return any(keyword in model_name.lower() for keyword in vision_keywords)
    
    async def get_vision_models(self) -> List[str]:
        """Get list of vision-capable models"""
        models = await self.list_models()
        return [
            model["name"] 
            for model in models 
            if self.is_vision_model(model["name"])
        ]
    
    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion from Ollama
        
        Args:
            model: Model name (e.g., "llava:latest")
            messages: List of message dicts with role and content
            temperature: Sampling temperature
            
        Yields:
            Text chunks from the model
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": True,
                "options": {
                    "temperature": temperature,
                }
            }
            
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json=payload,
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "message" in data:
                                content = data["message"].get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            raise
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Global instance
ollama_service = OllamaService()
