# speak-buddi-be/routers/speaking_history.py
# ─── Speaking History API — lưu & xem lại lịch sử hội thoại free speaking ─────
#
# Endpoints:
#   POST   /api/speaking-history          → SpeakingHistoryOut  (lưu session)
#   GET    /api/speaking-history          → list[SpeakingHistoryOut]  (danh sách)
#   GET    /api/speaking-history/{id}     → SpeakingHistoryOut  (chi tiết)
#   DELETE /api/speaking-history/{id}     → 204
#
# Guard: Depends(current_user)
# ─────────────────────────────────────────────────────────────────────────────

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db

log = logging.getLogger("speakbuddi.speaking_history")

router = APIRouter(prefix="/api/speaking-history", tags=["speaking-history"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class MessageItem(BaseModel):
    role: str       # "user" | "assistant"
    content: str

class SpeakingHistoryCreate(BaseModel):
    title: str = "Free Speaking"
    messages: list[MessageItem]

class SpeakingHistoryOut(BaseModel):
    id: str
    title: str
    messages: list[dict]
    created_at: str


# ─── POST /api/speaking-history ───────────────────────────────────────────────

@router.post("", response_model=SpeakingHistoryOut, status_code=201)
async def save_speaking_session(
    req: SpeakingHistoryCreate,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> SpeakingHistoryOut:
    """Lưu toàn bộ tin nhắn của một phiên hội thoại free speaking."""
    if not req.messages:
        raise HTTPException(status_code=400, detail="Không có tin nhắn để lưu.")

    user_id = payload["sub"]
    import json
    messages_json = json.dumps([m.model_dump() for m in req.messages])

    result = await db.execute(
        text("""
            INSERT INTO speaking_history (user_id, title, messages)
            VALUES (:user_id, :title, :messages::jsonb)
            RETURNING id, title, messages, created_at
        """),
        {"user_id": user_id, "title": req.title[:200], "messages": messages_json},
    )
    row = result.mappings().one()
    await db.commit()

    log.info("SPEAKING_HISTORY save user=%s id=%s msgs=%d", user_id, row["id"], len(req.messages))

    return SpeakingHistoryOut(
        id=str(row["id"]),
        title=row["title"],
        messages=row["messages"],
        created_at=row["created_at"].isoformat(),
    )


# ─── GET /api/speaking-history ────────────────────────────────────────────────

@router.get("", response_model=list[SpeakingHistoryOut])
async def list_speaking_history(
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SpeakingHistoryOut]:
    """Trả danh sách lịch sử hội thoại của user (mới nhất trước, tối đa 50)."""
    user_id = payload["sub"]
    result = await db.execute(
        text("""
            SELECT id, title, messages, created_at
            FROM speaking_history
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 50
        """),
        {"user_id": user_id},
    )
    rows = result.mappings().all()
    return [
        SpeakingHistoryOut(
            id=str(r["id"]),
            title=r["title"],
            messages=r["messages"],
            created_at=r["created_at"].isoformat(),
        )
        for r in rows
    ]


# ─── GET /api/speaking-history/{id} ──────────────────────────────────────────

@router.get("/{history_id}", response_model=SpeakingHistoryOut)
async def get_speaking_session(
    history_id: str,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> SpeakingHistoryOut:
    user_id = payload["sub"]
    result = await db.execute(
        text("""
            SELECT id, title, messages, created_at
            FROM speaking_history
            WHERE id = :id AND user_id = :user_id
        """),
        {"id": history_id, "user_id": user_id},
    )
    row = result.mappings().one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên hội thoại.")

    return SpeakingHistoryOut(
        id=str(row["id"]),
        title=row["title"],
        messages=row["messages"],
        created_at=row["created_at"].isoformat(),
    )


# ─── DELETE /api/speaking-history/{id} ───────────────────────────────────────

@router.delete("/{history_id}", status_code=204)
async def delete_speaking_session(
    history_id: str,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    user_id = payload["sub"]
    result = await db.execute(
        text("""
            DELETE FROM speaking_history
            WHERE id = :id AND user_id = :user_id
        """),
        {"id": history_id, "user_id": user_id},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên hội thoại.")
    log.info("SPEAKING_HISTORY delete user=%s id=%s", user_id, history_id)
    return Response(status_code=204)
