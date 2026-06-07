# speak-buddi-be/routers/translate.py
# ─── Translation API routes (S5.1 → S5.2) ────────────────────────────────────
#
# Endpoints:
#   POST /api/translate         → TranslateResponse  (AC-07-01, AC-07-02)
#   GET  /api/translate/history → TranslationHistoryResponse (AC-07-03)
#
# Auth: Depends(current_user) — JWT required for both endpoints.
#
# S5.2: Inject AsyncSession, gọi save_history sau khi dịch thành công.
#        Lỗi save_history không fail kết quả dịch (edge case AC-07-03).
# ─────────────────────────────────────────────────────────────────────────────

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import translate_repo
from schemas.translate import (
    TranslateRequest,
    TranslateResponse,
    TranslationHistoryItem,
    TranslationHistoryResponse,
)
from services.translate_service import translate_text

log = logging.getLogger("speakbuddi.translate")

router = APIRouter(prefix="/api", tags=["translate"])


@router.post("/translate", response_model=TranslateResponse)
async def translate(
    body: TranslateRequest,
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TranslateResponse:
    """
    Dịch văn bản English → Vietnamese (AC-07-01, AC-07-02).
    Sau khi dịch thành công, tự động lưu vào translation_history (AC-07-03).
    400 nếu input rỗng hoặc chỉ có whitespace.
    502 nếu Anthropic lỗi.
    Lỗi DB save_history không fail kết quả dịch.
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Input is empty")

    try:
        # translate_text là hàm đồng bộ (blocking) → bọc asyncio.to_thread
        # để không block event loop của FastAPI async.
        result = await asyncio.to_thread(translate_text, body.text)
    except Exception as exc:
        log.error("TRANSLATE_ERROR  %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Translation service error") from exc

    # Lưu history — lỗi DB không được fail kết quả dịch (AC-07-03 edge case)
    user_id: str | None = user.get("sub")
    if user_id:
        try:
            await translate_repo.save_history(
                db,
                user_id=user_id,
                source_text=body.text,
                target_text=result,
            )
        except Exception as exc:
            log.error("HISTORY_SAVE_ERROR  %s", type(exc).__name__)
            # Không raise — tiếp tục trả kết quả dịch bình thường

    return TranslateResponse(translation=result)


@router.get("/translate/history", response_model=TranslationHistoryResponse)
async def get_history(
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TranslationHistoryResponse:
    """
    Trả 20 bản dịch gần nhất của user đang login (AC-07-03).
    401 nếu không có JWT (Depends(current_user) tự xử lý).
    Mới nhất trước — phục vụ section lịch sử trên trang Dịch thuật.
    """
    user_id: str | None = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    items_raw = await translate_repo.get_history(db, user_id=user_id, limit=20)
    items = [TranslationHistoryItem(**row) for row in items_raw]
    return TranslationHistoryResponse(items=items)
