# speak-buddi-be/routers/session.py
# ─── Session progress + User topic list API routes (S2.5) ─────────────────────
#
# Endpoints:
#   GET  /api/topics/{topic_id}/session-summary   → TopicSessionSummaryOut
#   PUT  /api/topics/{topic_id}/sessions/progress → SessionProgressOut
#   GET  /api/topics/{topic_id}/conversations/{batch_index} → ConversationTranscriptOut
#   PUT  /api/topics/{topic_id}/conversations/{batch_index} → ConversationTranscriptOut
#   DELETE /api/topics/{topic_id}/conversations/{batch_index} → 204
#   POST /api/user/topics                         → UserTopicOut
#   DELETE /api/user/topics/{topic_id}            → 204
#   GET  /api/user/topics                         → list[UserTopicOut]
#
# Tất cả đều guard JWT (current_user).
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import session_repo
from schemas.learning import (
    ConversationTranscriptOut,
    ConversationTranscriptUpsert,
    SessionProgressOut,
    SessionProgressUpsert,
    TopicSessionSummaryOut,
    UserTopicOut,
)

log = logging.getLogger("speakbuddi.session")

router = APIRouter(prefix="/api", tags=["sessions"])


# ─── GET /api/topics/{topic_id}/session-summary ──────────────────────────────

@router.get(
    "/topics/{topic_id}/session-summary",
    response_model=TopicSessionSummaryOut,
)
async def get_topic_session_summary(
    topic_id: str,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TopicSessionSummaryOut:
    """Trả thông tin batch để FE tính navigate sang AI conversation.
    404 nếu topic không tồn tại hoặc inactive.
    """
    user_id = payload["sub"]
    summary = await session_repo.get_topic_session_summary(db, user_id, topic_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Topic not found or inactive")

    log.info("SESSION_SUMMARY  user=%s  topic=%s  batches=%d", user_id, topic_id, summary["total_batches"])
    return TopicSessionSummaryOut(**summary)


# ─── PUT /api/topics/{topic_id}/sessions/progress ────────────────────────────

@router.put(
    "/topics/{topic_id}/sessions/progress",
    response_model=SessionProgressOut,
)
async def upsert_session_progress(
    topic_id: str,
    body: SessionProgressUpsert,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionProgressOut:
    """Upsert tiến độ batch session AI conversation."""
    user_id = payload["sub"]
    row = await session_repo.upsert_session_progress(
        db, user_id, topic_id,
        body.batch_index, body.batch_size, body.status,
    )
    return SessionProgressOut(**row)


# ─── GET /api/topics/{topic_id}/conversations/{batch_index} ──────────────────

@router.get(
    "/topics/{topic_id}/conversations/{batch_index}",
    response_model=ConversationTranscriptOut,
)
async def get_conversation_transcript(
    topic_id: str,
    batch_index: int,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationTranscriptOut:
    """Lấy transcript hội thoại đã lưu. Trả messages=[] nếu chưa có."""
    user_id = payload["sub"]
    row = await session_repo.get_conversation_transcript(db, user_id, topic_id, batch_index)
    if row is None:
        return ConversationTranscriptOut(
            topic_id=topic_id,
            batch_index=batch_index,
            messages=[],
            covered_words=[],
            batch_done=False,
            updated_at=None,
        )
    return ConversationTranscriptOut(**row)


# ─── PUT /api/topics/{topic_id}/conversations/{batch_index} ──────────────────

@router.put(
    "/topics/{topic_id}/conversations/{batch_index}",
    response_model=ConversationTranscriptOut,
)
async def upsert_conversation_transcript(
    topic_id: str,
    batch_index: int,
    body: ConversationTranscriptUpsert,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationTranscriptOut:
    """Lưu / cập nhật transcript hội thoại AI."""
    user_id = payload["sub"]
    messages = [m.model_dump() for m in body.messages]
    row = await session_repo.upsert_conversation_transcript(
        db,
        user_id,
        topic_id,
        batch_index,
        messages,
        body.covered_words,
        body.batch_done,
    )
    return ConversationTranscriptOut(**row)


# ─── DELETE /api/topics/{topic_id}/conversations/{batch_index} ───────────────

@router.delete("/topics/{topic_id}/conversations/{batch_index}", status_code=204)
async def delete_conversation_transcript(
    topic_id: str,
    batch_index: int,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Xoá transcript (khi hoàn thành batch / reset phiên)."""
    user_id = payload["sub"]
    await session_repo.delete_conversation_transcript(db, user_id, topic_id, batch_index)
    return Response(status_code=204)


# ─── POST /api/user/topics ────────────────────────────────────────────────────

@router.post("/user/topics", response_model=UserTopicOut, status_code=200)
async def add_user_topic(
    body: dict,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UserTopicOut:
    """Thêm topic vào danh sách học của user.
    Trả 200 cả khi đã tồn tại (idempotent từ phía client).
    404 nếu topic inactive / không tồn tại.
    """
    topic_id = body.get("topic_id")
    if not topic_id:
        raise HTTPException(status_code=422, detail="topic_id required")

    user_id = payload["sub"]
    await session_repo.add_user_topic(db, user_id, topic_id)

    # Lấy lại để trả đúng UserTopicOut (luôn trả về dù đã có hay mới add)
    topics = await session_repo.get_user_topics(db, user_id)
    found = next((t for t in topics if t["topic_id"] == topic_id), None)
    if found is None:
        # topic inactive — add_user_topic trả False khi validate thất bại
        raise HTTPException(status_code=404, detail="Topic not found or inactive")

    return UserTopicOut(**found)


# ─── DELETE /api/user/topics/{topic_id} ──────────────────────────────────────

@router.delete("/user/topics/{topic_id}", status_code=204)
async def remove_user_topic(
    topic_id: str,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Xoá topic khỏi danh sách học. 204 No Content."""
    user_id = payload["sub"]
    await session_repo.remove_user_topic(db, user_id, topic_id)
    return Response(status_code=204)


# ─── GET /api/user/topics ─────────────────────────────────────────────────────

@router.get("/user/topics", response_model=list[UserTopicOut])
async def get_user_topics(
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserTopicOut]:
    """Danh sách topic user đã add vào danh sách học."""
    user_id = payload["sub"]
    rows = await session_repo.get_user_topics(db, user_id)
    return [UserTopicOut(**r) for r in rows]
