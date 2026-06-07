from functools import lru_cache

import anthropic
from google import genai as google_genai
from elevenlabs.client import ElevenLabs

from core.config import ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, GEMINI_API_KEY


@lru_cache(maxsize=1)
def get_claude_client() -> anthropic.Anthropic:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not set in .env")
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


@lru_cache(maxsize=1)
def get_gemini_client() -> google_genai.Client:
    """Trả google.genai.Client đã configure. Cache 1 lần."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in .env")
    return google_genai.Client(api_key=GEMINI_API_KEY)


@lru_cache(maxsize=1)
def get_elevenlabs_client() -> ElevenLabs:
    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY not set in .env")
    return ElevenLabs(api_key=ELEVENLABS_API_KEY)
