# speak-buddi-be/repositories/session_repo.py
# ─── Repository: session progress + user topic list (S2.5) ───────────────────
#
# Hàm:
#   get_topic_session_summary(db, user_id, topic_id) → dict | None
#   upsert_session_progress(db, user_id, topic_id, batch_index, batch_size, status) → dict
#   add_user_topic(db, user_id, topic_id) → bool
#   remove_user_topic(db, user_id, topic_id) → bool
#   get_user_topics(db, user_id) → list[dict]
#
# Pattern: raw SQL text() + db.execute async, giống roadmap_repo.py.
# ─────────────────────────────────────────────────────────────────────────────

import json
import logging
import math

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger("speakbuddi.session_repo")

_DEFAULT_BATCH_SIZE = 10   # fallback khi user_profile không có words_per_session


async def get_topic_session_summary(
    db: AsyncSession, user_id: str, topic_id: str
) -> dict | None:
    """Trả None nếu topic không active.

    Dict trả về khớp TopicSessionSummaryOut:
        topic_id, total_words, batch_size, total_batches, resume_batch_index
    """
    # 1. Kiểm tra topic active + đếm total_words
    topic_row = await db.execute(
        text("""
            SELECT t.id::text AS topic_id,
                   COUNT(tw.id) FILTER (WHERE tw.is_active = TRUE) AS total_words
            FROM   topic t
            LEFT JOIN topic_word tw ON tw.topic_id = t.id
            WHERE  t.id = CAST(:topic_id AS UUID)
              AND  t.is_active = TRUE
            GROUP BY t.id
        """),
        {"topic_id": topic_id},
    )
    topic = topic_row.mappings().first()
    if topic is None:
        return None

    total_words = int(topic["total_words"])

    # 2. Đọc words_per_session từ user_profile
    prof_row = await db.execute(
        text("""
            SELECT words_per_session
            FROM   user_profile
            WHERE  user_id = CAST(:uid AS UUID)
        """),
        {"uid": user_id},
    )
    prof = prof_row.mappings().first()
    batch_size = int(prof["words_per_session"]) if prof and prof["words_per_session"] else _DEFAULT_BATCH_SIZE

    # 3. Tính total_batches
    total_batches = math.ceil(total_words / batch_size) if total_words > 0 else 0

    # 4. Lấy rows in_progress của (user, topic) → tìm min batch_index
    prog_row = await db.execute(
        text("""
            SELECT MIN(batch_index) AS resume_idx
            FROM   user_session_progress
            WHERE  user_id  = CAST(:uid AS UUID)
              AND  topic_id = CAST(:tid AS UUID)
              AND  status   = 'in_progress'
        """),
        {"uid": user_id, "tid": topic_id},
    )
    prog = prog_row.mappings().first()
    resume_batch_index = prog["resume_idx"] if prog and prog["resume_idx"] is not None else None

    return {
        "topic_id": topic_id,
        "total_words": total_words,
        "batch_size": batch_size,
        "total_batches": total_batches,
        "resume_batch_index": int(resume_batch_index) if resume_batch_index is not None else None,
    }


async def upsert_session_progress(
    db: AsyncSession,
    user_id: str,
    topic_id: str,
    batch_index: int,
    batch_size: int,
    status: str,
) -> dict:
    """INSERT ON CONFLICT DO UPDATE cho user_session_progress.

    Khi status='completed' → set completed_at=NOW(); ngược lại giữ NULL.
    Trả dict khớp SessionProgressOut.
    """
    completed_at_expr = "NOW()" if status == "completed" else "NULL"

    result = await db.execute(
        text(f"""
            INSERT INTO user_session_progress
                (user_id, topic_id, batch_index, batch_size, status, started_at, completed_at)
            VALUES
                (CAST(:uid AS UUID), CAST(:tid AS UUID), :batch_index, :batch_size, :status, NOW(), {completed_at_expr})
            ON CONFLICT (user_id, topic_id, batch_index) DO UPDATE SET
                batch_size   = EXCLUDED.batch_size,
                status       = EXCLUDED.status,
                completed_at = {completed_at_expr}
            RETURNING id::text, batch_index, batch_size, status, started_at, completed_at
        """),
        {
            "uid":         user_id,
            "tid":         topic_id,
            "batch_index": batch_index,
            "batch_size":  batch_size,
            "status":      status,
        },
    )
    await db.commit()
    row = result.mappings().first()

    log.info(
        "SESSION_PROGRESS  user=%s  topic=%s  batch=%d  status=%s",
        user_id, topic_id, batch_index, status,
    )
    return dict(row)


async def add_user_topic(db: AsyncSession, user_id: str, topic_id: str) -> bool:
    """Thêm topic vào danh sách học của user.

    Validate topic active trước. Trả True nếu insert mới, False nếu đã có.
    """
    # Validate topic active
    check = await db.execute(
        text("SELECT id FROM topic WHERE id = CAST(:tid AS UUID) AND is_active = TRUE"),
        {"tid": topic_id},
    )
    if check.first() is None:
        return False

    result = await db.execute(
        text("""
            INSERT INTO user_topic (user_id, topic_id, added_at)
            VALUES (CAST(:uid AS UUID), CAST(:tid AS UUID), NOW())
            ON CONFLICT (user_id, topic_id) DO NOTHING
            RETURNING topic_id
        """),
        {"uid": user_id, "tid": topic_id},
    )
    await db.commit()
    inserted = result.first() is not None

    log.info("ADD_USER_TOPIC  user=%s  topic=%s  new=%s", user_id, topic_id, inserted)
    return inserted


