import io
import logging
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import optional_current_user
from db.connection import get_db
from repositories import voice_repo
from schemas.ai import SpeakRequest, TTSRequest
from services.ai_service import get_ai_reply
from services.tts_service import text_to_audio_bytes

log = logging.getLogger("speakbuddi.ai")

router = APIRouter(tags=["ai"])


async def _resolve_voice_params(
    db: AsyncSession,
    user: dict | None,
) -> tuple[str | None, str | None]:
    if not user:
        return None, None
    user_id = user.get("sub")
    if not user_id:
        return None, None
    return await voice_repo.get_voice_id_for_user(db, user_id)


@router.post("/speak")
async def speak(
    req: SpeakRequest,
    user: dict | None = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    mode = f"topic:{req.topic.label}" if req.topic else f"free:{req.context}"
    log.info("SPEAK  mode=%s  text=%r  history_len=%d", mode, req.text[:80], len(req.history))

    try:
        reply_text = get_ai_reply(req.text, req.context, req.topic, req.history)
    except Exception as exc:
        log.error("Claude error: %s", exc)
        raise HTTPException(status_code=502, detail="AI service error")

    voice_id, model_id = await _resolve_voice_params(db, user)

    try:
        audio_bytes = text_to_audio_bytes(reply_text, voice_id=voice_id, model_id=model_id)
    except Exception as exc:
        log.error("TTS error: %s", exc)
        raise HTTPException(status_code=502, detail="TTS service error")

    log.info("REPLY  %r", reply_text[:120])
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={"X-Reply-Text": quote(reply_text, safe="")},
    )


@router.post("/tts")
async def tts(
    req: TTSRequest,
    user: dict | None = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")
    log.info("TTS  text=%r", req.text[:80])

    voice_id, model_id = await _resolve_voice_params(db, user)

    try:
        audio_bytes = text_to_audio_bytes(req.text, voice_id=voice_id, model_id=model_id)
    except Exception as exc:
        log.error("TTS error: %s", exc)
        raise HTTPException(status_code=502, detail="TTS service error")
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")
