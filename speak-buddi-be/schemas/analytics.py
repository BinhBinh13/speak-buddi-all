# speak-buddi-be/schemas/analytics.py
# ─── Pydantic schemas cho Admin Analytics / Dashboard (S11.1) ────────────────
#
# Phạm vi S11.1: DashboardOverviewOut (+ sub-models Users/Revenue/Learning/AiUsage)
#                và TimeseriesOut/TimeseriesPoint (chart user/revenue theo thời gian)
#
# Lưu ý:
#   - revenue.is_estimated = True  → chưa có bảng giao dịch thật, ước lượng từ
#     user_subscription active × payment_plan.price_vnd (xem §6 plan/S11.1-plan.md)
#   - ai_usage.is_available = False → chưa có bảng AI usage (Epic 7 chưa build);
#     FE hiển thị placeholder "Sắp có" khi field này False.
#   - `range`/`metric` trong TimeseriesOut chừa chỗ cho S11.2 mở rộng
#     (plan_id, granularity) mà không đổi contract.
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


# ── Overview — sub-models ────────────────────────────────────────────────────

class UserStatsOut(BaseModel):
    """Nhóm chỉ số người dùng (§3.6: tổng user, free vs paid, new users)."""

    total: int
    free: int
    paid: int
    new_today: int
    new_this_month: int


class RevenueStatsOut(BaseModel):
    """
    Nhóm chỉ số doanh thu — ƯỚC LƯỢNG (is_estimated=True) vì chưa có bảng
    giao dịch thật (Epic 8 — payment_transaction mới chỉ dùng cho checkout).
    Tính từ user_subscription đang active × payment_plan.price_vnd.
    """

    total_vnd: int
    this_month_vnd: int
    currency: str = "VND"
    is_estimated: bool = True


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
    """
    Dữ liệu cho biểu đồ recharts theo `metric` (users|revenue) và `range` (7d|30d|year).
    S11.2 sẽ mở rộng thêm `plan_id`/`granularity` mà không đổi contract này.
    """

    metric: MetricName
    range: RangeName
    points: list[TimeseriesPoint]
