# speak-buddi-be/repositories/translate_repo.py
# ─── Repository cho translation_history (S5.2) ───────────────────────────────
#
# Pattern: bám sát repositories/quiz_repo.py
#   - raw SQL qua sqlalchemy.text()
#   - AsyncSession từ db/connection.py get_db()
#   - dict(row) cho từng kết quả
#
# Dùng ở:
#   S5.2 — save_history (hook vào POST /api/translate)
#   S5.2 — get_history  (GET /api/translate/history)
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def save_history(
    db: AsyncSession,
    user_id: str,
    source_text: str,
    target_text: str,
) -> None:
    """
    Lưu 1 bản dịch vào translation_history.
    Fire-and-forget — không trả về gì.
    Caller (router) bọc trong try/except để lỗi DB không fail kết quả dịch.
    """
    await db.execute(
        text("""
            INSERT INTO translation_history (user_id, source_text, target_text)
            VALUES (CAST(:uid AS UUID), :src, :tgt)
        """),
        {"uid": user_id, "src": source_text, "tgt": target_text},
    )


async def get_history(
    db: AsyncSession,
    user_id: str,
    limit: int = 20,
) -> list[dict]:
    """
    Lấy top {limit} bản dịch gần nhất của user. Mới nhất trước (AC-07-03).
    Trả về list[dict] với keys: id, user_id, source_text, target_text, created_at.
    """
    r = await db.execute(
        text("""
            SELECT id::text,
                   user_id::text,
                   source_text,
                   target_text,
                   created_at
            FROM   translation_history
            WHERE  user_id = CAST(:uid AS UUID)
            ORDER  BY created_at DESC
            LIMIT  :lim
        """),
        {"uid": user_id, "lim": limit},
    )
    return [dict(row) for row in r.mappings().all()]
