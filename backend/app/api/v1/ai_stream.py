"""
AI Streaming API - Server-Sent Events (SSE) for real-time AI responses
Provides streaming endpoints for multi-model AI analysis with heartbeat support
"""

import asyncio
import json
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models import User
from app.services.ai_service import get_ai_service, AIServiceError
from app.core.config import settings
from app.core.logging import logger

router = APIRouter()


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

from pydantic import BaseModel


class StreamMessageRequest(BaseModel):
    """Request body for streaming AI message"""
    model: str
    messages: list[Dict[str, str]]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "model": "claude-3-5-sonnet-20241022",
                "messages": [
                    {"role": "user", "content": "Analyze this skin condition..."}
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
                "system_prompt": "You are a dermatology expert."
            }
        }


class GetAvailableModelsResponse(BaseModel):
    """Response with available AI models"""
    available_models: list[str]
    default_model: str


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def generate_sse_stream(
    ai_service,
    model: str,
    messages: list[Dict[str, str]],
    temperature: Optional[float],
    max_tokens: Optional[int],
    system_prompt: Optional[str],
):
    """
    Generate Server-Sent Events stream from AI model.

    Yields SSE-formatted chunks with heartbeat support.
    """
    heartbeat_interval = settings.STREAMING_HEARTBEAT_INTERVAL_SECONDS
    last_heartbeat = 0
    chunk_count = 0

    try:
        # Send initial metadata event
        yield f"data: {json.dumps({'type': 'start', 'model': model, 'timestamp': __import__('datetime').datetime.utcnow().isoformat()})}\n\n"

        # Stream from AI service
        start_time = asyncio.get_event_loop().time()

        async for chunk in ai_service.stream_message(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            system_prompt=system_prompt,
        ):
            if chunk:
                # Send data chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                chunk_count += 1

            # Send periodic heartbeat to keep connection alive
            current_time = asyncio.get_event_loop().time()
            if current_time - last_heartbeat >= heartbeat_interval:
                yield f"data: {json.dumps({'type': 'heartbeat', 'chunks_received': chunk_count})}\n\n"
                last_heartbeat = current_time

        # Send completion event
        elapsed_time = asyncio.get_event_loop().time() - start_time
        yield f"data: {json.dumps({'type': 'complete', 'chunks': chunk_count, 'elapsed_seconds': elapsed_time})}\n\n"

    except asyncio.TimeoutError:
        error_msg = f"Request to {model} timed out after {settings.AI_MODEL_REQUEST_TIMEOUT_SECONDS}s"
        logger.error(error_msg)
        yield f"data: {json.dumps({'type': 'error', 'error': 'timeout', 'message': error_msg})}\n\n"

    except AIServiceError as e:
        logger.error(f"AI Service error: {str(e)}")
        yield f"data: {json.dumps({'type': 'error', 'error': 'service_error', 'message': str(e)})}\n\n"

    except Exception as e:
        logger.error(f"Unexpected error in stream: {str(e)}")
        yield f"data: {json.dumps({'type': 'error', 'error': 'unknown_error', 'message': 'An unexpected error occurred'})}\n\n"


# ============================================================================
# STREAMING ENDPOINTS
# ============================================================================

@router.get(
    "/models",
    response_model=GetAvailableModelsResponse,
    summary="Get available AI models",
    tags=["AI Streaming"],
)
async def get_available_models(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get list of available AI models based on configured API keys.

    Returns the available models and the default model.
    """
    try:
        ai_service = get_ai_service()
        available_models = ai_service.get_available_models()

        return GetAvailableModelsResponse(
            available_models=available_models,
            default_model=settings.DEFAULT_AI_MODEL,
        )
    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get available models"
        )


@router.post(
    "/stream",
    summary="Stream AI response via Server-Sent Events",
    tags=["AI Streaming"],
)
async def stream_ai_response(
    request: StreamMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Stream AI response via Server-Sent Events (SSE).

    Request body contains:
    - model: AI model identifier (e.g., "claude-3-5-sonnet-20241022")
    - messages: List of message dicts with 'role' and 'content'
    - temperature: Sampling temperature (0.0-2.0, optional)
    - max_tokens: Maximum tokens in response (optional)
    - system_prompt: System prompt for model behavior (optional)

    Response is streamed as Server-Sent Events with the following event types:
    - start: Initial metadata (model, timestamp)
    - chunk: Content chunk from AI model
    - heartbeat: Periodic heartbeat to keep connection alive
    - complete: Final event with statistics
    - error: Error event if something goes wrong

    Example client code:
    ```javascript
    const eventSource = new EventSource('/api/v1/ai-stream/stream');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chunk') {
        // Add content to UI
        console.log(data.content);
      } else if (data.type === 'error') {
        console.error(data.message);
        eventSource.close();
      }
    };
    ```
    """
    try:
        # Validate model
        ai_service = get_ai_service()
        if not ai_service.validate_model(request.model):
            available = ai_service.get_available_models()
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid model",
                    "available_models": available
                }
            )

        # Log the request
        logger.info(
            f"Streaming AI request from user {current_user.email}: "
            f"model={request.model}, "
            f"messages={len(request.messages)}"
        )

        # Create streaming response
        return StreamingResponse(
            generate_sse_stream(
                ai_service=ai_service,
                model=request.model,
                messages=request.messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                system_prompt=request.system_prompt,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable proxy buffering
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in stream endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to stream AI response"
        )


@router.post(
    "/validate-model",
    summary="Validate if a model is available",
    tags=["AI Streaming"],
)
async def validate_model(
    model: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Check if a specific AI model is available.

    Returns whether the model is available for use.
    """
    try:
        ai_service = get_ai_service()
        is_valid = ai_service.validate_model(model)

        return {
            "model": model,
            "valid": is_valid,
            "available_models": ai_service.get_available_models() if not is_valid else None,
        }
    except Exception as e:
        logger.error(f"Error validating model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to validate model"
        )
