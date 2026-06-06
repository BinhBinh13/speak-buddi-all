# speak-buddi-be/schemas/learning.py
# ─── Pydantic schemas cho nhóm Learning content ───────────────────────────────
#
# Phạm vi:
#   S3.1/S3.2: LevelOut, TopicCreate/Out, TagCreate/Out, TopicWordCreate/Out
#   S3.3:      WordProgressUpsert, WordProgressOut, TopicProgressOut
#
# Cách dùng:
#   from schemas.learning import LevelOut, TopicOut, TopicWordCreate, TopicWordOut
#   from schemas.learning import WordProgressUpsert, WordProgressOut, TopicProgressOut
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ── Level ─────────────────────────────────────────────────────────────────────

class LevelOut(BaseModel):
    """Trả về thông tin 1 level (read-only, cố định 6 giá trị A1–C2)."""

    id: uuid.UUID
    code: str               # A1/A2/B1/B2/C1/C2
    name: str               # "Beginner (A1)"…
    display_order: int

    class Config:
        from_attributes = True


# ── Tag ───────────────────────────────────────────────────────────────────────

class TagCreate(BaseModel):
    """Tạo tag mới (Admin S9.1)."""

    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=120)


class TagOut(TagCreate):
    """Tag kèm id — trả về trong response."""

    id: uuid.UUID

    class Config:
        from_attributes = True


# ── Topic ─────────────────────────────────────────────────────────────────────

class TopicCreate(BaseModel):
    """Tạo / cập nhật topic (Admin S9.1)."""

    name: str               = Field(..., max_length=150)
    slug: str               = Field(..., max_length=180)
    level_id: Optional[uuid.UUID] = None
    description: Optional[str]    = None
    display_order: int             = 0


class TopicOut(TopicCreate):
    """Topic kèm metadata — trả về trong response."""

    id: uuid.UUID
    source: str             # 'admin' | 'langeek'
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── TopicListItem (Topic + word_count) ───────────────────────────────────────

class TopicListItemOut(TopicOut):
    """Topic kèm số từ active — dùng cho list endpoint (S3.2)."""

    word_count: int = 0


# ── TopicWord ─────────────────────────────────────────────────────────────────

class TopicWordCreate(BaseModel):
    """Tạo / cập nhật từ vựng trong topic (Admin S9.1 hoặc Crawler S9.3)."""

    topic_id: uuid.UUID
    level_id: Optional[uuid.UUID]  = None
    word: str                       = Field(..., max_length=120)
    phonetic: Optional[str]         = Field(None, max_length=120)    # IPA
    meaning_vi: str                 = Field(..., max_length=500)     # AC-05-02
    meaning_en: Optional[str]       = Field(None, max_length=500)    # AC-05-02
    example_sentence: Optional[str] = Field(None, max_length=1000)  # AC-05-02
    grammar_note: Optional[str]     = Field(None, max_length=1000)
    audio_url: Optional[str]        = None
    display_order: int              = 0
    tag_ids: list[uuid.UUID]        = Field(default_factory=list)    # M:N → topic_word_tag


class TopicWordOut(BaseModel):
    """Từ vựng kèm metadata + tags — trả về trong response."""

    id: uuid.UUID
    topic_id: uuid.UUID
    level_id: Optional[uuid.UUID]
    word: str
    phonetic: Optional[str]
    meaning_vi: str
    meaning_en: Optional[str]
    example_sentence: Optional[str]
    grammar_note: Optional[str]
    audio_url: Optional[str]
    display_order: int
    source: str             # 'admin' | 'langeek'
    is_active: bool
    created_by: Optional[uuid.UUID]
    created_at: datetime
    tags: list[TagOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


# ── Progress (S3.3) ───────────────────────────────────────────────────────────

class WordProgressUpsert(BaseModel):
    """
    Request body cho PUT /api/topics/{topic_id}/words/{word_id}/progress.
    Chỉ client gửi status; topic_word_id lấy từ path param.
    """
    status: Literal["known", "learning"]


class WordProgressOut(BaseModel):
    """Tiến độ 1 từ của user — trả về sau upsert hoặc trong list của topic."""

    topic_word_id: uuid.UUID
    topic_id: uuid.UUID
    level_id: Optional[uuid.UUID]
    status: str
    review_count: int
    last_seen_at: datetime

    class Config:
        from_attributes = True


class TopicProgressOut(BaseModel):
    """
    Tiến độ tổng hợp của 1 topic cho 1 user.
    total_words = số từ active trong topic (kể cả từ chưa có progress).
    known_count + learning_count chỉ tính các từ đã có progress row.
    """

    topic_id: uuid.UUID
    total_words: int
    known_count: int
    learning_count: int
    percent_known: float
    words: list[WordProgressOut]
