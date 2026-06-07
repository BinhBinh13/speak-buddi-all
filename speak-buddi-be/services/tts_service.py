from core.clients import get_elevenlabs_client
from core.config import ELEVENLABS_VOICE_ID


def text_to_audio_bytes(
    text: str,
    voice_id: str | None = None,
    model_id: str | None = None,
) -> bytes:
    client = get_elevenlabs_client()
    audio_chunks = client.text_to_speech.convert(
        voice_id=voice_id or ELEVENLABS_VOICE_ID,
        text=text,
        model_id=model_id or "eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    return b"".join(audio_chunks)
