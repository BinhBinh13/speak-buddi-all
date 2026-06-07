import logging

from core.clients import get_claude_client

log = logging.getLogger("speakbuddi.translate")

_SYSTEM_PROMPT = (
    "You are a professional English-to-Vietnamese translator.\n"
    "Translate the following English text to Vietnamese naturally and accurately.\n"
    "Return ONLY the Vietnamese translation — no explanation, no extra text, no quotes."
)


def translate_text(text: str) -> str:
    """Dịch text tiếng Anh sang tiếng Việt qua Anthropic claude-haiku-4-5."""
    client = get_claude_client()
    log.info("TRANSLATE  len=%d", len(text))
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )
    return message.content[0].text.strip()
