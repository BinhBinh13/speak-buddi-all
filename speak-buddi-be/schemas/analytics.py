# speak-buddi-be/schemas/analytics.py
# ─── Pydantic schemas cho Admin Analytics / Dashboard (S11.1 + S11.2) ───────
#
# S11.1: DashboardOverviewOut, TimeseriesOut
# S11.2: RevenueFilterOut, GranularityName — lọc doanh thu theo ngày/tháng/năm/gói
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Overview — sub-models ────────────────────────────────────────────────────

class UserStatsOut(BaseModel):
    """Nhóm chỉ số người dùng (§3.6: tổng user, free vs paid, new users)."""

    total: int
    free: int
    paid: int
    new_today: int
    new_this_month: int


class RevenueStatsOut(BaseModel):
    """Nhóm chỉ số doanh thu overview — từ payment_transaction success (S11.2)."""

    total_vnd: int
    this_month_vnd: int
    currency: str = "VND"
    is_estimated: bool = False


class TopWordOut(BaseModel):
    """1 dòng trong bảng xếp hạng từ vựng được học nhiều nhất."""

    word: str
    learned_count: int


class LearningStatsOut(BaseModel):
    """Nhóm chỉ số học tập (§3.6: quiz attempts, tỉ lệ đúng/sai, điểm TB, top words)."""

    quiz_attempts_total: int
    correct_answers: int
    wrong_answers: int
    accuracy_percent: float
    avg_score_percent: float
    top_words: list[TopWordOut] = []


class AiUsageStatsOut(BaseModel):
    """
    Nhóm chỉ số AI usage — CHƯA CÓ DỮ LIỆU (Epic 7 chưa build bảng ghi nhận).
    is_available=False → FE hiển thị placeholder "Sắp có"; khi S7.x xong,
    bổ sung query thật vào analytics_repo mà không đổi contract field này.
    """

    total_minutes: int = 0
    conversations: int = 0
    is_available: bool = False


class DashboardOverviewOut(BaseModel):
    """Gói tổng quan đủ render Dashboard admin trong 1 lần gọi (giảm round-trip)."""

    users: UserStatsOut
    revenue: RevenueStatsOut
    learning: LearningStatsOut
    ai_usage: AiUsageStatsOut


# ── Timeseries (chart user/revenue) ──────────────────────────────────────────

MetricName = Literal["users", "revenue"]
RangeName = Literal["7d", "30d", "year"]


class TimeseriesPoint(BaseModel):
    """1 điểm dữ liệu trên biểu đồ — label hiển thị trục X, value là giá trị trục Y."""

    label: str
    value: float


class TimeseriesOut(BaseModel):
    """Dữ liệu cho biểu đồ recharts theo metric/range (+ plan_id khi revenue — S11.2)."""

    metric: MetricName
    range: RangeName
    points: list[TimeseriesPoint]
    is_estimated: bool = False


# ── Revenue filter (S11.2 — AC-12-02) ────────────────────────────────────────

GranularityName = Literal["day", "month", "year", "total"]


class RevenueFilterOut(BaseModel):
    """Doanh thu đã lọc theo granularity / from-to / payment plan."""

    total_vnd: int
    transaction_count: int
    currency: str = "VND"
    is_estimated: bool = False
    granularity: GranularityName
    from_date: date | None = None
    to_date: date | None = None
    plan_id: UUID | None = None
    plan_name: str | None = None
    points: list[TimeseriesPoint] = []


# ── Report export (S11.3 — AC-12-03) ─────────────────────────────────────────

ReportTypeName = Literal["revenue", "users", "learning", "ai_usage"]
ExportFormatName = Literal["xlsx", "pdf"]
ExportStatusName = Literal["pending", "completed", "failed"]


class ExportRequestIn(BaseModel):
    """Body POST /api/admin/analytics/export."""

    model_config = ConfigDict(populate_by_name=True)

    report_type: ReportTypeName
    export_format: ExportFormatName
    from_date: date = Field(..., alias="from")
    to_date: date = Field(..., alias="to")
    plan_id: UUID | None = None
    granularity: GranularityName = "day"


class ExportHistoryItemOut(BaseModel):
    id: int
    report_type: ReportTypeName
    export_format: ExportFormatName
    filter_params: dict | None = None
    file_name: str | None = None
    status: ExportStatusName
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class ExportHistoryListOut(BaseModel):
    items: list[ExportHistoryItemOut]
    total: int
