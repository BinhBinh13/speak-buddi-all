import logging

import requests

from core.clients import get_claude_client
from core.config import ANTHROPIC_MODEL, MIMO_API_KEY, MIMO_MODEL

log = logging.getLogger("speakbuddi.translate")

_MYMEMORY_URL = "https://api.mymemory.translated.net/get"

_MIMO_URL = "https://api.xiaomimimo.com/v1/chat/completions"
_TRANSLATE_SYSTEM_PROMPT = (
    "You are a professional English-to-Vietnamese translator.\n"
    "Translate the following English text to Vietnamese naturally and accurately.\n"
    "Return ONLY the Vietnamese translation — no explanation, no extra text, no quotes."
)


def _translate_word_mymemory(word: str) -> str:
    """Dịch 1 từ qua MyMemory API (free, không cần key)."""
    resp = requests.get(
        _MYMEMORY_URL,
        params={"q": word, "langpair": "en|vi"},
        timeout=5,
    )
    resp.raise_for_status()
    translation = resp.json().get("responseData", {}).get("translatedText", "")
    if not translation:
        raise ValueError("MyMemory returned empty translation")
    return translation


def _translate_sentence_anthropic(text: str) -> str:
    """Dịch câu/đoạn qua Anthropic Claude (fallback khi MiMo lỗi)."""
    client = get_claude_client()
    log.info("TRANSLATE  engine=anthropic  model=%s", ANTHROPIC_MODEL)
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=500,
        system=_TRANSLATE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )
    translation = response.content[0].text.strip()
    if not translation:
        raise ValueError("Anthropic returned empty translation")
    return translation


def _translate_sentence_mimo(text: str) -> str:
    """Dịch câu/đoạn qua Xiaomi MiMo API (OpenAI-compatible)."""
    if not MIMO_API_KEY:
        raise RuntimeError("MIMO_API_KEY not set in .env")
    resp = requests.post(
        _MIMO_URL,
        headers={"Authorization": f"Bearer {MIMO_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": MIMO_MODEL,
            "messages": [
                {"role": "system", "content": _TRANSLATE_SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            "max_completion_tokens": 500,
        },
        timeout=15,
    )
    if not resp.ok:
        log.error("MIMO_HTTP_ERROR  status=%d  body=%s", resp.status_code, resp.text[:200])
    resp.raise_for_status()
    translation = resp.json()["choices"][0]["message"]["content"].strip()
    if not translation:
        raise ValueError("MiMo returned empty translation")
    return translation


def _translate_sentence(text: str) -> str:
    """Dịch câu/đoạn: ưu tiên MiMo, fallback Anthropic khi MiMo lỗi hoặc chưa cấu hình."""
    if MIMO_API_KEY:
        try:
            return _translate_sentence_mimo(text)
        except Exception as exc:
            log.warning("MIMO_FALLBACK  %s — falling back to Anthropic", exc)
    else:
        log.info("MIMO_SKIP  no API key — using Anthropic")

    return _translate_sentence_anthropic(text)


def translate_text(text: str) -> str:
    """Dịch text tiếng Anh sang tiếng Việt.
    1 từ → MyMemory API (free); nhiều từ/câu → MiMo, fallback Anthropic.
    """
    is_single_word = len(text.strip().split()) == 1
    engine = "mymemory" if is_single_word else "mimo"
    log.info("TRANSLATE  words=%d  engine=%s", len(text.split()), engine)

    if is_single_word:
        try:
            return _translate_word_mymemory(text.strip())
        except Exception as exc:
            log.warning("MYMEMORY_FALLBACK  %s — falling back to MiMo/Anthropic", exc)
            return _translate_sentence(text)

    return _translate_sentence(text)
