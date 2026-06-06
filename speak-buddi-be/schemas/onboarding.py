# speak-buddi-be/schemas/onboarding.py
# ─── Pydantic schemas cho Onboarding (S2.1) ───────────────────────────────────

from pydantic import BaseModel


class OnboardingRequest(BaseModel):
    level: str
    topics: list[str] = []           # slug hoặc name của topic đã chọn
    daily_minutes: int = 10
    words_per_session: int = 10


class TopicOut(BaseModel):
    id: str
    name: str
    slug: str


class OnboardingOut(BaseModel):
    level: str
    topics: list[str]
    daily_minutes: int
    words_per_session: int
    onboarding_completed: bool
