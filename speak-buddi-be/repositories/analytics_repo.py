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
#   revenue                           → payment_transaction (status='success', S11.2)
#   quiz attempts / accuracy / score  → quiz_attempt (status='submitted')
#   top learned words                 → user_word_progress JOIN topic_word
#   AI usage                          → CHƯA CÓ BẢNG (Epic 7) — trả 0 + is_available=False
#
# Dùng ở:
#   S11.1 — get_user_stats, get_revenue_stats, get_learning_stats, get_top_words,
#           get_ai_usage_stats, get_timeseries
#   S11.2 — (sẽ mở rộng) lọc revenue theo ngày/tháng/năm/gói
#   S11.2 — get_revenue_filtered, resolve bounds, revenue timeseries + plan_id
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date

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
# revenue — payment_transaction success (S11.2)
# ═══════════════════════════════════════════════════════════════════════════════

_GRANULARITY_TRUNC = {
    "day": ("day", "YYYY-MM-DD"),
    "month": ("month", "YYYY-MM"),
    "year": ("year", "YYYY"),
}


async def resolve_revenue_date_range(
    db: AsyncSession,
    granularity: str,
    from_date: date | None = None,
    to_date: date | None = None,
) -> tuple[date | None, date | None]:
    """
    Trả (from_date, to_date) inclusive cho filter doanh thu.
    Nếu from_date và to_date đều có → dùng custom range.
    Ngược lại preset theo granularity (tính trên DB NOW()).
    granularity='total' → (None, None) = mọi paid_at.
    """
    if from_date is not None and to_date is not None:
        return from_date, to_date

    r = await db.execute(
        text("""
            SELECT
                CASE :granularity
                    WHEN 'day'   THEN date_trunc('day', NOW())::date
                    WHEN 'month' THEN date_trunc('month', NOW())::date
                    WHEN 'year'  THEN date_trunc('year', NOW())::date
                    ELSE NULL
                END AS from_d,
                CASE :granularity
                    WHEN 'day'   THEN date_trunc('day', NOW())::date
                    WHEN 'month' THEN (date_trunc('month', NOW()) + interval '1 month - 1 day')::date
                    WHEN 'year'  THEN (date_trunc('year', NOW()) + interval '1 year - 1 day')::date
                    ELSE NULL
                END AS to_d
        """),
        {"granularity": granularity},
    )
    row = r.mappings().first()
    if not row:
        return None, None
    return row["from_d"], row["to_d"]


def _paid_at_filter_sql(use_bounds: bool) -> str:
    """Fragment WHERE cho paid_at — total không giới hạn ngày."""
    if not use_bounds:
        return "paid_at IS NOT NULL"
    return (
        "paid_at IS NOT NULL "
        "AND paid_at >= CAST(:from_date AS date) "
        "AND paid_at < (CAST(:to_date AS date) + interval '1 day')"
    )


async def get_revenue_stats(db: AsyncSession) -> dict:
    """
    Doanh thu overview từ payment_transaction success (AC-12-02 / S11.2).
    total_vnd = tổng mọi giao dịch thành công; this_month_vnd = tháng hiện tại.
    """
    r = await db.execute(
        text("""
            SELECT
                COALESCE(SUM(amount_vnd), 0)::bigint AS total_vnd,
                COALESCE(SUM(amount_vnd) FILTER (
                    WHERE paid_at >= date_trunc('month', NOW())
                      AND paid_at < date_trunc('month', NOW()) + interval '1 month'
                ), 0)::bigint AS this_month_vnd
            FROM payment_transaction
            WHERE status = 'success'
              AND paid_at IS NOT NULL
        """)
    )
    row = r.mappings().first()
    return {
        "total_vnd": int(row["total_vnd"]) if row else 0,
        "this_month_vnd": int(row["this_month_vnd"]) if row else 0,
        "currency": "VND",
        "is_estimated": False,
    }


