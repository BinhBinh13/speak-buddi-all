# speak-buddi-be/repositories/voice_repo.py
# ─── Repository cho elevenlabs_voice_model / user_voice_preference (S8.4) ────

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def list_active_voice_models(db: AsyncSession) -> list[dict]:
    r = await db.execute(
        text("""
            SELECT id::text,
                   voice_id,
                   model_id,
                   display_name,
                   accent,
                   gender,
                   is_pro
            FROM   elevenlabs_voice_model
            WHERE  is_active = TRUE
            ORDER  BY sort_order ASC, display_name ASC
        """)
    )
    return [dict(row) for row in r.mappings().all()]


async def get_voice_model(db: AsyncSession, voice_model_id: str) -> dict | None:
    r = await db.execute(
        text("""
            SELECT id::text,
                   voice_id,
                   model_id,
                   display_name,
                   accent,
                   gender,
                   is_pro
            FROM   elevenlabs_voice_model
            WHERE  id = CAST(:voice_model_id AS UUID)
              AND  is_active = TRUE
        """),
        {"voice_model_id": voice_model_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_user_preference(db: AsyncSession, user_id: str) -> dict | None:
    r = await db.execute(
        text("""
            SELECT uvp.voice_model_id::text,
                   vm.id::text          AS id,
                   vm.voice_id,
                   vm.model_id,
                   vm.display_name,
                   vm.accent,
                   vm.gender,
                   vm.is_pro
            FROM   user_voice_preference uvp
            JOIN   elevenlabs_voice_model vm ON vm.id = uvp.voice_model_id
            WHERE  uvp.user_id = CAST(:user_id AS UUID)
              AND  vm.is_active = TRUE
        """),
        {"user_id": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def set_user_preference(
    db: AsyncSession,
    user_id: str,
    voice_model_id: str,
) -> dict | None:
    await db.execute(
        text("""
            INSERT INTO user_voice_preference (user_id, voice_model_id)
            VALUES (CAST(:user_id AS UUID), CAST(:voice_model_id AS UUID))
            ON CONFLICT (user_id) DO UPDATE
                SET voice_model_id = EXCLUDED.voice_model_id,
                    updated_at     = NOW()
        """),
        {"user_id": user_id, "voice_model_id": voice_model_id},
    )
    await db.commit()
    return await get_user_preference(db, user_id)


async def get_voice_id_for_user(
    db: AsyncSession,
    user_id: str,
) -> tuple[str | None, str | None]:
    pref = await get_user_preference(db, user_id)
    if not pref:
        return None, None
    return pref.get("voice_id"), pref.get("model_id")
