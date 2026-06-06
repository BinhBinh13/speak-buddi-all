# speak-buddi-be/routers/learning.py
# ─── Learning content API routes (S3.2 + S3.3) ────────────────────────────────
#
# Endpoints (S3.2):
#   GET /api/levels                                        → list[LevelOut]
#   GET /api/topics?level=<code>                           → list[TopicListItemOut]
#   GET /api/topics/{topic_id}/words                       → list[TopicWordOut]
#
# Endpoints (S3.3):
#   PUT /api/topics/{topic_id}/words/{word_id}/progress    → WordProgressOut
#   GET /api/topics/{topic_id}/progress                    → TopicProgressOut
#
# Yêu cầu đăng nhập: Depends(current_user) — đồng nhất với /api/auth/me.
# DB: SQLAlchemy async session từ Depends(get_db).
# ─────────────────────────────────────────────────────────────────────────────

import json
import logging
import uuid as uuid_mod

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from schemas.learning import (
    LevelOut, TopicListItemOut, TopicWordOut, TagOut,
    WordProgressUpsert, WordProgressOut, TopicProgressOut,
)

log = logging.getLogger("speakbuddi.learning")

router = APIRouter(prefix="/api", tags=["learning"])


# ─── GET /api/levels ─────────────────────────────────────────────────────────

