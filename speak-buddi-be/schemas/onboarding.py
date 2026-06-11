# speak-buddi-be/schemas/onboarding.py
# ─── Pydantic schemas cho Onboarding (S2.1 revised v2 — scenario-based roadmap) ─

from pydantic import BaseModel


class OnboardingRequest(BaseModel):
    level: str
    learning_goal: str             # slug cố định: "travel" | "work" | "communication"
    words_per_session: int = 10    # 0 = speaking-only (không học từ mới)


class TopicOut(BaseModel):
    id: str
    name: str
    slug: str


class OnboardingOut(BaseModel):
    level: str
    learning_goal: str
    words_per_session: int
    onboarding_completed: bool
    roadmap_generated: bool = False  # True nếu AI sinh sequence thành công
