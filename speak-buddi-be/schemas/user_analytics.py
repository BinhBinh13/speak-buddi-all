# speak-buddi-be/schemas/user_analytics.py
# ─── Pydantic schemas cho trang Analytics của user ─────────────────────────────

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class UserVocabularyStatsOut(BaseModel):
    known_count: int
    learning_count: int
    total_tracked: int
    topics_count: int
    total_reviews: int


class UserQuizStatsOut(BaseModel):
    attempts_total: int
    correct_answers: int
    wrong_answers: int
    accuracy_percent: float
    avg_score_percent: float
    best_score_percent: float


class UserSessionStatsOut(BaseModel):
    completed_batches: int
    topics_added: int


class UserTopWordOut(BaseModel):
    word: str
    review_count: int
    status: str


class UserRecentQuizOut(BaseModel):
    test_title: str
    score_percent: float
    submitted_at: datetime | None


class UserAnalyticsOverviewOut(BaseModel):
    vocabulary: UserVocabularyStatsOut
    quiz: UserQuizStatsOut
    sessions: UserSessionStatsOut
    streak_days: int
    top_words: list[UserTopWordOut]
    recent_quizzes: list[UserRecentQuizOut]


ActivityMetricName = Literal["words", "quizzes"]
ActivityRangeName = Literal["7d", "30d", "year"]


class UserActivityPointOut(BaseModel):
    label: str
    value: float


class UserActivitySeriesOut(BaseModel):
    metric: ActivityMetricName
    range: ActivityRangeName
    points: list[UserActivityPointOut]
