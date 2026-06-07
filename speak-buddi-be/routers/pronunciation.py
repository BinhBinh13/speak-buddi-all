# speak-buddi-be/routers/pronunciation.py
# ─── Pronunciation endpoints (S6.2 scoring + S6.3 history) ───────────────────
#
# POST /api/pronunciation/score
#   - Guard JWT (current_user)
#   - 400 nếu transcript rỗng → FE map: "🎤 Không nghe thấy gì. Hãy thử nói lại."
#   - 502 nếu Anthropic lỗi → FE map: "🔄 AI đang bận, vui lòng thử lại sau vài giây."
#   - 401 nếu thiếu / sai JWT
#
# GET /api/pronunciation/history   (S6.3)
#   - Guard JWT; chỉ trả lịch sử của user trong token
#   - Query params: limit (1–100, default 20), offset (≥0, default 0)
# ─────────────────────────────────────────────────────────────────────────────

import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import pronunciation_repo
from schemas.pronunciation import (
    PronunciationAttemptOut,
    PronunciationHistoryOut,
    ScoreRequest,
    ScoreResponse,
)
from services.pronunciation_service import score_pronunciation

log = logging.getLogger("speakbuddi.pronunciation")

router = APIRouter(prefix="/api/pronunciation", tags=["pronunciation"])


@router.post("/score", response_model=ScoreResponse)
async def score(
    body:    ScoreRequest,
    payload: dict          = Depends(current_user),
    db:      AsyncSession  = Depends(get_db),
) -> ScoreResponse:
    """Chấm phát âm: nhận target_text + transcript, trả score + feedback + attempt_id.

    Luồng:
      1. Validate transcript không rỗng → 400.
      2. Gọi Anthropic service → dict kết quả.
      3. Lưu pronunciation_attempt + pronunciation_syllable_score vào DB.
      4. Trả ScoreResponse.
    """
    t0      = time.perf_counter()
    user_id = payload["sub"]

    # ── 1. Validate transcript ────────────────────────────────────────────────
    log.info(
        "SCORE_REQUEST  user=%s  target=%r  transcript_len=%d",
        user_id, body.target_text, len(body.transcript.strip()),
    )

    if not body.transcript.strip():
        log.warning(
            "SCORE_EMPTY_TRANSCRIPT  user=%s  target=%r",
            user_id, body.target_text,
        )
        raise HTTPException(
            status_code=400,
            detail="No audio / empty transcript",
        )

    # ── 2. Chấm phát âm qua Anthropic ────────────────────────────────────────
    t_ai = time.perf_counter()
    try:
        result = score_pronunciation(body.target_text, body.transcript)
    except Exception as exc:
        log.error(
            "SCORE_AI_ERROR  user=%s  target=%r  latency_ms=%.0f  error=%s",
            user_id, body.target_text, (time.perf_counter() - t_ai) * 1000, exc,
        )
        raise HTTPException(status_code=502, detail="AI scoring error")

    log.info(
        "SCORE_AI_DONE  user=%s  target=%r  overall=%.1f  accuracy=%.1f  fluency=%.1f  latency_ms=%.0f",
        user_id, body.target_text,
        result["overall"], result["accuracy"], result["fluency"],
        (time.perf_counter() - t_ai) * 1000,
    )

    # ── 3. Lưu vào DB (1 transaction: attempt → syllables → commit) ───────────
    try:
        attempt_id = await pronunciation_repo.insert_attempt(
            db,
            user_id       = user_id,
            target_text   = body.target_text,
            overall       = result["overall"],
            accuracy      = result["accuracy"],
            fluency       = result["fluency"],
            feedback      = result["feedback"],
            topic_word_id = body.topic_word_id,
        )
        await pronunciation_repo.insert_syllable_scores(
            db,
            attempt_id = attempt_id,
            syllables  = result["syllables"],
        )
        await db.commit()
    except Exception as exc:
        log.error(
            "SCORE_DB_ERROR  user=%s  target=%r  error=%s",
            user_id, body.target_text, exc,
        )
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save pronunciation attempt")

    total_ms = (time.perf_counter() - t0) * 1000
    log.info(
        "SCORE_DONE  user=%s  target=%r  attempt=%s  syllables=%d  total_ms=%.0f",
        user_id, body.target_text, attempt_id, len(result["syllables"]), total_ms,
    )

    # ── 4. Trả response ───────────────────────────────────────────────────────
    return ScoreResponse(
        attempt_id = attempt_id,
        overall    = result["overall"],
        accuracy   = result["accuracy"],
        fluency    = result["fluency"],
        syllables  = result["syllables"],
        feedback   = result["feedback"],
    )


# ─── GET /api/pronunciation/history (S6.3) ────────────────────────────────────

@router.get("/history", response_model=PronunciationHistoryOut)
async def get_history(
    limit:   int          = Query(default=20, ge=1, le=100),
    offset:  int          = Query(default=0,  ge=0),
    payload: dict         = Depends(current_user),
    db:      AsyncSession = Depends(get_db),
) -> PronunciationHistoryOut:
    """Lịch sử luyện phát âm của user hiện tại, sắp xếp theo thời gian mới nhất.

    Owner guard: chỉ trả dữ liệu của user trong JWT — không thể xem lịch sử người khác.
    Không log payload nhạy cảm (§4.5); chỉ log user_id + total.
    """
    user_id = payload["sub"]

    rows, total = await pronunciation_repo.list_attempts(db, user_id, limit=limit, offset=offset)

    items = [PronunciationAttemptOut(**row) for row in rows]

    log.info(
        "HISTORY_REQUEST  user=%s  total=%d  limit=%d  offset=%d",
        user_id, total, limit, offset,
    )

    return PronunciationHistoryOut(
        items  = items,
        total  = total,
        limit  = limit,
        offset = offset,
    )