@router.get("/levels", response_model=list[LevelOut])
async def get_levels(
    _user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[LevelOut]:
    """Trả 6 level A1–C2 sắp theo display_order."""
    result = await db.execute(
        text("SELECT id, code, name, display_order FROM level ORDER BY display_order")
    )
    rows = result.mappings().all()
    return [LevelOut(**dict(row)) for row in rows]


# ─── GET /api/topics ─────────────────────────────────────────────────────────

@router.get("/topics", response_model=list[TopicListItemOut])
async def get_topics(
    level: str | None = None,
    _user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TopicListItemOut]:
    """
    Trả danh sách topic active.
    Query param `level` (code A1–C2, optional) để lọc theo level.
    Mỗi topic kèm word_count (số từ active trong topic).
    """
    base_sql = """
        SELECT t.id, t.level_id, t.name, t.slug, t.description, t.display_order,
               t.source, t.is_active, t.created_at,
               COUNT(tw.id) FILTER (WHERE tw.is_active = TRUE) AS word_count
        FROM topic t
        LEFT JOIN level l ON l.id = t.level_id
        LEFT JOIN topic_word tw ON tw.topic_id = t.id
        WHERE t.is_active = TRUE
    """
    if level:
        sql = text(base_sql + " AND l.code = :level GROUP BY t.id ORDER BY t.display_order, t.name")
        result = await db.execute(sql, {"level": level})
    else:
        sql = text(base_sql + " GROUP BY t.id ORDER BY t.display_order, t.name")
        result = await db.execute(sql)
    rows = result.mappings().all()
    return [TopicListItemOut(**dict(row)) for row in rows]


# ─── GET /api/topics/{topic_id}/words ────────────────────────────────────────

@router.get("/topics/{topic_id}/words", response_model=list[TopicWordOut])
async def get_topic_words(
    topic_id: uuid_mod.UUID,
    _user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TopicWordOut]:
    """
    Trả danh sách từ active của topic kèm tags.
    404 nếu topic không tồn tại hoặc is_active = FALSE.
    """
    # Kiểm tra topic tồn tại và active
    check = await db.execute(
        text("SELECT id FROM topic WHERE id = :tid AND is_active = TRUE"),
        {"tid": str(topic_id)},
    )
    if check.first() is None:
        raise HTTPException(status_code=404, detail="Topic not found or inactive")

    sql = text("""
        SELECT tw.id, tw.topic_id, tw.level_id, tw.word, tw.phonetic,
               tw.meaning_vi, tw.meaning_en, tw.example_sentence,
               tw.grammar_note, tw.audio_url, tw.display_order,
               tw.source, tw.is_active, tw.created_by, tw.created_at,
               COALESCE(
                 json_agg(
                   json_build_object('id', tg.id, 'name', tg.name, 'slug', tg.slug)
                 ) FILTER (WHERE tg.id IS NOT NULL),
                 '[]'
               ) AS tags
        FROM topic_word tw
        LEFT JOIN topic_word_tag twt ON twt.topic_word_id = tw.id
        LEFT JOIN tag tg ON tg.id = twt.tag_id
        WHERE tw.topic_id = :topic_id AND tw.is_active = TRUE
        GROUP BY tw.id
        ORDER BY tw.display_order
    """)
    result = await db.execute(sql, {"topic_id": str(topic_id)})
    rows = result.mappings().all()

    words: list[TopicWordOut] = []
    for row in rows:
        data = dict(row)
        # json_agg trả về string khi đọc từ asyncpg — parse nếu cần
        raw_tags = data.get("tags", "[]")
        if isinstance(raw_tags, str):
            tag_list = json.loads(raw_tags)
        else:
            tag_list = raw_tags if raw_tags is not None else []

        data["tags"] = [TagOut(**t) for t in tag_list]
        words.append(TopicWordOut(**data))

    log.info("WORDS  topic=%s  count=%d", topic_id, len(words))
    return words


# ─── PUT /api/topics/{topic_id}/words/{word_id}/progress ─────────────────────
# S3.3 — Upsert tiến độ 1 từ cho user hiện tại (AC-05-03)

@router.put(
    "/topics/{topic_id}/words/{word_id}/progress",
    response_model=WordProgressOut,
)
async def upsert_word_progress(
    topic_id: uuid_mod.UUID,
    word_id: uuid_mod.UUID,
    body: WordProgressUpsert,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> WordProgressOut:
    """
    Đánh dấu tiến độ 1 từ là 'known' hoặc 'learning'.
    Upsert: gọi lại cùng từ → cập nhật status + tăng review_count.
    user_id lấy từ JWT sub (UUID string, khớp seed_dev.sql).
    404 nếu word_id không thuộc topic_id hoặc is_active = FALSE.
    """
    user_id = uuid_mod.UUID(payload["sub"])

    # Kiểm tra word thuộc topic và còn active — lấy level_id để snapshot
    tw_row = await db.execute(
        text("""
            SELECT tw.id, tw.level_id
            FROM topic_word tw
            WHERE tw.id = :word_id
              AND tw.topic_id = :topic_id
              AND tw.is_active = TRUE
        """),
        {"word_id": str(word_id), "topic_id": str(topic_id)},
    )
    tw = tw_row.mappings().first()
    if tw is None:
        raise HTTPException(
            status_code=404,
            detail="Word not found in topic or inactive",
        )

    level_id = tw["level_id"]  # có thể None nếu NULL trong DB

    # Upsert: INSERT or UPDATE review_count + status + timestamps
    result = await db.execute(
        text("""
            INSERT INTO user_word_progress
                (user_id, topic_word_id, topic_id, level_id, status, review_count, last_seen_at)
            VALUES
                (:user_id, :word_id, :topic_id, :level_id, :status, 1, NOW())
            ON CONFLICT (user_id, topic_word_id)
            DO UPDATE SET
                status       = EXCLUDED.status,
                review_count = user_word_progress.review_count + 1,
                last_seen_at = NOW(),
                updated_at   = NOW()
            RETURNING topic_word_id, topic_id, level_id, status, review_count, last_seen_at
        """),
        {
            "user_id":  str(user_id),
            "word_id":  str(word_id),
            "topic_id": str(topic_id),
            "level_id": str(level_id) if level_id else None,
            "status":   body.status,
        },
    )
    await db.commit()
    row = result.mappings().first()

    log.info(
        "PROGRESS  user=%s  word=%s  status=%s  review_count=%d",
        user_id, word_id, row["status"], row["review_count"],
    )
    return WordProgressOut(**dict(row))


# ─── GET /api/topics/{topic_id}/progress ─────────────────────────────────────
# S3.3 — Lấy tiến độ topic (tổng hợp + per-word) cho user hiện tại (AC-05-03)

@router.get(
    "/topics/{topic_id}/progress",
    response_model=TopicProgressOut,
)
async def get_topic_progress(
    topic_id: uuid_mod.UUID,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TopicProgressOut:
    """
    Trả tiến độ tổng hợp của topic cho user hiện tại:
      - total_words: số từ active (kể cả chưa có progress)
      - known_count / learning_count: đếm theo status đã lưu
      - percent_known: round(known_count / total_words * 100, 1) hoặc 0.0
      - words: danh sách per-word progress (để FE hydrate trạng thái từng flashcard)
    404 nếu topic không tồn tại hoặc inactive.
    """
    user_id = uuid_mod.UUID(payload["sub"])

    # Kiểm tra topic tồn tại và active
    topic_check = await db.execute(
        text("SELECT id FROM topic WHERE id = :tid AND is_active = TRUE"),
        {"tid": str(topic_id)},
    )
    if topic_check.first() is None:
        raise HTTPException(status_code=404, detail="Topic not found or inactive")

    # Tổng số từ active trong topic (kể cả chưa có progress)
    total_row = await db.execute(
        text("""
            SELECT COUNT(*) AS cnt
            FROM topic_word
            WHERE topic_id = :topic_id AND is_active = TRUE
        """),
        {"topic_id": str(topic_id)},
    )
    total_words = total_row.scalar() or 0

    # Per-word progress của user trong topic (chỉ các từ đã được đánh dấu)
    prog_result = await db.execute(
        text("""
            SELECT uwp.topic_word_id, uwp.topic_id, uwp.level_id,
                   uwp.status, uwp.review_count, uwp.last_seen_at
            FROM user_word_progress uwp
            JOIN topic_word tw ON tw.id = uwp.topic_word_id
            WHERE uwp.user_id = :user_id
              AND uwp.topic_id = :topic_id
              AND tw.is_active = TRUE
            ORDER BY uwp.last_seen_at DESC
        """),
        {"user_id": str(user_id), "topic_id": str(topic_id)},
    )
    prog_rows = prog_result.mappings().all()

    words_out: list[WordProgressOut] = [WordProgressOut(**dict(r)) for r in prog_rows]

    known_count    = sum(1 for w in words_out if w.status == "known")
    learning_count = sum(1 for w in words_out if w.status == "learning")
    percent_known  = round(known_count / total_words * 100, 1) if total_words > 0 else 0.0

    log.info(
        "PROGRESS_TOPIC  user=%s  topic=%s  total=%d  known=%d",
        user_id, topic_id, total_words, known_count,
    )
    return TopicProgressOut(
        topic_id=topic_id,
        total_words=total_words,
        known_count=known_count,
        learning_count=learning_count,
        percent_known=percent_known,
        words=words_out,
    )
