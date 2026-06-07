# speak-buddi-be/repositories/pronunciation_repo.py
# ─── Repository: pronunciation_attempt + pronunciation_syllable_score (S6.2/S6.3) ─
#
# Hàm:
#   insert_attempt(db, user_id, target_text, overall, accuracy, fluency,
#                  feedback, topic_word_id=None) → attempt_id (str)
#   insert_syllable_scores(db, attempt_id, syllables: list[dict]) → None
#   list_attempts(db, user_id, limit=20, offset=0) → tuple[list[dict], int]  (S6.3)
#
# Pattern: raw SQL text() + db.execute async, giống session_repo.py.
# 1 transaction: insert attempt → insert syllables → commit.
# ─────────────────────────────────────────────────────────────────────────────

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger("speakbuddi.pronunciation_repo")


async def insert_attempt(
    db:            AsyncSession,
    user_id:       str,
    target_text:   str,
    overall:       float,
    accuracy:      float,
    fluency:       float,
    feedback:      str,
    topic_word_id: str | None = None,
) -> str:
    """INSERT pronunciation_attempt, trả attempt_id (UUID string).

    Không commit ở đây — caller (router hoặc batch) commit sau khi
    insert_syllable_scores xong.
    """
    result = await db.execute(
        text("""
            INSERT INTO pronunciation_attempt
                (user_id, topic_word_id, target_text,
                 overall_score, accuracy_score, fluency_score, feedback)
            VALUES
                (CAST(:uid AS UUID),
                 CAST(:twid AS UUID),
                 :target_text,
                 :overall, :accuracy, :fluency, :feedback)
            RETURNING id::text
        """),
        {
            "uid":         user_id,
            "twid":        topic_word_id,    # NULL khi dùng từ hardcode
            "target_text": target_text,
            "overall":     overall,
            "accuracy":    accuracy,
            "fluency":     fluency,
            "feedback":    feedback,
        },
    )
    row = result.mappings().first()
    attempt_id: str = row["id"]
    log.info(
        "INSERT_ATTEMPT  user=%s  target=%r  attempt=%s",
        user_id, target_text, attempt_id,
    )
    return attempt_id


async def insert_syllable_scores(
    db:         AsyncSession,
    attempt_id: str,
    syllables:  list[dict],
) -> None:
    """Bulk INSERT pronunciation_syllable_score cho 1 attempt.

    syllables: list of {"text": str, "score": float}
    Commit bởi caller sau khi gọi cả 2 hàm.
    """
    for order, syl in enumerate(syllables):
        await db.execute(
            text("""
                INSERT INTO pronunciation_syllable_score
                    (attempt_id, syllable_text, score, display_order)
                VALUES
                    (CAST(:aid AS UUID), :syllable_text, :score, :display_order)
            """),
            {
                "aid":           attempt_id,
                "syllable_text": syl["text"],
                "score":         syl["score"],
                "display_order": order,
            },
        )
    log.info(
        "INSERT_SYLLABLES  attempt=%s  count=%d",
        attempt_id, len(syllables),
    )


# ─── S6.3: list_attempts ─────────────────────────────────────────────────────

async def list_attempts(
    db:      AsyncSession,
    user_id: str,
    limit:   int = 20,
    offset:  int = 0,
) -> tuple[list[dict], int]:
    """Lấy lịch sử pronunciation_attempt của user, sắp theo created_at DESC.

    Trả tuple (rows, total) để caller build PronunciationHistoryOut.
    Chỉ trả metadata an toàn — không trả audio bytes hay token (§4.5).
    """
    # Tổng số row của user (dùng cho phân trang)
    count_result = await db.execute(
        text("""
            SELECT COUNT(*) AS total
            FROM   pronunciation_attempt
            WHERE  user_id = CAST(:uid AS UUID)
        """),
        {"uid": user_id},
    )
    total: int = count_result.mappings().first()["total"]

    # Lấy trang hiện tại
    rows_result = await db.execute(
        text("""
            SELECT id::text,
                   target_text,
                   overall_score,
                   accuracy_score,
                   fluency_score,
                   feedback,
                   created_at
            FROM   pronunciation_attempt
            WHERE  user_id = CAST(:uid AS UUID)
            ORDER BY created_at DESC
            LIMIT  :lim
            OFFSET :off
        """),
        {"uid": user_id, "lim": limit, "off": offset},
    )
    rows = [dict(r) for r in rows_result.mappings().all()]

    log.info(
        "LIST_ATTEMPTS  user=%s  total=%d  limit=%d  offset=%d",
        user_id, total, limit, offset,
    )
    return rows, total
