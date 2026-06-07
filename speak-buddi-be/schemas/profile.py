# speak-buddi-be/schemas/profile.py
# ─── Pydantic schemas cho Profile (S2.3) ──────────────────────────────────────

from pydantic import BaseModel


class UpdateLevelRequest(BaseModel):
    level: str


class UpdateLevelOut(BaseModel):
    level: str               # target_level đã lưu (đã chuẩn hóa upper)
    onboarding_completed: bool


class DeleteAccountRequest(BaseModel):
    confirm_text: str
    password: str | None = None


class DeleteAccountOut(BaseModel):
    message: str
