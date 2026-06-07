import io
import logging
import time
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user, optional_current_user
from db.connection import get_db
from repositories import voice_repo
from repositories.quota_repo import add_used_seconds, get_or_create_active_window, get_quota_status
from schemas.ai import SpeakRequest, SpeakTextFallbackOut, TTSRequest
from services.ai_service import get_ai_reply
from services.tts_service import text_to_audio_bytes

log = logging.getLogger("speakbuddi.ai")

router = APIRouter(tags=["ai"])

# ── Fallback delta khi FE không gửi elapsed_seconds (S7.2) ───────────────────
_FALLBACK_DELTA_SECONDS = 30


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
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    mode = f"topic:{req.topic.label}" if req.topic else f"free:{req.context}"
    log.info("SPEAK  mode=%s  text=%r  history_len=%d", mode, req.text[:80], len(req.history))

    # ── Quota guard (AC-09-01/02, BR02/03) ───────────────────────────────────
    is_paid = user.get("is_paid", False)
    window  = None   # sẽ dùng sau để cộng thời gian

    if not is_paid:
        # Free user — kiểm quota trước khi gọi AI
        window = await get_or_create_active_window(db, user["sub"])
        if window["used_seconds"] >= window["max_seconds"]:
            # Đã hết quota trong cửa sổ hiện tại → 429 (AC-09-02)
            raise HTTPException(
                status_code=429,
                detail={
                    "code":         "quota_exceeded",
                    "message":      (
                        "⏱ Bạn đã dùng hết 15 phút luyện nói. "
                        "Vui lòng quay lại sau khi quota được reset "
                        "hoặc nâng lên Pro để luyện không giới hạn."
                    ),
                    "reset_at":     window["window_end_at"].isoformat(),
                    "used_seconds": window["used_seconds"],
                    "max_seconds":  window["max_seconds"],
                },
            )

    # ── Bước 1: gọi Anthropic ─────────────────────────────────────────────────
    try:
        reply_text = get_ai_reply(req.text, req.context, req.topic, req.history)
    except Exception as exc:
        log.error("Claude error: %s", exc)
        # Trả 502 kèm service="anthropic" để FE biết cần retry (AC-09-04)
        raise HTTPException(
            status_code=502,
            detail={"message": "AI service error", "service": "anthropic"},
        )

    voice_id, model_id = await _resolve_voice_params(db, user)

    # ── Bước 2: gọi ElevenLabs TTS ───────────────────────────────────────────
    try:
        audio_bytes = text_to_audio_bytes(reply_text, voice_id=voice_id, model_id=model_id)
    except Exception as exc:
        log.error("TTS error: %s", exc)
        # TTS lỗi nhưng Claude đã trả text → degrade: 200 JSON thay vì 502
        # FE phát hiện qua Content-Type application/json và tts_error=true
        # Vẫn cộng thời gian vì AI đã phục vụ (AC-09-01)
        if not is_paid and window:
            delta = req.elapsed_seconds if req.elapsed_seconds > 0 else _FALLBACK_DELTA_SECONDS
            await add_used_seconds(db, window["id"], delta)

        fallback = SpeakTextFallbackOut(reply_text=reply_text, audio=None, tts_error=True)
        return JSONResponse(content=fallback.model_dump(), status_code=200)

    # ── Cộng thời gian đã dùng cho free user (AC-09-01) ──────────────────────
    if not is_paid and window:
        delta = req.elapsed_seconds if req.elapsed_seconds > 0 else _FALLBACK_DELTA_SECONDS
        await add_used_seconds(db, window["id"], delta)

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
    t0 = time.perf_counter()
    log.info("TTS_REQUEST  text=%r  chars=%d", req.text[:80], len(req.text))
    voice_id, model_id = await _resolve_voice_params(db, user)
    try:
        audio_bytes = text_to_audio_bytes(req.text, voice_id=voice_id, model_id=model_id)
    except Exception as exc:
        log.error("TTS_ERROR  text=%r  latency_ms=%.0f  error=%s",
                  req.text[:80], (time.perf_counter() - t0) * 1000, exc)
        raise HTTPException(status_code=502, detail="TTS service error")
    log.info("TTS_DONE  text=%r  bytes=%d  latency_ms=%.0f",
             req.text[:80], len(audio_bytes), (time.perf_counter() - t0) * 1000)
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")


@router.get("/api/ai/quota")
async def get_quota_endpoint(
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trả trạng thái quota AI của user hiện tại.

    Paid user → unlimited=True, không trừ quota.
    Free user → trả used_seconds, max_seconds, remaining_seconds, reset_at.
    """
    if user.get("is_paid", False):
        return {
            "is_paid":           True,
            "unlimited":         True,
            "used_seconds":      0,
            "max_seconds":       900,
            "remaining_seconds": 900,
            "reset_at":          None,
            "is_exceeded":       False,
        }

    status = await get_quota_status(db, user["sub"])
    return {
        "is_paid":  False,
        "unlimited": False,
        **status,
    }
