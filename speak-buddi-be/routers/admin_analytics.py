# speak-buddi-be/routers/admin_analytics.py
# ─── Admin Analytics API routes (S11.1 — Dashboard doanh thu/user/learning/AI) ─
#
# Endpoints:
#   GET /api/admin/analytics/overview                         → DashboardOverviewOut
#   GET /api/admin/analytics/timeseries?metric=&range=        → TimeseriesOut
#
# Auth: Depends(require_admin) — chỉ role='admin' (401 chưa login / 403 không phải admin).
#
# Lưu ý (§4.5): log INFO chỉ ghi loại truy vấn + ai gọi (user_id), KHÔNG log
# số liệu doanh thu/dữ liệu nhạy cảm chi tiết.
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import require_admin
from db.connection import get_db
from repositories import analytics_repo
from schemas.analytics import (
    AiUsageStatsOut,
    DashboardOverviewOut,
    LearningStatsOut,
    MetricName,
    RangeName,
    RevenueStatsOut,
    TimeseriesOut,
    TimeseriesPoint,
    UserStatsOut,
)

log = logging.getLogger("speakbuddi.admin_analytics")

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])


@router.get("/overview", response_model=DashboardOverviewOut)
async def get_overview(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> DashboardOverviewOut:
    """
    Trả gói tổng quan đủ render Dashboard admin trong 1 lần gọi (AC-12-01, §3.6):
    users (tổng/free/paid/mới), revenue (ước lượng), learning (quiz/accuracy/top words),
    ai_usage (placeholder cho tới khi Epic 7 có dữ liệu).

    Mỗi nhóm là 1 (hoặc 2 với learning+top_words) query riêng, không N+1
    (NFR §4.1: API < 1s). Không log dữ liệu chi tiết — chỉ log ai gọi.
    """
    log.info("admin_analytics.overview requested by admin_id=%s", admin.get("sub"))

    user_stats = await analytics_repo.get_user_stats(db)
    revenue_stats = await analytics_repo.get_revenue_stats(db)
    learning_stats = await analytics_repo.get_learning_stats(db)
    top_words = await analytics_repo.get_top_words(db, limit=10)
    ai_usage = await analytics_repo.get_ai_usage_stats(db)

    return DashboardOverviewOut(
        users=UserStatsOut(**user_stats),
        revenue=RevenueStatsOut(**revenue_stats),
        learning=LearningStatsOut(**learning_stats, top_words=top_words),
        ai_usage=AiUsageStatsOut(**ai_usage),
    )


@router.get("/timeseries", response_model=TimeseriesOut)
async def get_timeseries(
    metric: MetricName = Query("users", description="users | revenue"),
    range: RangeName = Query("7d", description="7d | 30d | year"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TimeseriesOut:
    """
    Dữ liệu chuỗi thời gian cho biểu đồ User Activity / Revenue (recharts).
    Mặc định metric=users, range=7d. Luôn trả đủ điểm liên tục (kể cả giá trị 0)
    để FE vẽ chart không bị đứt gãy.

    `range`/`metric` được tham số hóa ngay từ S11.1 để S11.2 (lọc doanh thu theo
    ngày/tháng/năm/gói) chỉ cần mở rộng thêm `plan_id`/`granularity`.
    """
    log.info(
        "admin_analytics.timeseries requested by admin_id=%s metric=%s range=%s",
        admin.get("sub"), metric, range,
    )

    rows = await analytics_repo.get_timeseries(db, metric=metric, range_=range)
    points = [TimeseriesPoint(label=row["label"], value=row["value"]) for row in rows]

    return TimeseriesOut(metric=metric, range=range, points=points)
