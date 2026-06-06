from datetime import datetime

from pydantic import BaseModel


class TranslateRequest(BaseModel):
    text: str


class TranslateResponse(BaseModel):
    translation: str


# ── S5.2 — History schemas ────────────────────────────────────────────────────

class TranslationHistoryItem(BaseModel):
    id: str
    source_text: str
    target_text: str
    created_at: datetime


class TranslationHistoryResponse(BaseModel):
    items: list[TranslationHistoryItem]
