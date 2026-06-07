# speak-buddi-be/schemas/quiz.py
# ─── Pydantic schemas cho nhóm Quiz/Test ──────────────────────────────────────
#
# Phạm vi:
#   S4.1: skeleton schemas — chưa wire vào router (dùng ở S4.2/S4.3/S4.4)
#   S4.2: QuizQuestionOut + QuizAnswerOut — hiển thị câu hỏi theo type
#   S4.3: QuizAttemptOut + QuizAttemptAnswerSubmit — làm bài + submit
#   S4.4: QuizAttemptOut — chấm điểm + lưu attempt
#
# Cách dùng:
#   from schemas.quiz import VocabularyTestOut, QuizQuestionOut
#   from schemas.quiz import QuizAttemptOut, QuizAttemptAnswerSubmit
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ── QuestionType alias ────────────────────────────────────────────────────────
# AC-06-01: 4 loại câu hỏi hỗ trợ
QuestionType = Literal["flashcard", "multiple_choice", "fill_blank", "grammar_mapping"]


# ── VocabularyTest ─────────────────────────────────────────────────────────────

class VocabularyTestCreate(BaseModel):
    """Tạo bài kiểm tra mới (Admin S9.1)."""

    topic_id: Optional[uuid.UUID] = None
    level_id: Optional[uuid.UUID] = None
    title: str = Field(..., max_length=200)
    description: Optional[str] = None


class VocabularyTestUpdate(VocabularyTestCreate):
    """Cập nhật metadata bài kiểm tra (Admin S9.1) — cùng shape với Create."""
    pass


class VocabularyTestOut(BaseModel):
    """Bài kiểm tra kèm metadata — trả về trong response."""

    id: uuid.UUID
    topic_id: Optional[uuid.UUID]
    level_id: Optional[uuid.UUID]
    level_code: Optional[str] = None   # S4.5 — mã level (A1/A2/…), JOIN từ level table
    title: str
    description: Optional[str]
    is_active: bool
    created_by: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class VocabularyTestWithAttemptCountOut(VocabularyTestOut):
    """
    Bài kiểm tra kèm số lần user đã làm (S4.5 — QuizListPage).
    attempt_count: số lượt làm bài có status='submitted'.
    """

    attempt_count: int = 0


class VocabularyTestAdminOut(VocabularyTestOut):
    """
    Bài kiểm tra cho Admin list (S9.1 — Tests Repository).
    topic_name: tên topic (JOIN); question_count: tổng số câu hỏi;
    attempt_count: tổng số lượt làm (status='submitted') của mọi user.
    """

    topic_name: Optional[str] = None
    question_count: int = 0
    attempt_count: int = 0


# ── QuizAnswer ─────────────────────────────────────────────────────────────────

class QuizAnswerCreate(BaseModel):
    """Tạo đáp án cho câu hỏi multiple_choice / grammar_mapping."""

    answer_text: str
    is_correct: bool = False
    display_order: int = 0


class QuizAnswerOut(BaseModel):
    """Đáp án kèm id — trả về trong response."""

    id: uuid.UUID
    quiz_question_id: uuid.UUID
    answer_text: str
    is_correct: bool
    display_order: int

    class Config:
        from_attributes = True


# ── QuizQuestion ───────────────────────────────────────────────────────────────

class QuizQuestionCreate(BaseModel):
    """Tạo câu hỏi trong bài kiểm tra (Admin S9.1)."""

    vocabulary_test_id: uuid.UUID
    topic_word_id: Optional[uuid.UUID] = None       # nullable — flashcard có thể không gắn từ
    question_text: str
    question_type: QuestionType
    display_order: int = 0
    answers: list[QuizAnswerCreate] = Field(default_factory=list)  # đáp án kèm theo


