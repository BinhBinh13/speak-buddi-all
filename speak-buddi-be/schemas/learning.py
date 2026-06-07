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
    """Tạo topic mới (Admin S9.1)."""

    name: str               = Field(..., max_length=150)
    slug: str               = Field(..., max_length=180)
    level_id: Optional[uuid.UUID] = None
    description: Optional[str]    = None
    display_order: int             = 0


class TopicUpdate(TopicCreate):
    """Cập nhật topic (Admin S9.1) — cùng shape với Create (PUT thay thế toàn bộ)."""
    pass


class TopicOut(TopicCreate):
    """Topic kèm metadata — trả về trong response."""

    id: uuid.UUID
    level_code: Optional[str] = None   # S9.1 — mã level (A1/A2/…), JOIN từ level table
    source: str             # 'admin' | 'langeek'
    is_active: bool
    admin_locked: bool = False   # S9.5 — Admin đã chỉnh/disable; crawler không ghi đè
    created_at: datetime

    class Config:
        from_attributes = True


# ── TopicListItem (Topic + word_count) ───────────────────────────────────────

class TopicListItemOut(TopicOut):
    """Topic kèm số từ active — dùng cho list endpoint (S3.2 / S9.1 admin)."""

    word_count: int = 0


# ── TopicWord ─────────────────────────────────────────────────────────────────

class TopicWordCreate(BaseModel):
    """Tạo từ vựng trong topic (Admin S9.1 hoặc Crawler S9.3)."""

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


class TopicWordUpdate(TopicWordCreate):
    """Cập nhật từ vựng (Admin S9.1) — cùng shape với Create (PUT thay thế toàn bộ)."""
    pass


class TopicWordOut(BaseModel):
    """Từ vựng kèm metadata + tags — trả về trong response."""

    id: uuid.UUID
    topic_id: uuid.UUID
    topic_name: Optional[str] = None    # S9.1 — JOIN từ topic, hiển thị cột "Topic"
    level_id: Optional[uuid.UUID]
    level_code: Optional[str] = None    # S9.1 — JOIN từ level, badge "Difficulty"
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
    admin_locked: bool = False   # S9.5
    created_by: Optional[uuid.UUID]
    created_at: datetime
    tags: list[TagOut] = Field(default_factory=list)
    tag_ids: list[uuid.UUID] = Field(default_factory=list)   # S9.1 — prefill form sửa

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


# ── S2.5 — Topic modal + session tracking + user topic list ──────────────────

class SessionProgressUpsert(BaseModel):
    """Request body cho PUT /api/topics/{topic_id}/sessions/progress."""

    batch_index: int
    batch_size: int
    status: Literal["in_progress", "completed"]


class SessionProgressOut(BaseModel):
    """Trả về sau khi upsert session progress."""

    id: str
    batch_index: int
    batch_size: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime]


class TopicSessionSummaryOut(BaseModel):
    """Trả về info cần thiết để FE navigate sang AI conversation."""

    topic_id: str
    total_words: int
    batch_size: int          # = words_per_session của user
    total_batches: int
    resume_batch_index: Optional[int]   # batch in_progress nhỏ nhất; None nếu không có


class UserTopicOut(BaseModel):
    """1 topic user đã add vào danh sách học."""

    topic_id: str
    topic_name: str
    topic_slug: str
    level_code: str
    level_name: str
    total_words: int
    known_count: int         # từ user_word_progress (known) — cho progress bar
    added_at: datetime


# ── S7.x — Conversation transcript persistence ────────────────────────────────

class ConversationMessageIn(BaseModel):
    id: int
    role: Literal["user", "assistant"]
    content: str
    tts_error: bool = False


class ConversationTranscriptUpsert(BaseModel):
    """Request body cho PUT /api/topics/{topic_id}/conversations/{batch_index}."""

    messages: list[ConversationMessageIn]
    covered_words: list[str] = Field(default_factory=list)
    batch_done: bool = False


class ConversationTranscriptOut(BaseModel):
    topic_id: str
    batch_index: int
    messages: list[ConversationMessageIn]
    covered_words: list[str]
    batch_done: bool
    updated_at: Optional[datetime] = None
