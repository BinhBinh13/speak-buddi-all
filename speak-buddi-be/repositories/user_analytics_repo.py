# speak-buddi-be/repositories/user_analytics_repo.py
# ─── Repository thống kê học tập theo từng user ──────────────────────────────

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_RANGE_CONFIG = {
    "7d": {"days": 7, "trunc": "day", "label_fmt": "YYYY-MM-DD"},
    "30d": {"days": 30, "trunc": "day", "label_fmt": "YYYY-MM-DD"},
    "year": {"days": 365, "trunc": "month", "label_fmt": "YYYY-MM"},
}


async def get_vocabulary_stats(db: AsyncSession, user_id: str) -> dict:
    r = await db.execute(
        text("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'known')::int     AS known_count,
                COUNT(*) FILTER (WHERE status = 'learning')::int  AS learning_count,
                COUNT(*)::int                                     AS total_tracked,
                COUNT(DISTINCT topic_id)::int                     AS topics_count,
                COALESCE(SUM(review_count), 0)::int               AS total_reviews
            FROM user_word_progress
            WHERE user_id = CAST(:user_id AS UUID)
        """),
        {"user_id": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else {
        "known_count": 0,
        "learning_count": 0,
        "total_tracked": 0,
        "topics_count": 0,
        "total_reviews": 0,
    }


async def get_quiz_stats(db: AsyncSession, user_id: str) -> dict:
    r = await db.execute(
        text("""
            SELECT
                COUNT(*)::int                                    AS attempts_total,
                COALESCE(SUM(correct_answers), 0)::int           AS correct_answers,
                COALESCE(SUM(wrong_answers), 0)::int             AS wrong_answers,
                COALESCE(AVG(score_percent), 0)::float           AS avg_score_percent,
                COALESCE(MAX(score_percent), 0)::float           AS best_score_percent
            FROM quiz_attempt
            WHERE user_id = CAST(:user_id AS UUID)
              AND status = 'submitted'
        """),
        {"user_id": user_id},
    )
    row = r.mappings().first()
    correct = int(row["correct_answers"]) if row else 0
    wrong = int(row["wrong_answers"]) if row else 0
    total_answers = correct + wrong
    accuracy = round(correct / total_answers * 100, 2) if total_answers > 0 else 0.0

    return {
        "attempts_total": int(row["attempts_total"]) if row else 0,
        "correct_answers": correct,
        "wrong_answers": wrong,
        "accuracy_percent": accuracy,
        "avg_score_percent": round(float(row["avg_score_percent"]), 2) if row else 0.0,
        "best_score_percent": round(float(row["best_score_percent"]), 2) if row else 0.0,
    }


async def get_session_stats(db: AsyncSession, user_id: str) -> dict:
    r = await db.execute(
        text("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_batches,
                (SELECT COUNT(*)::int FROM user_topic WHERE user_id = CAST(:user_id AS UUID)) AS topics_added
            FROM user_session_progress
            WHERE user_id = CAST(:user_id AS UUID)
        """),
        {"user_id": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else {"completed_batches": 0, "topics_added": 0}


async def get_streak_days(db: AsyncSession, user_id: str) -> int:
    """Số ngày liên tiếp có hoạt động học (từ vựng hoặc quiz)."""
    r = await db.execute(
        text("""
            WITH activity_days AS (
                SELECT DISTINCT date_trunc('day', updated_at)::date AS d
                FROM user_word_progress
                WHERE user_id = CAST(:user_id AS UUID)
                UNION
                SELECT DISTINCT date_trunc('day', submitted_at)::date AS d
                FROM quiz_attempt
                WHERE user_id = CAST(:user_id AS UUID)
                  AND status = 'submitted'
                  AND submitted_at IS NOT NULL
            ),
            ordered AS (
                SELECT d,
                       d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int AS grp
                FROM activity_days
                WHERE d <= CURRENT_DATE
                ORDER BY d DESC
            )
            SELECT COUNT(*)::int AS streak
            FROM ordered
            WHERE grp = (
                SELECT grp FROM ordered
                WHERE d = CURRENT_DATE
                LIMIT 1
            )
        """),
        {"user_id": user_id},
    )
    row = r.mappings().first()
    if row and row["streak"]:
        return int(row["streak"])

    # Nếu hôm nay chưa học, tính streak kết thúc hôm qua
    r2 = await db.execute(
        text("""
            WITH activity_days AS (
                SELECT DISTINCT date_trunc('day', updated_at)::date AS d
                FROM user_word_progress
                WHERE user_id = CAST(:user_id AS UUID)
                UNION
                SELECT DISTINCT date_trunc('day', submitted_at)::date AS d
                FROM quiz_attempt
                WHERE user_id = CAST(:user_id AS UUID)
                  AND status = 'submitted'
                  AND submitted_at IS NOT NULL
            ),
            ordered AS (
                SELECT d,
                       d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int AS grp
                FROM activity_days
                WHERE d <= CURRENT_DATE - 1
                ORDER BY d DESC
            )
            SELECT COUNT(*)::int AS streak
            FROM ordered
            WHERE grp = (
                SELECT grp FROM ordered
                WHERE d = CURRENT_DATE - 1
                LIMIT 1
            )
        """),
        {"user_id": user_id},
    )
    row2 = r2.mappings().first()
    return int(row2["streak"]) if row2 and row2["streak"] else 0


async def get_top_words_for_user(db: AsyncSession, user_id: str, limit: int = 8) -> list[dict]:
    r = await db.execute(
        text("""
            SELECT tw.word,
                   uwp.review_count,
                   uwp.status
            FROM user_word_progress uwp
            JOIN topic_word tw ON tw.id = uwp.topic_word_id
            WHERE uwp.user_id = CAST(:user_id AS UUID)
            ORDER BY uwp.review_count DESC, tw.word ASC
            LIMIT :limit
        """),
        {"user_id": user_id, "limit": limit},
    )
    return [dict(row) for row in r.mappings().all()]


async def get_recent_quizzes(db: AsyncSession, user_id: str, limit: int = 5) -> list[dict]:
    r = await db.execute(
        text("""
            SELECT vt.title AS test_title,
                   qa.score_percent,
                   qa.submitted_at
            FROM quiz_attempt qa
            JOIN vocabulary_test vt ON vt.id = qa.vocabulary_test_id
            WHERE qa.user_id = CAST(:user_id AS UUID)
              AND qa.status = 'submitted'
            ORDER BY qa.submitted_at DESC NULLS LAST
            LIMIT :limit
        """),
        {"user_id": user_id, "limit": limit},
    )
    rows = []
    for row in r.mappings().all():
        item = dict(row)
        item["score_percent"] = round(float(item["score_percent"]), 2)
        rows.append(item)
    return rows


async def get_activity_timeseries(
    db: AsyncSession,
    user_id: str,
    metric: str,
    range_: str,
) -> list[dict]:
    cfg = _RANGE_CONFIG.get(range_, _RANGE_CONFIG["7d"])
    trunc = cfg["trunc"]
    label_fmt = cfg["label_fmt"]
    days = cfg["days"]

    if metric == "quizzes":
        source_sql = """
            SELECT date_trunc(:trunc, submitted_at) AS bucket, COUNT(*)::float AS cnt
            FROM quiz_attempt
            WHERE user_id = CAST(:user_id AS UUID)
              AND status = 'submitted'
              AND submitted_at >= NOW() - (:days || ' days')::interval
            GROUP BY 1
        """
    else:
        source_sql = """
            SELECT date_trunc(:trunc, updated_at) AS bucket, COUNT(*)::float AS cnt
            FROM user_word_progress
            WHERE user_id = CAST(:user_id AS UUID)
              AND updated_at >= NOW() - (:days || ' days')::interval
            GROUP BY 1
        """

    series_sql = f"""
        WITH bounds AS (
            SELECT date_trunc(:trunc, NOW() - (:days || ' days')::interval) AS start_at,
                   date_trunc(:trunc, NOW()) AS end_at
        ),
        buckets AS (
            SELECT generate_series(
                (SELECT start_at FROM bounds),
                (SELECT end_at FROM bounds),
                ('1 ' || :trunc)::interval
            ) AS bucket
        ),
        src AS ({source_sql})
        SELECT to_char(b.bucket, :label_fmt) AS label,
               COALESCE(src.cnt, 0)::float AS value
        FROM buckets b
        LEFT JOIN src ON src.bucket = b.bucket
        ORDER BY b.bucket ASC
    """

    r = await db.execute(
        text(series_sql),
        {
            "user_id": user_id,
            "trunc": trunc,
            "label_fmt": label_fmt,
            "days": str(days),
        },
    )
    return [dict(row) for row in r.mappings().all()]
