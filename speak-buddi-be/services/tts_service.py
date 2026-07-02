import logging

from core.clients import get_elevenlabs_client
from core.config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

log = logging.getLogger("speakbuddi.tts")


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
        log.error(
            "TTS_FAIL  voice_id=%s  model_id=%s  error_type=%s  error=%s",
            used_voice, used_model, type(exc).__name__, exc,
            exc_info=True,
        )
        raise
