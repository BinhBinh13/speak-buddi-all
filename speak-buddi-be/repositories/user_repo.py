from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import RESET_TOKEN_TTL

# SQL fragment dùng chung — SELECT users JOIN user_profile
_USER_SELECT = """
    SELECT u.id::text,
           u.email,
           u.password_hash,
           u.role,
           u.status,
           COALESCE(p.name, '')  AS name,
           p.target_level        AS level,
           p.learning_goal       AS goal,
           p.daily_minutes       AS daily_minutes,
           p.words_per_session   AS words_per_session
    FROM   users u
    LEFT JOIN user_profile p ON p.user_id = u.id
"""


async def get_user_by_email(db: AsyncSession, email: str) -> dict | None:
    r = await db.execute(
        text(f"{_USER_SELECT} WHERE LOWER(u.email) = LOWER(:email) AND u.status != 'deleted'"),
        {"email": email},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_user_by_id(db: AsyncSession, user_id: str) -> dict | None:
    if not user_id:
        return None
    r = await db.execute(
        text(f"{_USER_SELECT} WHERE u.id = CAST(:id AS UUID) AND u.status != 'deleted'"),
        {"id": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_user_by_oauth(
    db: AsyncSession, provider: str, provider_uid: str
) -> dict | None:
    r = await db.execute(
        text("""
            SELECT u.id::text,
                   u.email,
                   u.password_hash,
                   u.role,
                   u.status,
                   COALESCE(p.name, '') AS name,
                   p.target_level       AS level,
                   p.learning_goal      AS goal,
                   p.daily_minutes      AS daily_minutes,
                   p.words_per_session  AS words_per_session
            FROM   oauth_account oa
            JOIN   users u  ON u.id  = oa.user_id
            LEFT JOIN user_profile p ON p.user_id = u.id
            WHERE  oa.provider = :provider AND oa.provider_user_id = :uid
              AND  u.status != 'deleted'
        """),
        {"provider": provider, "uid": provider_uid},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_is_paid(db: AsyncSession, user_id: str) -> bool:
    r = await db.execute(
        text("""
            SELECT 1 FROM user_subscription
            WHERE  user_id = CAST(:uid AS UUID)
              AND  status = 'active'
              AND  (expires_at IS NULL OR expires_at > NOW())
            LIMIT  1
        """),
        {"uid": user_id},
    )
    return r.first() is not None


async def create_user(
    db: AsyncSession, email: str, name: str, password_hash: str | None
) -> dict:
    r = await db.execute(
        text("""
            INSERT INTO users (email, password_hash, role, status)
            VALUES (:email, :pw_hash, 'student', 'active')
            RETURNING id::text, email, password_hash, role, status
        """),
        {"email": email, "pw_hash": password_hash},
    )
    user_row = dict(r.mappings().first())
    await db.execute(
        text("INSERT INTO user_profile (user_id, name) VALUES (CAST(:uid AS UUID), :name)"),
        {"uid": user_row["id"], "name": name},
    )
    user_row.update({"name": name, "level": None, "goal": None, "daily_minutes": 10, "words_per_session": 10})
    return user_row


async def link_oauth(
    db: AsyncSession, user_id: str, provider: str, provider_uid: str
) -> None:
    await db.execute(
        text("""
            INSERT INTO oauth_account (user_id, provider, provider_user_id)
            VALUES (CAST(:uid AS UUID), :provider, :puid)
            ON CONFLICT (provider, provider_user_id) DO NOTHING
        """),
        {"uid": user_id, "provider": provider, "puid": provider_uid},
    )


async def update_password(db: AsyncSession, user_id: str, pw_hash: str) -> None:
    await db.execute(
        text("UPDATE users SET password_hash = :pw_hash WHERE id = CAST(:uid AS UUID)"),
        {"pw_hash": pw_hash, "uid": user_id},
    )


async def create_reset_token(db: AsyncSession, user_id: str, token_hash: str) -> None:
    # Hủy token cũ chưa dùng — one active token per user
    await db.execute(
        text("DELETE FROM password_reset_token WHERE user_id = CAST(:uid AS UUID) AND NOT used"),
        {"uid": user_id},
    )
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=RESET_TOKEN_TTL)
    await db.execute(
        text("""
            INSERT INTO password_reset_token (user_id, token_hash, expires_at)
            VALUES (CAST(:uid AS UUID), :hash, :exp)
        """),
        {"uid": user_id, "hash": token_hash, "exp": expires_at},
    )


async def get_reset_token(db: AsyncSession, token_hash: str) -> dict | None:
    r = await db.execute(
        text("""
            SELECT prt.id::text     AS token_id,
                   prt.user_id::text,
                   prt.expires_at,
                   prt.used,
                   u.email
            FROM   password_reset_token prt
            JOIN   users u ON u.id = prt.user_id
            WHERE  prt.token_hash = :hash AND NOT prt.used
        """),
        {"hash": token_hash},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def use_reset_token(db: AsyncSession, token_id: str) -> None:
    await db.execute(
        text("UPDATE password_reset_token SET used = TRUE WHERE id = CAST(:id AS UUID)"),
        {"id": token_id},
    )


# ─── Onboarding (S2.1) ────────────────────────────────────────────────────────

async def get_topics_by_level(db: AsyncSession, level_code: str) -> list[dict]:
    """Trả danh sách topic active thuộc level_code (vd: 'A1').
    Sắp theo display_order rồi name.
    """
    r = await db.execute(
        text("""
            SELECT t.id::text, t.name, t.slug
            FROM   topic t
            JOIN   level l ON t.level_id = l.id
            WHERE  l.code = UPPER(:code) AND t.is_active = TRUE
            ORDER  BY t.display_order, t.name
        """),
        {"code": level_code},
    )
    rows = r.mappings().all()
    return [dict(row) for row in rows]


# ─── Profile (S2.3) ───────────────────────────────────────────────────────────

async def update_level(
    db: AsyncSession,
    user_id: str,
    level: str,
) -> dict | None:
    """Cập nhật chỉ target_level trong user_profile.
    Không đụng interests/daily_minutes/words_per_session (BR09).
    Trả dict với target_level mới hoặc None nếu không tìm thấy profile.
    """
    r = await db.execute(
        text("""
            UPDATE user_profile
            SET    target_level = :level,
                   updated_at   = NOW()
            WHERE  user_id = CAST(:uid AS UUID)
            RETURNING target_level
        """),
        {"level": level, "uid": user_id},
    )
    await db.commit()
    row = r.mappings().first()
    return dict(row) if row else None


async def update_onboarding(
    db: AsyncSession,
    user_id: str,
    level: str,
    topics: list[str],
    daily_minutes: int,
    words_per_session: int,
) -> dict:
    """Cập nhật onboarding user_profile; trả lại dict với các field đã lưu."""
    r = await db.execute(
        text("""
            UPDATE user_profile
            SET    target_level      = :level,
                   interests         = :topics,
                   daily_minutes     = :daily_minutes,
                   words_per_session = :words_per_session,
                   updated_at        = NOW()
            WHERE  user_id = CAST(:uid AS UUID)
            RETURNING target_level, interests, daily_minutes, words_per_session
        """),
        {
            "level":             level,
            "topics":            topics,
            "daily_minutes":     daily_minutes,
            "words_per_session": words_per_session,
            "uid":               user_id,
        },
    )
    await db.commit()
    row = r.mappings().first()
    return dict(row) if row else {}


# ─── Account deletion (S12.2) ─────────────────────────────────────────────────

async def delete_user_personal_data(db: AsyncSession, user_id: str) -> bool:
    """Xóa/anonymize dữ liệu cá nhân user (§4.6/§4.7).

    Soft-delete user (status=deleted + email anonymized), purge PII học tập,
    giữ payment_transaction gắn user_id đã anonymize phục vụ analytics.
    Trả False nếu user không tồn tại hoặc đã deleted.
    """
    uid = {"uid": user_id}

    # Kiểm tra user còn active trước khi xóa
    check = await db.execute(
        text("SELECT id::text FROM users WHERE id = CAST(:uid AS UUID) AND status != 'deleted'"),
        uid,
    )
    if check.first() is None:
        return False

    # Purge dữ liệu cá nhân (thứ tự an toàn FK)
    await db.execute(
        text("DELETE FROM translation_history WHERE user_id = CAST(:uid AS UUID)"),
        uid,
    )
    await db.execute(
        text("DELETE FROM user_word_progress WHERE user_id = CAST(:uid AS UUID)"),
        uid,
    )
    await db.execute(
        text("DELETE FROM quiz_attempt WHERE user_id = CAST(:uid AS UUID)"),
        uid,
    )
    await db.execute(
        text("DELETE FROM oauth_account WHERE user_id = CAST(:uid AS UUID)"),
        uid,
    )
    await db.execute(
        text("DELETE FROM user_session WHERE user_id = CAST(:uid AS UUID)"),
        uid,
    )
    await db.execute(
        text("DELETE FROM password_reset_token WHERE user_id = CAST(:uid AS UUID)"),
        uid,
    )
    await db.execute(
        text("DELETE FROM user_voice_preference WHERE user_id = CAST(:uid AS UUID)"),
        uid,
    )
    await db.execute(
        text("""
            UPDATE user_subscription
            SET    status = 'cancelled', updated_at = NOW()
            WHERE  user_id = CAST(:uid AS UUID) AND status = 'active'
        """),
        uid,
    )
    await db.execute(
        text("""
            UPDATE user_profile
            SET    name = NULL,
                   target_level = NULL,
                   learning_goal = NULL,
                   interests = NULL,
                   avatar_url = NULL,
                   daily_minutes = NULL,
                   words_per_session = NULL,
                   updated_at = NOW()
            WHERE  user_id = CAST(:uid AS UUID)
        """),
        uid,
    )
    r = await db.execute(
        text("""
            UPDATE users
            SET    status = 'deleted',
                   email = 'deleted+' || id::text || '@speakbuddi.invalid',
                   password_hash = NULL,
                   updated_at = NOW()
            WHERE  id = CAST(:uid AS UUID) AND status != 'deleted'
            RETURNING id::text
        """),
        uid,
    )
    if r.first() is None:
        return False

    await db.commit()
    return True
