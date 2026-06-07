# speak-buddi-be/repositories/analytics_repo.py
# ─── Repository cho Admin Analytics / Dashboard (S11.1) ──────────────────────
#
# Pattern: bám sát repositories/payment_repo.py / quiz_repo.py
#   - raw SQL qua sqlalchemy.text()
#   - AsyncSession từ db/connection.py get_db()
#   - dict(row) cho từng kết quả
#
# Nguồn dữ liệu (mapping chỉ số → bảng — xem plan/S11.1-plan.md §3):
#   users / free-paid / new users     → users LEFT JOIN user_subscription
#   revenue (ƯỚC LƯỢNG)               → user_subscription (active) JOIN payment_plan
#   quiz attempts / accuracy / score  → quiz_attempt (status='submitted')
#   top learned words                 → user_word_progress JOIN topic_word
#   AI usage                          → CHƯA CÓ BẢNG (Epic 7) — trả 0 + is_available=False
#
# Dùng ở:
#   S11.1 — get_user_stats, get_revenue_stats, get_learning_stats, get_top_words,
#           get_ai_usage_stats, get_timeseries
#   S11.2 — (sẽ mở rộng) lọc revenue theo ngày/tháng/năm/gói
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ═══════════════════════════════════════════════════════════════════════════════
# users — tổng / free vs paid / new today / new this month
# ═══════════════════════════════════════════════════════════════════════════════

