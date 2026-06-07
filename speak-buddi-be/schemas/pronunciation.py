# speak-buddi-be/schemas/pronunciation.py
# ─── Pydantic schemas cho Pronunciation scoring (S6.2) + history (S6.3) ────────

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class SyllableScore(BaseModel):
    """Điểm từng âm tiết trong breakdown."""
    text:  str
    score: float = Field(ge=0, le=100)


class ScoreRequest(BaseModel):
    """Request body cho POST /api/pronunciation/score."""
    target_text:   str
    transcript:    str
    topic_word_id: str | None = None   # NULL khi dùng từ hardcode


class ScoreResponse(BaseModel):
    """Response trả về sau khi chấm phát âm."""
    attempt_id: str
    overall:    float = Field(ge=0, le=100)
    accuracy:   float = Field(ge=0, le=100)
    fluency:    float = Field(ge=0, le=100)
    syllables:  list[SyllableScore]
    feedback:   str    # tiếng Việt, ≤ 2 câu


# ─── S6.3: History schemas ────────────────────────────────────────────────────

class PronunciationAttemptOut(BaseModel):
    """Một lần attempt trong lịch sử luyện phát âm."""
    id:            str
    target_text:   str
    overall_score: Optional[float] = Field(default=None, ge=0, le=100)
    accuracy_score: Optional[float] = Field(default=None, ge=0, le=100)
    fluency_score:  Optional[float] = Field(default=None, ge=0, le=100)
    feedback:      Optional[str]  = None
    created_at:    datetime


class PronunciationHistoryOut(BaseModel):
    """Danh sách lịch sử luyện phát âm có phân trang."""
    items:  List[PronunciationAttemptOut]
    total:  int
    limit:  int
    offset: int
