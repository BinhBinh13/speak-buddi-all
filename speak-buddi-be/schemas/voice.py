# speak-buddi-be/schemas/voice.py
# ─── Pydantic schemas cho Voice settings (S8.4) ────────────────────────────────

from pydantic import BaseModel


class VoiceModelOut(BaseModel):
    id: str
    voice_id: str
    model_id: str
    display_name: str
    accent: str | None = None
    gender: str | None = None
    is_pro: bool = False


class VoicePreferenceOut(BaseModel):
    voice_model_id: str | None = None
    voice: VoiceModelOut | None = None


class SetVoicePreferenceRequest(BaseModel):
    voice_model_id: str
