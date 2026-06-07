# speak-buddi-be/routers/user_analytics.py
# ─── User Analytics API — thống kê học tập cá nhân ───────────────────────────
#
# Endpoints:
#   GET /api/user/analytics/overview
#   GET /api/user/analytics/activity?metric=words|quizzes&range=7d|30d|year
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import user_analytics_repo
from schemas.user_analytics import (
    ActivityMetricName,
    ActivityRangeName,
    UserActivityPointOut,
    UserActivitySeriesOut,
    UserAnalyticsOverviewOut,
    UserQuizStatsOut,
    UserRecentQuizOut,
    UserSessionStatsOut,
    UserTopWordOut,
    UserVocabularyStatsOut,
)

log = logging.getLogger("speakbuddi.user_analytics")

router = APIRouter(prefix="/api/user/analytics", tags=["user-analytics"])


@router.get("/overview", response_model=UserAnalyticsOverviewOut)
async def get_overview(
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UserAnalyticsOverviewOut:
    user_id = payload.get("sub", "")
    log.info("user_analytics.overview user=%s", user_id)

    vocabulary = await user_analytics_repo.get_vocabulary_stats(db, user_id)
    quiz = await user_analytics_repo.get_quiz_stats(db, user_id)
    sessions = await user_analytics_repo.get_session_stats(db, user_id)
    streak_days = await user_analytics_repo.get_streak_days(db, user_id)
    top_words = await user_analytics_repo.get_top_words_for_user(db, user_id)
    recent_quizzes = await user_analytics_repo.get_recent_quizzes(db, user_id)

    return UserAnalyticsOverviewOut(
        vocabulary=UserVocabularyStatsOut(**vocabulary),
        quiz=UserQuizStatsOut(**quiz),
        sessions=UserSessionStatsOut(**sessions),
        streak_days=streak_days,
        top_words=[UserTopWordOut(**w) for w in top_words],
        recent_quizzes=[UserRecentQuizOut(**q) for q in recent_quizzes],
    )


@router.get("/activity", response_model=UserActivitySeriesOut)
async def get_activity(
    metric: ActivityMetricName = Query("words"),
    range_: ActivityRangeName = Query("7d", alias="range"),
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UserActivitySeriesOut:
    user_id = payload.get("sub", "")
    log.info("user_analytics.activity user=%s metric=%s range=%s", user_id, metric, range_)

    points = await user_analytics_repo.get_activity_timeseries(db, user_id, metric, range_)
    return UserActivitySeriesOut(
        metric=metric,
        range=range_,
        points=[UserActivityPointOut(**p) for p in points],
    )