async def get_user_stats(db: AsyncSession) -> dict:
    """
    Thống kê người dùng (§3.6): tổng user active, free vs paid, user mới hôm nay/tháng.
    "paid" = có user_subscription đang active (status='active' AND expires_at > NOW()).
    Chỉ tính users.status != 'deleted' (loại bỏ tài khoản đã xoá mềm).
    1 query duy nhất — tránh N+1.
    """
    r = await db.execute(
        text("""
            SELECT
                COUNT(*)::int                                               AS total,
                COUNT(*) FILTER (WHERE sub.user_id IS NULL)::int            AS free,
                COUNT(*) FILTER (WHERE sub.user_id IS NOT NULL)::int        AS paid,
                COUNT(*) FILTER (
                    WHERE u.created_at >= date_trunc('day', NOW())
                )::int                                                       AS new_today,
                COUNT(*) FILTER (
                    WHERE u.created_at >= date_trunc('month', NOW())
                )::int                                                       AS new_this_month
            FROM users u
            LEFT JOIN (
                SELECT DISTINCT user_id
                FROM   user_subscription
                WHERE  status = 'active'
                  AND  (expires_at IS NULL OR expires_at > NOW())
            ) sub ON sub.user_id = u.id
            WHERE u.status != 'deleted'
        """)
    )
    row = r.mappings().first()
    return dict(row) if row else {
        "total": 0, "free": 0, "paid": 0, "new_today": 0, "new_this_month": 0,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# revenue — ƯỚC LƯỢNG từ user_subscription active × payment_plan.price_vnd
# ═══════════════════════════════════════════════════════════════════════════════

async def get_revenue_stats(db: AsyncSession) -> dict:
    """
    Doanh thu ƯỚC LƯỢNG (is_estimated=True trong response — chưa có bảng giao dịch
    thật phục vụ analytics; payment_transaction hiện chỉ ghi nhận checkout S8.1).

    total_vnd        = tổng price_vnd của mọi subscription đang active
    this_month_vnd   = tổng price_vnd của subscription bắt đầu trong tháng hiện tại
    """
    r = await db.execute(
        text("""
            SELECT
                COALESCE(SUM(pp.price_vnd), 0)::bigint                           AS total_vnd,
                COALESCE(SUM(pp.price_vnd) FILTER (
                    WHERE us.starts_at >= date_trunc('month', NOW())
                ), 0)::bigint                                                     AS this_month_vnd
            FROM user_subscription us
            JOIN payment_plan pp ON pp.id = us.plan_id
            WHERE us.status = 'active'
        """)
    )
    row = r.mappings().first()
    return {
        "total_vnd": int(row["total_vnd"]) if row else 0,
        "this_month_vnd": int(row["this_month_vnd"]) if row else 0,
        "currency": "VND",
        "is_estimated": True,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# learning — quiz attempts / correct-wrong / accuracy / avg score
# ═══════════════════════════════════════════════════════════════════════════════

async def get_learning_stats(db: AsyncSession) -> dict:
    """
    Thống kê học tập (§3.6): tổng lượt làm bài, số câu đúng/sai, tỉ lệ đúng,
    điểm trung bình — chỉ tính attempt đã nộp (status='submitted', có index idx_qa_submitted).
    accuracy_percent = correct / (correct + wrong) * 100 (0 nếu mẫu số = 0).
    """
    r = await db.execute(
        text("""
            SELECT
                COUNT(*)::int                                    AS quiz_attempts_total,
                COALESCE(SUM(correct_answers), 0)::int           AS correct_answers,
                COALESCE(SUM(wrong_answers), 0)::int             AS wrong_answers,
                COALESCE(AVG(score_percent), 0)::float           AS avg_score_percent
            FROM quiz_attempt
            WHERE status = 'submitted'
        """)
    )
    row = r.mappings().first()
    correct = int(row["correct_answers"]) if row else 0
    wrong = int(row["wrong_answers"]) if row else 0
    total_answers = correct + wrong
    accuracy = round(correct / total_answers * 100, 2) if total_answers > 0 else 0.0

    return {
        "quiz_attempts_total": int(row["quiz_attempts_total"]) if row else 0,
        "correct_answers": correct,
        "wrong_answers": wrong,
        "accuracy_percent": accuracy,
        "avg_score_percent": round(float(row["avg_score_percent"]), 2) if row else 0.0,
    }


async def get_top_words(db: AsyncSession, limit: int = 10) -> list[dict]:
    """
    Top từ vựng được học nhiều nhất (most learned) — group theo từ, đếm số user
    có bản ghi user_word_progress. 1 query group-by, có index idx_uwp_user_topic.
    """
    r = await db.execute(
        text("""
            SELECT tw.word                       AS word,
                   COUNT(uwp.id)::int            AS learned_count
            FROM   user_word_progress uwp
            JOIN   topic_word tw ON tw.id = uwp.topic_word_id
            GROUP  BY tw.word
            ORDER  BY learned_count DESC, tw.word ASC
            LIMIT  :limit
        """),
        {"limit": limit},
    )
    return [dict(row) for row in r.mappings().all()]


# ═══════════════════════════════════════════════════════════════════════════════
# AI usage — CHƯA CÓ BẢNG (Epic 7 / S7.x chưa build) → trả 0 + flag is_available
# ═══════════════════════════════════════════════════════════════════════════════

async def get_ai_usage_stats(db: AsyncSession) -> dict:
    """
    Thống kê hội thoại AI (§3.6: thời lượng hội thoại AI).
    Epic 7 (Hội thoại AI) chưa build bảng ghi nhận usage → trả 0 + is_available=False.
    Khi S7.x bổ sung bảng (vd ai_conversation/ai_quota_window), thay nội dung hàm
    này bằng query thật mà KHÔNG đổi shape dict trả về (giữ contract AiUsageStatsOut).
    """
    return {
        "total_minutes": 0,
        "conversations": 0,
        "is_available": False,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# timeseries — chart user/revenue theo khoảng thời gian (7d | 30d | year)
# ═══════════════════════════════════════════════════════════════════════════════

# Mapping range → (số điểm, độ dài khoảng cách giữa 2 điểm, format label)
_RANGE_CONFIG = {
    "7d":   {"days": 7,   "trunc": "day",   "label_fmt": "YYYY-MM-DD"},
    "30d":  {"days": 30,  "trunc": "day",   "label_fmt": "YYYY-MM-DD"},
    "year": {"days": 365, "trunc": "month", "label_fmt": "YYYY-MM"},
}


async def get_timeseries(db: AsyncSession, metric: str, range_: str) -> list[dict]:
    """
    Trả dữ liệu chuỗi thời gian cho biểu đồ recharts (S11.1: metric=users|revenue).

    - "users":   số user mới đăng ký theo ngày (7d/30d) hoặc theo tháng (year).
    - "revenue": tổng price_vnd của subscription bắt đầu trong khoảng đó (ƯỚC LƯỢNG,
                 đồng nhất cách tính với get_revenue_stats — xem is_estimated).

    Dùng generate_series để luôn trả đủ điểm liên tục (kể cả ngày/tháng = 0),
    giúp FE vẽ chart không bị "đứt gãy". 1 query — không N+1.
    """
    cfg = _RANGE_CONFIG.get(range_, _RANGE_CONFIG["7d"])
    trunc_unit = cfg["trunc"]
    days = cfg["days"]
    label_fmt = cfg["label_fmt"]

    if metric == "revenue":
        sql = f"""
            WITH buckets AS (
                SELECT generate_series(
                    date_trunc(:trunc_unit, NOW() - (CAST(:days AS text) || ' days')::interval),
                    date_trunc(:trunc_unit, NOW()),
                    ('1 ' || :trunc_unit)::interval
                ) AS bucket
            )
            SELECT to_char(b.bucket, :label_fmt)                          AS label,
                   COALESCE(SUM(pp.price_vnd), 0)::float                  AS value
            FROM   buckets b
            LEFT JOIN user_subscription us
                   ON  us.status = 'active'
                   AND date_trunc(:trunc_unit, us.starts_at) = b.bucket
            LEFT JOIN payment_plan pp ON pp.id = us.plan_id
            GROUP  BY b.bucket
            ORDER  BY b.bucket ASC
        """
    else:
        # mặc định: metric=users — số user mới đăng ký theo bucket thời gian
        sql = f"""
            WITH buckets AS (
                SELECT generate_series(
                    date_trunc(:trunc_unit, NOW() - (CAST(:days AS text) || ' days')::interval),
                    date_trunc(:trunc_unit, NOW()),
                    ('1 ' || :trunc_unit)::interval
                ) AS bucket
            )
            SELECT to_char(b.bucket, :label_fmt)                          AS label,
                   COUNT(u.id)::float                                     AS value
            FROM   buckets b
            LEFT JOIN users u
                   ON  u.status != 'deleted'
                   AND date_trunc(:trunc_unit, u.created_at) = b.bucket
            GROUP  BY b.bucket
            ORDER  BY b.bucket ASC
        """

    r = await db.execute(
        text(sql),
        {"trunc_unit": trunc_unit, "days": str(days), "label_fmt": label_fmt},
    )
    points = [dict(row) for row in r.mappings().all()]

    # generate_series trả cả điểm biên đầu (NOW() - N days) → N+1 điểm.
    # Cắt về đúng N điểm gần nhất để khớp kỳ vọng "range=7d → ≤ 7 điểm" (mục 5 plan).
    n_expected = days if trunc_unit == "day" else len(points)
    if trunc_unit == "day" and len(points) > n_expected:
        points = points[-n_expected:]

    return points
