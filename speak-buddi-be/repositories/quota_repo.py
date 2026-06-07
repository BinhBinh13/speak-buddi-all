# speak-buddi-be/repositories/quota_repo.py
# ─── Repository: ai_quota_window — quota hội thoại AI (S7.2) ─────────────────
#
# Hàm:
#   get_or_create_active_window(db, user_id, window_seconds, max_seconds) → dict
#   add_used_seconds(db, window_id, seconds) → dict
#   get_quota_status(db, user_id) → dict
#
# Pattern: raw SQL text() + db.execute async, giống session_repo.py.
# Fixed 5h window (BR03): cửa sổ hết hạn bị bỏ qua lúc check → tạo mới (lazy reset).
# ─────────────────────────────────────────────────────────────────────────────

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger("speakbuddi.quota_repo")

# Hằng số — không hardcode rải rác (plan §6 Rủi ro)
_DEFAULT_WINDOW_SECONDS = 18_000   # 5 giờ = 18 000 giây (BR02/BR03)
_DEFAULT_MAX_SECONDS    = 900      # 15 phút (BR02)


async def get_or_create_active_window(
    db: AsyncSession,
    user_id: str,
    window_seconds: int = _DEFAULT_WINDOW_SECONDS,
    max_seconds: int    = _DEFAULT_MAX_SECONDS,
) -> dict:
    """Tìm cửa sổ quota đang active (window_end_at > NOW()).

    Nếu không có (chưa có hoặc đã hết hạn) → INSERT cửa sổ mới.
    Trả dict với keys: id, user_id, window_start_at, window_end_at,
                       used_seconds, max_seconds, created_at, updated_at.

    BR03: lazy reset — cửa sổ hết hạn tự bị bỏ qua, cửa sổ mới reset về 0.
    """
    # 1. Tìm cửa sổ active mới nhất của user
    row = await db.execute(
        text("""
            SELECT id::text, user_id::text,
                   window_start_at, window_end_at,
                   used_seconds, max_seconds,
                   created_at, updated_at
            FROM   ai_quota_window
            WHERE  user_id      = CAST(:uid AS UUID)
              AND  window_end_at > NOW()
            ORDER BY window_end_at DESC
            LIMIT  1
        """),
        {"uid": user_id},
    )
    window = row.mappings().first()
    if window is not None:
        log.debug("QUOTA_WINDOW  user=%s  found  used=%d/%d", user_id, window["used_seconds"], window["max_seconds"])
        return dict(window)

    # 2. Không có cửa sổ active → INSERT mới (BR03: lazy reset)
    insert_row = await db.execute(
        text("""
            INSERT INTO ai_quota_window
                (user_id, window_start_at, window_end_at, used_seconds, max_seconds)
            VALUES (
                CAST(:uid AS UUID),
                NOW(),
                NOW() + (INTERVAL '1 second' * :window_sec),
                0,
                :max_sec
            )
            RETURNING id::text, user_id::text,
                      window_start_at, window_end_at,
                      used_seconds, max_seconds,
                      created_at, updated_at
        """),
        {
            "uid":        user_id,
            "window_sec": window_seconds,
            "max_sec":    max_seconds,
        },
    )
    await db.commit()
    new_window = insert_row.mappings().first()

    log.info(
        "QUOTA_WINDOW  user=%s  created  window_end=%s  max=%d",
        user_id, new_window["window_end_at"], new_window["max_seconds"],
    )
    return dict(new_window)


async def add_used_seconds(
    db: AsyncSession,
    window_id: str,
    seconds: int,
) -> dict:
    """Cộng thêm `seconds` vào used_seconds của cửa sổ.

    UPDATE dùng RETURNING * để trả trạng thái sau khi cộng.
    Trả dict hoặc {} nếu window_id không tồn tại.
    """
    if seconds <= 0:
        return {}

    result = await db.execute(
        text("""
            UPDATE ai_quota_window
               SET used_seconds = used_seconds + :sec,
                   updated_at   = NOW()
             WHERE id = CAST(:wid AS UUID)
            RETURNING id::text, user_id::text,
                      window_start_at, window_end_at,
                      used_seconds, max_seconds,
                      created_at, updated_at
        """),
        {"wid": window_id, "sec": seconds},
    )
    await db.commit()
    row = result.mappings().first()
    if row is None:
        log.warning("ADD_USED_SECONDS  window_id=%s  not found", window_id)
        return {}

    log.info(
        "ADD_USED_SECONDS  window=%s  +%ds  total=%d/%d",
        window_id, seconds, row["used_seconds"], row["max_seconds"],
    )
    return dict(row)


async def get_quota_status(db: AsyncSession, user_id: str) -> dict:
    """Trả trạng thái quota đầy đủ cho một user.

    Gọi get_or_create_active_window rồi tính:
      remaining_seconds, reset_at, is_exceeded.
    """
    window = await get_or_create_active_window(db, user_id)
    used       = window["used_seconds"]
    max_sec    = window["max_seconds"]
    remaining  = max(0, max_sec - used)
    is_exceeded = used >= max_sec

    return {
        "id":                window["id"],
        "used_seconds":      used,
        "max_seconds":       max_sec,
        "remaining_seconds": remaining,
        "reset_at":          window["window_end_at"].isoformat(),
        "is_exceeded":       is_exceeded,
    }
