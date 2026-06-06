# speak-buddi-be/schemas/roadmap.py
# ─── Pydantic schemas cho Roadmap (S2.2) ──────────────────────────────────────

from __future__ import annotations

from pydantic import BaseModel


class RoadmapNode(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    order_index: int          # 0-based — thứ tự vẽ snake (S2.4)
    difficulty: int = 1       # độ khó topic (1 = dễ nhất); dùng để sort roadmap
    is_interest: bool          # user đã chọn topic này khi onboarding
    status: str = "available"  # available | completed | in_progress | locked (placeholder — tracking sau)
    word_count: int = 0        # số từ active trong topic (subquery COUNT)


class RoadmapOut(BaseModel):
    level: str                 # "B1"
    level_name: str            # "Intermediate (B1)"
    total_topics: int
    selected_topics: int       # số topic user đã chọn trong onboarding
    nodes: list[RoadmapNode]
