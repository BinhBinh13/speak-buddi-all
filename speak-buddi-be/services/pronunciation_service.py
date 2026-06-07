# speak-buddi-be/services/pronunciation_service.py
# ─── Service chấm phát âm: gọi Anthropic (claude-haiku-4-5), parse JSON (S6.2) ─
#
# Phương án A: SpeechRecognition (FE) lấy transcript → Anthropic (BE) chấm.
# Anthropic nhận target_text + transcript, trả JSON breakdown âm tiết +
# điểm overall/accuracy/fluency + feedback tiếng Việt.
#
# Không log transcript đầy đủ — chỉ log target word + độ dài (§4.5).
# ─────────────────────────────────────────────────────────────────────────────

import json
import logging
import re

from core.clients import get_claude_client

log = logging.getLogger("speakbuddi.pronunciation")

_SYSTEM_PROMPT = """You are a Vietnamese English pronunciation coach.

Task: Evaluate the user's pronunciation by comparing their spoken transcript to the target word/phrase.

Instructions:
- Compare "transcript" with "target_text" carefully.
- Score each syllable of the TARGET word independently (not the transcript).
- Provide scores from 0 to 100 for: overall, accuracy (how close transcript matches target), fluency (smoothness/naturalness).
- Write feedback in Vietnamese (≤ 2 sentences), mentioning specific syllables to improve if any.

CRITICAL: Respond ONLY with valid JSON. No markdown, no code blocks, no extra text.
Format:
{
  "overall": <number 0-100>,
  "accuracy": <number 0-100>,
  "fluency": <number 0-100>,
  "syllables": [{"text": "<syllable>", "score": <number 0-100>}, ...],
  "feedback": "<Vietnamese feedback, max 2 sentences>"
}"""


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    """Clamp giá trị về [lo, hi] — đề phòng Anthropic trả ngoài khoảng."""
    return max(lo, min(hi, float(value)))


def score_pronunciation(target_text: str, transcript: str) -> dict:
    """Gọi Anthropic để chấm phát âm, trả dict đã parse + clamp.

    Raises:
        Exception: nếu Anthropic lỗi hoặc JSON parse thất bại — caller bắt → 502.

    Không log transcript đầy đủ (§4.5); chỉ log target + len(transcript).
    """
    log.info(
        "SCORE_PRONUNCIATION  target=%r  transcript_len=%d",
        target_text,
        len(transcript),
    )

    user_msg = json.dumps(
        {"target_text": target_text, "transcript": transcript},
        ensure_ascii=False,
    )

    client  = get_claude_client()
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = message.content[0].text.strip()

    # Parse phòng thủ: trích phần {...} đầu tiên trong chuỗi trả về.
    # Anthropic đôi khi bọc trong ```json ... ``` hoặc kèm văn bản giải thích.
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in model response (len={len(raw)})")
    raw = match.group(0)

    data = json.loads(raw)   # raises json.JSONDecodeError → caller bắt → 502

    # Clamp tất cả điểm về [0, 100]
    result = {
        "overall":   _clamp(data.get("overall",  0)),
        "accuracy":  _clamp(data.get("accuracy", 0)),
        "fluency":   _clamp(data.get("fluency",  0)),
        "syllables": [
            {"text": s["text"], "score": _clamp(s.get("score", 0))}
            for s in data.get("syllables", [])
        ],
        "feedback": str(data.get("feedback", "")),
    }

    log.info(
        "SCORE_RESULT  target=%r  overall=%.1f  accuracy=%.1f  fluency=%.1f",
        target_text,
        result["overall"],
        result["accuracy"],
        result["fluency"],
    )
    return result
