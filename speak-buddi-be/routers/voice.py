# speak-buddi-be/routers/voice.py
# ─── Voice settings API (S8.4 — UC11 / AC-11-01/02/03, BR06) ─────────────────

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import require_paid
from db.connection import get_db
from repositories import voice_repo
from schemas.voice import (
    SetVoicePreferenceRequest,
    VoiceModelOut,
    VoicePreferenceOut,
)

log = logging.getLogger("speakbuddi.voice")

router = APIRouter(prefix="/api/voice", tags=["voice"])


def _to_voice_out(row: dict) -> VoiceModelOut:
    return VoiceModelOut(
        id=row["id"],
        voice_id=row["voice_id"],
        model_id=row["model_id"],
        display_name=row["display_name"],
        accent=row.get("accent"),
        gender=row.get("gender"),
        is_pro=bool(row.get("is_pro")),
    )


@router.get("/models", response_model=list[VoiceModelOut])
async def list_models(
    user: dict = Depends(require_paid),
    db: AsyncSession = Depends(get_db),
) -> list[VoiceModelOut]:
    """AC-11-01: danh sách voice ElevenLabs đang active — chỉ Paid User."""
    _ = user
    rows = await voice_repo.list_active_voice_models(db)
    return [_to_voice_out(r) for r in rows]


@router.get("/preference", response_model=VoicePreferenceOut)
async def get_preference(
    user: dict = Depends(require_paid),
    db: AsyncSession = Depends(get_db),
) -> VoicePreferenceOut:
    pref = await voice_repo.get_user_preference(db, user["sub"])
    if not pref:
        return VoicePreferenceOut(voice_model_id=None, voice=None)
    voice = _to_voice_out(pref)
    return VoicePreferenceOut(voice_model_id=pref["voice_model_id"], voice=voice)


@router.put("/preference", response_model=VoicePreferenceOut)
async def set_preference(
    body: SetVoicePreferenceRequest,
    user: dict = Depends(require_paid),
    db: AsyncSession = Depends(get_db),
) -> VoicePreferenceOut:
    voice = await voice_repo.get_voice_model(db, body.voice_model_id)
    if not voice:
        raise HTTPException(status_code=404, detail="Giọng đọc không tồn tại hoặc đã bị vô hiệu hóa.")

    pref = await voice_repo.set_user_preference(db, user["sub"], body.voice_model_id)
    log.info(
        "VOICE_PREF_SET user=%s voice_model=%s",
        user["sub"],
        body.voice_model_id,
    )
    voice_out = _to_voice_out(voice)
    return VoicePreferenceOut(voice_model_id=body.voice_model_id, voice=voice_out)
