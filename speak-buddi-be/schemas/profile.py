# speak-buddi-be/schemas/profile.py
# ─── Pydantic schemas cho Profile (S2.3) ──────────────────────────────────────

from pydantic import BaseModel


class UpdateLevelRequest(BaseModel):
    level: str


class UpdateLevelOut(BaseModel):
    level: str               # target_level đã lưu (đã chuẩn hóa upper)
    onboarding_completed: bool
