from core.clients import get_elevenlabs_client
from core.config import ELEVENLABS_VOICE_ID


def text_to_audio_bytes(text: str) -> bytes:
    client = get_elevenlabs_client()
    audio_chunks = client.text_to_speech.convert(
        voice_id=ELEVENLABS_VOICE_ID,
        text=text,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    return b"".join(audio_chunks)
