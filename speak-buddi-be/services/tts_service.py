import logging

from core.clients import get_elevenlabs_client
from core.config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

log = logging.getLogger("speakbuddi.tts")


def _classify_tts_error(exc: Exception) -> str:
    """Trả chuỗi mô tả nguyên nhân lỗi ElevenLabs để dễ debug."""
    exc_str = str(exc).lower()
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)

    if not ELEVENLABS_API_KEY:
        return "ELEVENLABS_API_KEY chưa được set trong .env"

    if status == 401 or "401" in exc_str or "unauthorized" in exc_str:
        return "API key không hợp lệ hoặc đã hết hạn (401 Unauthorized)"

    if status == 403 or "403" in exc_str or "forbidden" in exc_str:
        return "API key không có quyền dùng tính năng này (403 Forbidden)"

    if status == 429 or "429" in exc_str or "rate limit" in exc_str or "quota" in exc_str:
        return "Đã vượt rate limit hoặc hết quota ElevenLabs (429)"

    if status == 422 or "422" in exc_str:
        return "voice_id không tồn tại hoặc model_id không hợp lệ (422)"

    if "connection" in exc_str or "timeout" in exc_str or "network" in exc_str:
        return "Không kết nối được tới ElevenLabs API (network/timeout)"

    return f"{type(exc).__name__}: {exc}"


def text_to_audio_bytes(
    text: str,
    voice_id: str | None = None,
    model_id: str | None = None,
) -> bytes:
    used_voice = voice_id or ELEVENLABS_VOICE_ID
    used_model = model_id or "eleven_multilingual_v2"

    log.info(
        "TTS_CALL  chars=%d  voice_id=%s  model_id=%s  api_key_set=%s",
        len(text), used_voice, used_model, bool(ELEVENLABS_API_KEY),
    )

    try:
        client = get_elevenlabs_client()
        audio_chunks = client.text_to_speech.convert(
            voice_id=used_voice,
            text=text,
            model_id=used_model,
            output_format="mp3_44100_128",
        )
        result = b"".join(audio_chunks)
        log.info("TTS_OK  bytes=%d", len(result))
        return result
    except Exception as exc:
        reason = _classify_tts_error(exc)
        log.error("TTS_FAIL  reason=%s  voice_id=%s  model_id=%s", reason, used_voice, used_model)
        # Gắn reason vào exception để caller có thể đưa vào response
        exc.tts_reason = reason  # type: ignore[attr-defined]
        raise