async def get_revenue_filtered(
    db: AsyncSession,
    *,
    granularity: str,
    from_date: date | None = None,
    to_date: date | None = None,
    plan_id: str | None = None,
) -> dict:
    """
    Doanh thu đã lọc + chuỗi thời gian theo granularity (AC-12-02, §3.6).
    Nguồn: payment_transaction status='success', amount_vnd, paid_at.
    """
    resolved_from, resolved_to = await resolve_revenue_date_range(
        db, granularity, from_date, to_date
    )
    use_bounds = resolved_from is not None and resolved_to is not None
    paid_filter = _paid_at_filter_sql(use_bounds)

    params: dict = {}
    plan_sql = ""
    plan_sql_pt = ""
    if plan_id:
        plan_sql = "AND plan_id = CAST(:plan_id AS uuid)"
        plan_sql_pt = "AND pt.plan_id = CAST(:plan_id AS uuid)"
        params["plan_id"] = plan_id
    if use_bounds:
        params["from_date"] = resolved_from
        params["to_date"] = resolved_to

    summary_sql = f"""
        SELECT
            COALESCE(SUM(amount_vnd), 0)::bigint AS total_vnd,
            COUNT(*)::int AS transaction_count
        FROM payment_transaction
        WHERE status = 'success'
          AND {paid_filter}
          {plan_sql}
    """
    r = await db.execute(text(summary_sql), params)
    summary = r.mappings().first()
    total_vnd = int(summary["total_vnd"]) if summary else 0
    tx_count = int(summary["transaction_count"]) if summary else 0

    points: list[dict] = []
    if granularity != "total" and use_bounds:
        trunc_unit, label_fmt = _GRANULARITY_TRUNC.get(granularity, ("day", "YYYY-MM-DD"))
        series_sql = f"""
            WITH bounds AS (
                SELECT CAST(:from_date AS date) AS d0,
                       CAST(:to_date AS date) AS d1
            ),
            buckets AS (
                SELECT generate_series(
                    date_trunc(:trunc_unit, (SELECT d0 FROM bounds)),
                    date_trunc(:trunc_unit, (SELECT d1 FROM bounds)),
                    ('1 ' || :trunc_unit)::interval
                ) AS bucket
            )
            SELECT to_char(b.bucket, :label_fmt) AS label,
                   COALESCE(SUM(pt.amount_vnd), 0)::float AS value
            FROM buckets b
            LEFT JOIN payment_transaction pt
                   ON pt.status = 'success'
                  AND pt.paid_at IS NOT NULL
                  AND date_trunc(:trunc_unit, pt.paid_at) = b.bucket
                  AND pt.paid_at >= CAST(:from_date AS date)
                  AND pt.paid_at < (CAST(:to_date AS date) + interval '1 day')
                  {plan_sql_pt}
            GROUP BY b.bucket
            ORDER BY b.bucket ASC
        """
        rp = await db.execute(
            text(series_sql),
            {**params, "trunc_unit": trunc_unit, "label_fmt": label_fmt},
        )
        points = [dict(row) for row in rp.mappings().all()]
    elif granularity == "total":
        points = [{"label": "Tổng", "value": float(total_vnd)}]

    plan_name = None
    if plan_id:
        pr = await db.execute(
            text("SELECT name FROM payment_plan WHERE id = CAST(:plan_id AS uuid)"),
            {"plan_id": plan_id},
        )
        prow = pr.mappings().first()
        plan_name = prow["name"] if prow else None

    return {
        "total_vnd": total_vnd,
        "transaction_count": tx_count,
        "currency": "VND",
        "is_estimated": False,
        "granularity": granularity,
        "from_date": resolved_from,
        "to_date": resolved_to,
        "plan_id": plan_id,
        "plan_name": plan_name,
        "points": points,
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


async def get_timeseries(
    db: AsyncSession,
    metric: str,
    range_: str,
    plan_id: str | None = None,
) -> list[dict]:
    """
    Trả dữ liệu chuỗi thời gian cho biểu đồ recharts (S11.1 + S11.2 plan_id).

    - "users":   số user mới đăng ký theo ngày/tháng.
    - "revenue": SUM amount_vnd từ payment_transaction success (paid_at).
    """
    cfg = _RANGE_CONFIG.get(range_, _RANGE_CONFIG["7d"])
    trunc_unit = cfg["trunc"]
    days = cfg["days"]
    label_fmt = cfg["label_fmt"]
    plan_join = ""
    plan_params: dict = {}
    if metric == "revenue" and plan_id:
        plan_join = "AND pt.plan_id = CAST(:plan_id AS uuid)"
        plan_params["plan_id"] = plan_id

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
                   COALESCE(SUM(pt.amount_vnd), 0)::float               AS value
            FROM   buckets b
            LEFT JOIN payment_transaction pt
                   ON  pt.status = 'success'
                   AND pt.paid_at IS NOT NULL
                   AND date_trunc(:trunc_unit, pt.paid_at) = b.bucket
                   {plan_join}
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
        {"trunc_unit": trunc_unit, "days": str(days), "label_fmt": label_fmt, **plan_params},
    )
    points = [dict(row) for row in r.mappings().all()]

    # generate_series trả cả điểm biên đầu (NOW() - N days) → N+1 điểm.
    # Cắt về đúng N điểm gần nhất để khớp kỳ vọng "range=7d → ≤ 7 điểm" (mục 5 plan).
    n_expected = days if trunc_unit == "day" else len(points)
    if trunc_unit == "day" and len(points) > n_expected:
        points = points[-n_expected:]

    return points


