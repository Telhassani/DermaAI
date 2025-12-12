import asyncio
import os
import sys
from anthropic import AsyncAnthropic

# Add backend directory to path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

async def check_model(client, model_id):
    print(f"Testing model: {model_id}...")
    try:
        response = await client.messages.create(
            model=model_id,
            max_tokens=10,
            messages=[{"role": "user", "content": "Hello"}],
        )
        print(f"✅ Success: {model_id}")
        return True
    except Exception as e:
        print(f"❌ Failed: {model_id} - {e}")
        return False

async def main():
    if not settings.ANTHROPIC_API_KEY:
        print("Error: ANTHROPIC_API_KEY not set in settings.")
        return

    client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    models_to_test = [
        "claude-3-5-sonnet-20241022", # New Sonnet
        "claude-3-5-sonnet-20240620", # Old Sonnet
        "claude-3-opus-20240229",     # Correct Opus
        "claude-3-opus-20250219",     # Current (likely wrong) Opus in code
    ]

    print(f"Checking models with key: {settings.ANTHROPIC_API_KEY[:5]}...")
    
    for model in models_to_test:
        await check_model(client, model)

if __name__ == "__main__":
    asyncio.run(main())
