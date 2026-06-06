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
           p.learning_goal       AS goal
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
                   p.learning_goal      AS goal
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
    user_row.update({"name": name, "level": None, "goal": None})
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
