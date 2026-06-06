from functools import lru_cache

import anthropic
from elevenlabs.client import ElevenLabs

from core.config import ANTHROPIC_API_KEY, ELEVENLABS_API_KEY


@lru_cache(maxsize=1)
def get_claude_client() -> anthropic.Anthropic:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not set in .env")
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


@lru_cache(maxsize=1)
def get_elevenlabs_client() -> ElevenLabs:
    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY not set in .env")
    return ElevenLabs(api_key=ELEVENLABS_API_KEY)