async def remove_user_topic(db: AsyncSession, user_id: str, topic_id: str) -> bool:
    """Xoá topic khỏi danh sách học của user. Trả True nếu xoá được."""
    result = await db.execute(
        text("""
            DELETE FROM user_topic
            WHERE user_id  = CAST(:uid AS UUID)
              AND topic_id = CAST(:tid AS UUID)
            RETURNING topic_id
        """),
        {"uid": user_id, "tid": topic_id},
    )
    await db.commit()
    deleted = result.first() is not None

    log.info("REMOVE_USER_TOPIC  user=%s  topic=%s  deleted=%s", user_id, topic_id, deleted)
    return deleted


async def get_user_topics(db: AsyncSession, user_id: str) -> list[dict]:
    """Danh sách topic user đã add kèm known_count từ user_word_progress."""
    result = await db.execute(
        text("""
            SELECT
                t.id::text                                                      AS topic_id,
                t.name                                                          AS topic_name,
                t.slug                                                          AS topic_slug,
                l.code                                                          AS level_code,
                l.name                                                          AS level_name,
                COUNT(tw.id) FILTER (WHERE tw.is_active = TRUE)                AS total_words,
                COUNT(uwp.id) FILTER (WHERE uwp.status = 'known')              AS known_count,
                ut.added_at
            FROM user_topic ut
            JOIN topic  t  ON t.id  = ut.topic_id
            JOIN level  l  ON l.id  = t.level_id
            LEFT JOIN topic_word tw ON tw.topic_id = t.id
            LEFT JOIN user_word_progress uwp
                   ON uwp.topic_word_id = tw.id
                  AND uwp.user_id = CAST(:uid AS UUID)
            WHERE ut.user_id = CAST(:uid AS UUID)
            GROUP BY t.id, t.name, t.slug, l.code, l.name, ut.added_at
            ORDER BY ut.added_at DESC
        """),
        {"uid": user_id},
    )
    rows = result.mappings().all()
    return [dict(row) for row in rows]


# ─── S7.x: conversation_transcript ───────────────────────────────────────────

def _normalize_transcript_row(row: dict) -> dict:
    """Chuẩn hoá JSONB từ PostgreSQL → dict Python cho Pydantic."""
    messages = row.get("messages") or []
    covered = row.get("covered_words") or []
    if isinstance(messages, str):
        messages = json.loads(messages)
    if isinstance(covered, str):
        covered = json.loads(covered)
    return {
        "topic_id":      row["topic_id"],
        "batch_index":   int(row["batch_index"]),
        "messages":      messages,
        "covered_words": covered,
        "batch_done":    bool(row.get("batch_done")),
        "updated_at":    row.get("updated_at"),
    }


async def get_conversation_transcript(
    db: AsyncSession,
    user_id: str,
    topic_id: str,
    batch_index: int,
) -> dict | None:
    """Trả None nếu chưa có transcript cho (user, topic, batch)."""
    result = await db.execute(
        text("""
            SELECT topic_id::text AS topic_id,
                   batch_index,
                   messages,
                   covered_words,
                   batch_done,
                   updated_at
            FROM   conversation_transcript
            WHERE  user_id     = CAST(:uid AS UUID)
              AND  topic_id    = CAST(:tid AS UUID)
              AND  batch_index = :batch_index
        """),
        {"uid": user_id, "tid": topic_id, "batch_index": batch_index},
    )
    row = result.mappings().first()
    if row is None:
        return None
    return _normalize_transcript_row(dict(row))


async def upsert_conversation_transcript(
    db: AsyncSession,
    user_id: str,
    topic_id: str,
    batch_index: int,
    messages: list[dict],
    covered_words: list[str],
    batch_done: bool,
) -> dict:
    """Lưu / cập nhật transcript hội thoại."""
    result = await db.execute(
        text("""
            INSERT INTO conversation_transcript
                (user_id, topic_id, batch_index, messages, covered_words, batch_done, updated_at)
            VALUES
                (CAST(:uid AS UUID), CAST(:tid AS UUID), :batch_index,
                 CAST(:messages AS JSONB), CAST(:covered AS JSONB), :batch_done, NOW())
            ON CONFLICT (user_id, topic_id, batch_index) DO UPDATE SET
                messages      = EXCLUDED.messages,
                covered_words = EXCLUDED.covered_words,
                batch_done    = EXCLUDED.batch_done,
                updated_at    = NOW()
            RETURNING topic_id::text AS topic_id,
                      batch_index,
                      messages,
                      covered_words,
                      batch_done,
                      updated_at
        """),
        {
            "uid":         user_id,
            "tid":         topic_id,
            "batch_index": batch_index,
            "messages":    json.dumps(messages),
            "covered":     json.dumps(covered_words),
            "batch_done":  batch_done,
        },
    )
    await db.commit()
    row = result.mappings().first()
    log.info(
        "CONV_TRANSCRIPT  user=%s  topic=%s  batch=%d  msgs=%d",
        user_id, topic_id, batch_index, len(messages),
    )
    return _normalize_transcript_row(dict(row))


async def delete_conversation_transcript(
    db: AsyncSession,
    user_id: str,
    topic_id: str,
    batch_index: int,
) -> bool:
    """Xoá transcript khi sang batch mới / reset. Trả True nếu có row bị xoá."""
    result = await db.execute(
        text("""
            DELETE FROM conversation_transcript
            WHERE user_id     = CAST(:uid AS UUID)
              AND topic_id    = CAST(:tid AS UUID)
              AND batch_index = :batch_index
            RETURNING id
        """),
        {"uid": user_id, "tid": topic_id, "batch_index": batch_index},
    )
    await db.commit()
    deleted = result.first() is not None
    if deleted:
        log.info("CONV_TRANSCRIPT_DELETE  user=%s  topic=%s  batch=%d", user_id, topic_id, batch_index)
    return deleted
