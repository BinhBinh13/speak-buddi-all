# speak-buddi-be/schemas/support.py
# ─── Pydantic schemas cho form liên hệ / hỗ trợ (S12.3) ─────────────────────

from pydantic import BaseModel, Field

SUBJECT_CHOICES = frozenset({"account", "payment", "ai", "technical", "other"})

SUBJECT_LABELS: dict[str, str] = {
    "account":   "Tài khoản",
    "payment":   "Thanh toán & gói Pro",
    "ai":        "Hội thoại AI",
    "technical": "Lỗi kỹ thuật",
    "other":     "Khác",
}


class ContactRequest(BaseModel):
    name:    str = Field(max_length=100)
    email:   str = Field(max_length=255)
    subject: str = Field(max_length=120)
    message: str = Field(max_length=2000)
    website: str | None = Field(default=None, max_length=200)


class ContactResponse(BaseModel):
    message: str