# ═══════════════════════════════════════════════════════════════════════════════
# export queries (S11.3 — AC-12-03)
# ═══════════════════════════════════════════════════════════════════════════════

async def get_revenue_transactions_for_export(
    db: AsyncSession,
    *,
    from_date: date,
    to_date: date,
    plan_id: str | None = None,
    limit: int = 1000,
) -> list[dict]:
    """Chi tiết giao dịch success trong khoảng ngày — dùng export revenue."""
    plan_sql = ""
    params: dict = {"from_date": from_date, "to_date": to_date, "limit": limit}
    if plan_id:
        plan_sql = "AND pt.plan_id = CAST(:plan_id AS uuid)"
        params["plan_id"] = plan_id

    r = await db.execute(
        text(f"""
            SELECT pt.id::text AS id,
                   pt.paid_at,
                   pp.name AS plan_name,
                   pt.amount_vnd,
                   pt.currency
            FROM payment_transaction pt
            JOIN payment_plan pp ON pp.id = pt.plan_id
            WHERE pt.status = 'success'
              AND pt.paid_at IS NOT NULL
              AND pt.paid_at >= CAST(:from_date AS date)
              AND pt.paid_at < (CAST(:to_date AS date) + interval '1 day')
              {plan_sql}
            ORDER BY pt.paid_at DESC
            LIMIT :limit
        """),
        params,
    )
    return [dict(row) for row in r.mappings().all()]


async def get_new_users_in_range(
    db: AsyncSession,
    *,
    from_date: date,
    to_date: date,
    limit: int = 1000,
) -> list[dict]:
    """User mới đăng ký trong khoảng ngày — export users (không export password)."""
    r = await db.execute(
        text("""
            SELECT u.email,
                   u.name,
                   u.created_at,
                   CASE WHEN sub.user_id IS NOT NULL THEN 'paid' ELSE 'free' END AS tier
            FROM users u
            LEFT JOIN (
                SELECT DISTINCT user_id
                FROM user_subscription
                WHERE status = 'active'
                  AND (expires_at IS NULL OR expires_at > NOW())
            ) sub ON sub.user_id = u.id
            WHERE u.status != 'deleted'
              AND u.created_at >= CAST(:from_date AS date)
              AND u.created_at < (CAST(:to_date AS date) + interval '1 day')
            ORDER BY u.created_at DESC
            LIMIT :limit
        """),
        {"from_date": from_date, "to_date": to_date, "limit": limit},
    )
    return [dict(row) for row in r.mappings().all()]


async def get_learning_stats_in_range(
    db: AsyncSession,
    *,
    from_date: date,
    to_date: date,
) -> dict:
    """Thống kê quiz trong khoảng ngày (submitted_at)."""
    r = await db.execute(
        text("""
            SELECT
                COUNT(*)::int AS quiz_attempts_total,
                COALESCE(SUM(correct_answers), 0)::int AS correct_answers,
                COALESCE(SUM(wrong_answers), 0)::int AS wrong_answers,
                COALESCE(AVG(score_percent), 0)::float AS avg_score_percent
            FROM quiz_attempt
            WHERE status = 'submitted'
              AND submitted_at IS NOT NULL
              AND submitted_at >= CAST(:from_date AS date)
              AND submitted_at < (CAST(:to_date AS date) + interval '1 day')
        """),
        {"from_date": from_date, "to_date": to_date},
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


async def get_quiz_attempts_in_range(
    db: AsyncSession,
    *,
    from_date: date,
    to_date: date,
    limit: int = 500,
) -> list[dict]:
    """Lượt làm bài đã nộp trong khoảng ngày — export learning detail."""
    r = await db.execute(
        text("""
            SELECT qa.submitted_at,
                   vt.title AS test_title,
                   qa.score_percent,
                   qa.correct_answers,
                   qa.wrong_answers,
                   qa.total_questions
            FROM quiz_attempt qa
            JOIN vocabulary_test vt ON vt.id = qa.vocabulary_test_id
            WHERE qa.status = 'submitted'
              AND qa.submitted_at IS NOT NULL
              AND qa.submitted_at >= CAST(:from_date AS date)
              AND qa.submitted_at < (CAST(:to_date AS date) + interval '1 day')
            ORDER BY qa.submitted_at DESC
            LIMIT :limit
        """),
        {"from_date": from_date, "to_date": to_date, "limit": limit},
    )
    return [dict(row) for row in r.mappings().all()]