class QuizQuestionOut(BaseModel):
    """Câu hỏi kèm danh sách đáp án — trả về trong response."""

    id: uuid.UUID
    vocabulary_test_id: uuid.UUID
    topic_word_id: Optional[uuid.UUID]
    question_text: str
    question_type: str
    display_order: int
    answers: list[QuizAnswerOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


# ── Test editor (Admin S9.1 — nested questions/answers) ───────────────────────
# Dùng cho GET/PUT /api/admin/tests/{id} — sync toàn bộ question/answer 1 lần.

class AnswerEditorIn(BaseModel):
    """1 đáp án trong editor — request body lồng trong QuestionEditorIn."""

    answer_text: str = Field(..., min_length=1)
    is_correct: bool = False
    display_order: int = 0


class QuestionEditorIn(BaseModel):
    """1 câu hỏi trong editor — request body lồng trong TestEditorIn."""

    question_text: str = Field(..., min_length=1)
    question_type: QuestionType
    topic_word_id: Optional[uuid.UUID] = None
    display_order: int = 0
    answers: list[AnswerEditorIn] = Field(default_factory=list)


class TestEditorIn(BaseModel):
    """
    Request body cho POST/PUT bài kiểm tra kèm toàn bộ câu hỏi + đáp án (Admin S9.1).
    BE validate: title không rỗng, ≥1 question, multiple_choice phải có ≥1 đáp án đúng.
    """

    title: str = Field(..., max_length=200)
    topic_id: Optional[uuid.UUID] = None
    level_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    questions: list[QuestionEditorIn] = Field(default_factory=list)


class TestEditorOut(VocabularyTestOut):
    """Bài kiểm tra kèm toàn bộ câu hỏi + đáp án — trả về cho trang editor (S9.1)."""

    questions: list[QuizQuestionOut] = Field(default_factory=list)


# ── QuizAttempt ────────────────────────────────────────────────────────────────

class QuizAttemptCreate(BaseModel):
    """Request body bắt đầu làm bài (S4.3)."""

    vocabulary_test_id: uuid.UUID


class QuizAttemptOut(BaseModel):
    """
    Lượt làm bài kèm kết quả — trả về sau khi bắt đầu / nộp bài.

    score_percent = correct_answers / total_questions × 100 (BR08)
    status: 'in_progress' | 'submitted'
    """

    id: uuid.UUID
    user_id: uuid.UUID
    vocabulary_test_id: uuid.UUID
    total_questions: int
    correct_answers: int
    wrong_answers: int
    score_percent: float
    status: str
    started_at: datetime
    submitted_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── QuizAttemptAnswer ──────────────────────────────────────────────────────────

class QuizAttemptAnswerSubmit(BaseModel):
    """
    Câu trả lời của user cho 1 câu hỏi trong lượt làm (S4.3).

    quiz_answer_id: None với flashcard (user tự đánh giá) và fill_blank (user gõ text)
    text_answer: dùng với fill_blank; None với multiple_choice / grammar_mapping
    """

    quiz_question_id: uuid.UUID
    quiz_answer_id: Optional[uuid.UUID] = None   # nullable — §5.3
    text_answer: Optional[str] = None             # fill_blank


class QuizAttemptAnswerOut(BaseModel):
    """Kết quả câu trả lời của user — snapshot không thay đổi (AC-06-04)."""

    id: uuid.UUID
    quiz_attempt_id: uuid.UUID
    quiz_question_id: uuid.UUID
    quiz_answer_id: Optional[uuid.UUID]           # nullable (flashcard/fill_blank)
    text_answer: Optional[str]
    is_correct: bool
    answered_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── QuizSubmitRequest ──────────────────────────────────────────────────────────

class QuizSubmitRequest(BaseModel):
    """Request body nộp bài (S4.3): danh sách câu trả lời của user."""

    answers: list[QuizAttemptAnswerSubmit]


# ── QuizResult (S4.4) ──────────────────────────────────────────────────────────

class QuizAnswerReview(BaseModel):
    """Chi tiết 1 câu trả lời trong review — trả về trang kết quả (S4.4)."""

    question_id: uuid.UUID
    question_text: str
    question_type: str
    user_answer_id: Optional[uuid.UUID] = None     # None với flashcard / fill_blank
    user_text_answer: Optional[str] = None          # fill_blank
    correct_answer_text: Optional[str] = None       # None với flashcard (self-rated)
    is_correct: bool

    class Config:
        from_attributes = True


class QuizAttemptResultOut(BaseModel):
    """
    Kết quả đầy đủ 1 lượt làm bài — dùng cho result page (S4.4).

    duration_seconds = submitted_at - started_at (giây), None nếu chưa submit.
    answers: danh sách câu trả lời kèm context câu hỏi + đáp án đúng.
    """

    id: uuid.UUID
    vocabulary_test_id: uuid.UUID
    total_questions: int
    correct_answers: int
    wrong_answers: int
    score_percent: float
    status: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    answers: list[QuizAnswerReview] = Field(default_factory=list)

    class Config:
        from_attributes = True
