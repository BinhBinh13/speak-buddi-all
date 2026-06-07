# speak-buddi-be/routers/admin_content.py
# ─── Admin Content API routes (S9.1) ─────────────────────────────────────────
#
# CRUD nội dung học cho Admin: Topic / Vocabulary (topic_word) / Vocabulary Test
# (kèm nested question/answer qua editor). Soft-delete (is_active=false) → S9.2.
#
# Endpoints:
#   GET  /api/admin/levels                  → list[LevelOut]            (dropdown)
#   GET  /api/admin/topics                  → list[TopicListItemOut]
#   POST /api/admin/topics                  → TopicListItemOut  (201)
#   GET  /api/admin/topics/{id}             → TopicOut
#   PUT  /api/admin/topics/{id}             → TopicOut
#   GET  /api/admin/words                   → AdminWordListOut  (phân trang)
#   POST /api/admin/words                   → TopicWordOut      (201)
#   GET  /api/admin/words/{id}              → TopicWordOut
#   PUT  /api/admin/words/{id}              → TopicWordOut
#   GET  /api/admin/tests                   → list[VocabularyTestAdminOut]
#   GET  /api/admin/tests/{id}              → TestEditorOut
#   POST /api/admin/tests                   → TestEditorOut     (201)
#   PUT  /api/admin/tests/{id}              → TestEditorOut
#   DELETE /api/admin/topics/{id}           → 204 soft-delete (S9.2)
#   DELETE /api/admin/words/{id}            → 204 soft-delete (S9.2)
#   DELETE /api/admin/tests/{id}            → 204 soft-delete (S9.2)
#
# Auth: dependencies=[Depends(require_admin)] — toàn bộ router chỉ role=admin (BR07).
# DB: SQLAlchemy async session từ Depends(get_db).
# Validation (nguồn sự thật AC-13-02 / §5.2):
#   - Trường bắt buộc rỗng (sau strip)  → 400 "Vui lòng điền đầy đủ thông tin."
#   - Trùng tên/slug topic              → 409 "Tên chủ đề đã tồn tại." / "Đường dẫn (slug) đã tồn tại."
#   - Trùng từ trong topic              → 409 "Từ này đã tồn tại trong chủ đề."
#   - Test phải có ≥1 câu hỏi; multiple_choice phải có ≥1 đáp án đúng → 400
# Pattern: bám routers/quiz.py + routers/learning.py
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

import logging
import uuid as uuid_mod

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import require_admin
from db.connection import get_db
from repositories import content_repo, quiz_repo
from schemas.learning import (
    LevelOut,
    TopicCreate,
    TopicUpdate,
    TopicOut,
    TopicListItemOut,
    TopicWordCreate,
    TopicWordUpdate,
    TopicWordOut,
)
from schemas.quiz import (
    VocabularyTestAdminOut,
    TestEditorIn,
    TestEditorOut,
    QuizQuestionOut,
    QuizAnswerOut,
)

log = logging.getLogger("speakbuddi.admin_content")

router = APIRouter(prefix="/api/admin", tags=["admin-content"], dependencies=[Depends(require_admin)])


# ═══════════════════════════════════════════════════════════════════════════════
# Validation helpers — nguồn sự thật cho AC-13-02 / §5.2
# ═══════════════════════════════════════════════════════════════════════════════

REQUIRED_FIELD_MSG = "Vui lòng điền đầy đủ thông tin."


def _require_text(*values: str | None) -> None:
    """
    Kiểm tra các field text bắt buộc không rỗng (sau strip).
    400 + message §5.2 nếu có field nào rỗng/None.
    """
    for v in values:
        if v is None or not v.strip():
            raise HTTPException(status_code=400, detail=REQUIRED_FIELD_MSG)


def _validate_question_type(question_type: str) -> None:
    valid = {"flashcard", "multiple_choice", "fill_blank", "grammar_mapping"}
    if question_type not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Loại câu hỏi không hợp lệ: {question_type}",
        )


def _validate_test_editor(body: TestEditorIn) -> None:
    """
    Validate payload editor test (AC-13-02 — nguồn sự thật BE):
      - title không rỗng
      - ≥1 câu hỏi
      - mỗi câu multiple_choice phải có ≥1 đáp án is_correct=True
      - question_type hợp lệ (Pydantic Literal đã chặn nhưng double-check rõ message)
    """
    _require_text(body.title)

    if not body.questions:
        raise HTTPException(
            status_code=400,
            detail="Bài kiểm tra phải có ít nhất 1 câu hỏi.",
        )

    for idx, q in enumerate(body.questions, start=1):
        _require_text(q.question_text)
        _validate_question_type(q.question_type)

        if q.question_type == "multiple_choice":
            if not any(a.is_correct for a in q.answers):
                raise HTTPException(
                    status_code=400,
                    detail=f"Câu hỏi {idx}: cần ít nhất 1 đáp án đúng (Missing Correct Answer).",
                )
            for a in q.answers:
                _require_text(a.answer_text)


# ═══════════════════════════════════════════════════════════════════════════════
# levels (dropdown)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/levels", response_model=list[LevelOut])
async def admin_list_levels(db: AsyncSession = Depends(get_db)) -> list[LevelOut]:
    """Danh sách 6 level A1–C2 cho dropdown trong form Admin."""
    rows = await content_repo.list_levels(db)
    return [LevelOut(**row) for row in rows]


# ═══════════════════════════════════════════════════════════════════════════════
# topics
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/topics", response_model=list[TopicListItemOut])
async def admin_list_topics(
    search: str | None = None,
    level_id: uuid_mod.UUID | None = None,
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
) -> list[TopicListItemOut]:
    """Danh sách topic cho Admin (kèm word_count); hỗ trợ search + filter level."""
    rows = await content_repo.list_topics(
        db,
        search=search,
        level_id=str(level_id) if level_id else None,
        include_inactive=include_inactive,
    )
    log.info("ADMIN_LIST_TOPICS  search=%s  level=%s  count=%d", search, level_id, len(rows))
    return [TopicListItemOut(**row) for row in rows]


@router.post("/topics", response_model=TopicListItemOut, status_code=201)
async def admin_create_topic(
    body: TopicCreate,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TopicListItemOut:
    """
    Tạo topic mới (AC-13-01).
    400 nếu thiếu trường bắt buộc; 409 nếu trùng tên/slug (AC-13-02).
    """
    _require_text(body.name, body.slug)

    if await content_repo.topic_name_exists(db, body.name):
        raise HTTPException(status_code=409, detail="Tên chủ đề đã tồn tại.")
    if await content_repo.topic_slug_exists(db, body.slug):
        raise HTTPException(status_code=409, detail="Đường dẫn (slug) đã tồn tại.")

    row = await content_repo.create_topic(db, body.model_dump(exclude={"level_id"}) | {
        "level_id": str(body.level_id) if body.level_id else None,
    })
    await db.commit()
    log.info("ADMIN_CREATE_TOPIC  admin=%s  topic=%s  name=%s", user["sub"], row["id"], row["name"])
    return TopicListItemOut(**row, word_count=0)


@router.get("/topics/{topic_id}", response_model=TopicOut)
async def admin_get_topic(
    topic_id: uuid_mod.UUID,
    db: AsyncSession = Depends(get_db),
) -> TopicOut:
    """Chi tiết topic — prefill form sửa. 404 nếu không tồn tại."""
    row = await content_repo.get_topic_by_id(db, str(topic_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return TopicOut(**row)


@router.put("/topics/{topic_id}", response_model=TopicOut)
async def admin_update_topic(
    topic_id: uuid_mod.UUID,
    body: TopicUpdate,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TopicOut:
    """
    Sửa topic (AC-13-01).
    400 nếu thiếu trường bắt buộc; 409 nếu trùng tên/slug với topic khác (AC-13-02).
    404 nếu topic không tồn tại.
    """
    _require_text(body.name, body.slug)

    existing = await content_repo.get_topic_by_id(db, str(topic_id))
    if existing is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    if await content_repo.topic_name_exists(db, body.name, exclude_id=str(topic_id)):
        raise HTTPException(status_code=409, detail="Tên chủ đề đã tồn tại.")
    if await content_repo.topic_slug_exists(db, body.slug, exclude_id=str(topic_id)):
        raise HTTPException(status_code=409, detail="Đường dẫn (slug) đã tồn tại.")

    row = await content_repo.update_topic(db, str(topic_id), {
        "name":          body.name,
        "slug":          body.slug,
        "level_id":      str(body.level_id) if body.level_id else None,
        "description":   body.description,
        "display_order": body.display_order,
    })
    await db.commit()
    log.info("ADMIN_UPDATE_TOPIC  admin=%s  topic=%s", user["sub"], topic_id)
    return TopicOut(**row)


# ═══════════════════════════════════════════════════════════════════════════════
# words (topic_word)
# ═══════════════════════════════════════════════════════════════════════════════

class AdminWordListOut(BaseModel):
    """Danh sách từ vựng phân trang cho Admin (S9.1 — Vocabulary table)."""

    items: list[TopicWordOut]
    total: int
    limit: int
    offset: int


@router.get("/words", response_model=AdminWordListOut)
async def admin_list_words(
    search: str | None = None,
    topic_id: uuid_mod.UUID | None = None,
    level_id: uuid_mod.UUID | None = None,
    include_inactive: bool = False,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> AdminWordListOut:
    """Danh sách từ vựng cho Admin (kèm topic/level), phân trang + search/filter."""
    rows, total = await content_repo.list_words(
        db,
        search=search,
        topic_id=str(topic_id) if topic_id else None,
        level_id=str(level_id) if level_id else None,
        include_inactive=include_inactive,
        limit=limit,
        offset=offset,
    )
    log.info("ADMIN_LIST_WORDS  search=%s  topic=%s  count=%d  total=%d", search, topic_id, len(rows), total)
    return AdminWordListOut(
        items=[TopicWordOut(**{**row, "tags": []}) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/words", response_model=TopicWordOut, status_code=201)
async def admin_create_word(
    body: TopicWordCreate,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TopicWordOut:
    """
    Tạo từ vựng mới trong topic (AC-13-01).
    400 nếu thiếu trường bắt buộc; 409 nếu trùng từ trong cùng topic (AC-13-02).
    404 nếu topic không tồn tại.
    """
    _require_text(body.word, body.meaning_vi)

    topic = await content_repo.get_topic_by_id(db, str(body.topic_id))
    if topic is None:
        raise HTTPException(status_code=404, detail="Chủ đề không tồn tại.")

    if await content_repo.word_exists_in_topic(db, str(body.topic_id), body.word):
        raise HTTPException(status_code=409, detail="Từ này đã tồn tại trong chủ đề.")

    data = body.model_dump(exclude={"topic_id", "level_id", "tag_ids"})
    data["topic_id"] = str(body.topic_id)
    data["level_id"] = str(body.level_id) if body.level_id else None
    data["tag_ids"] = [str(t) for t in body.tag_ids]

    row = await content_repo.create_word(db, data, created_by=user["sub"])
    await db.commit()
    log.info("ADMIN_CREATE_WORD  admin=%s  word=%s  topic=%s", user["sub"], row["id"], body.topic_id)
    return TopicWordOut(**{**row, "tags": []})


@router.get("/words/{word_id}", response_model=TopicWordOut)
async def admin_get_word(
    word_id: uuid_mod.UUID,
    db: AsyncSession = Depends(get_db),
) -> TopicWordOut:
    """Chi tiết từ vựng — prefill form sửa (kèm tag_ids). 404 nếu không tồn tại."""
    row = await content_repo.get_word_by_id(db, str(word_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Word not found")
    return TopicWordOut(**{**row, "tags": []})


@router.put("/words/{word_id}", response_model=TopicWordOut)
async def admin_update_word(
    word_id: uuid_mod.UUID,
    body: TopicWordUpdate,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TopicWordOut:
    """
    Sửa từ vựng (AC-13-01).
    400 nếu thiếu trường bắt buộc; 409 nếu trùng từ với từ khác trong cùng topic (AC-13-02).
    404 nếu từ hoặc topic không tồn tại.
    """
    _require_text(body.word, body.meaning_vi)

    existing = await content_repo.get_word_by_id(db, str(word_id))
    if existing is None:
        raise HTTPException(status_code=404, detail="Word not found")

    topic = await content_repo.get_topic_by_id(db, str(body.topic_id))
    if topic is None:
        raise HTTPException(status_code=404, detail="Chủ đề không tồn tại.")

    if await content_repo.word_exists_in_topic(db, str(body.topic_id), body.word, exclude_id=str(word_id)):
        raise HTTPException(status_code=409, detail="Từ này đã tồn tại trong chủ đề.")

    data = body.model_dump(exclude={"topic_id", "level_id", "tag_ids"})
    data["topic_id"] = str(body.topic_id)
    data["level_id"] = str(body.level_id) if body.level_id else None
    data["tag_ids"] = [str(t) for t in body.tag_ids]

    row = await content_repo.update_word(db, str(word_id), data)
    await db.commit()
    log.info("ADMIN_UPDATE_WORD  admin=%s  word=%s", user["sub"], word_id)
    return TopicWordOut(**{**row, "tags": []})


# ═══════════════════════════════════════════════════════════════════════════════
# tests (vocabulary_test + nested question/answer)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/tests", response_model=list[VocabularyTestAdminOut])
async def admin_list_tests(
    search: str | None = None,
    topic_id: uuid_mod.UUID | None = None,
    level_id: uuid_mod.UUID | None = None,
    include_inactive: bool = True,
    db: AsyncSession = Depends(get_db),
) -> list[VocabularyTestAdminOut]:
    """Danh sách bài kiểm tra cho Admin (kèm question_count + attempt_count)."""
    rows = await quiz_repo.list_tests_admin(
        db,
        search=search,
        topic_id=str(topic_id) if topic_id else None,
        level_id=str(level_id) if level_id else None,
        include_inactive=include_inactive,
    )
    log.info("ADMIN_LIST_TESTS  search=%s  count=%d", search, len(rows))
    return [VocabularyTestAdminOut(**row) for row in rows]


async def _build_test_editor_out(db: AsyncSession, test_row: dict) -> TestEditorOut:
    """Helper dựng TestEditorOut từ test row + questions/answers (dùng chung GET/POST/PUT)."""
    questions_raw = await quiz_repo.get_questions_by_test(db, test_row["id"])
    questions = [
        QuizQuestionOut(
            id=q["id"],
            vocabulary_test_id=q["vocabulary_test_id"],
            topic_word_id=q.get("topic_word_id"),
            question_text=q["question_text"],
            question_type=q["question_type"],
            display_order=q["display_order"],
            answers=[QuizAnswerOut(**a) for a in q.get("answers", [])],
        )
        for q in questions_raw
    ]
    return TestEditorOut(**test_row, questions=questions)


@router.get("/tests/{test_id}", response_model=TestEditorOut)
async def admin_get_test(
    test_id: uuid_mod.UUID,
    db: AsyncSession = Depends(get_db),
) -> TestEditorOut:
    """Chi tiết bài kiểm tra kèm toàn bộ câu hỏi + đáp án — màn editor. 404 nếu không tồn tại."""
    test_row = await quiz_repo.get_test_by_id(db, str(test_id))
    if test_row is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return await _build_test_editor_out(db, test_row)


@router.post("/tests", response_model=TestEditorOut, status_code=201)
async def admin_create_test(
    body: TestEditorIn,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TestEditorOut:
    """
    Tạo bài kiểm tra mới kèm nested question/answer (AC-13-01).
    400 nếu thiếu trường bắt buộc / không có câu hỏi / multiple_choice thiếu đáp án đúng.
    """
    _validate_test_editor(body)

    test_row = await quiz_repo.create_test(db, {
        "topic_id":    str(body.topic_id) if body.topic_id else None,
        "level_id":    str(body.level_id) if body.level_id else None,
        "title":       body.title,
        "description": body.description,
        "created_by":  user["sub"],
    })

    for idx, q in enumerate(body.questions):
        await quiz_repo.create_question_with_answers(
            db,
            question_data={
                "vocabulary_test_id": test_row["id"],
                "topic_word_id":      str(q.topic_word_id) if q.topic_word_id else None,
                "question_text":      q.question_text,
                "question_type":      q.question_type,
                "display_order":      q.display_order or idx,
            },
            answers_data=[
                {"answer_text": a.answer_text, "is_correct": a.is_correct, "display_order": a.display_order or j}
                for j, a in enumerate(q.answers)
            ],
        )

    await db.commit()
    log.info("ADMIN_CREATE_TEST  admin=%s  test=%s  questions=%d", user["sub"], test_row["id"], len(body.questions))

    refreshed = await quiz_repo.get_test_by_id(db, test_row["id"])
    return await _build_test_editor_out(db, refreshed)


@router.put("/tests/{test_id}", response_model=TestEditorOut)
async def admin_update_test(
    test_id: uuid_mod.UUID,
    body: TestEditorIn,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TestEditorOut:
    """
    Sửa bài kiểm tra + đồng bộ toàn bộ question/answer (AC-13-01 — màn editor Save Changes).
    400 nếu thiếu trường bắt buộc / không có câu hỏi / multiple_choice thiếu đáp án đúng.
    404 nếu test không tồn tại.

    MVP sync strategy: replace toàn bộ question/answer (xem note trong quiz_repo.replace_questions_for_test).
    """
    _validate_test_editor(body)

    existing = await quiz_repo.get_test_by_id(db, str(test_id))
    if existing is None:
        raise HTTPException(status_code=404, detail="Test not found")

    updated = await quiz_repo.update_test(db, str(test_id), {
        "topic_id":    str(body.topic_id) if body.topic_id else None,
        "level_id":    str(body.level_id) if body.level_id else None,
        "title":       body.title,
        "description": body.description,
    })

    questions_payload = [
        {
            "topic_word_id": str(q.topic_word_id) if q.topic_word_id else None,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "display_order": q.display_order or idx,
            "answers": [
                {"answer_text": a.answer_text, "is_correct": a.is_correct, "display_order": a.display_order or j}
                for j, a in enumerate(q.answers)
            ],
        }
        for idx, q in enumerate(body.questions)
    ]
    await quiz_repo.replace_questions_for_test(db, str(test_id), questions_payload)

    await db.commit()
    log.info("ADMIN_UPDATE_TEST  admin=%s  test=%s  questions=%d", user["sub"], test_id, len(body.questions))

    return await _build_test_editor_out(db, updated)


# ═══════════════════════════════════════════════════════════════════════════════
# Soft delete (S9.2 — AC-13-03 / §5.3)
# ═══════════════════════════════════════════════════════════════════════════════

@router.delete("/topics/{topic_id}", status_code=204)
async def admin_disable_topic(
    topic_id: uuid_mod.UUID,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Vô hiệu hóa topic (soft delete is_active=false). 404 nếu không tồn tại."""
    ok = await content_repo.soft_delete_topic(db, str(topic_id))
    if not ok:
        raise HTTPException(status_code=404, detail="Topic not found")
    await db.commit()
    log.info("ADMIN_DISABLE_TOPIC  admin=%s  topic=%s", user["sub"], topic_id)
    return Response(status_code=204)


@router.delete("/words/{word_id}", status_code=204)
async def admin_disable_word(
    word_id: uuid_mod.UUID,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Vô hiệu hóa từ vựng (soft delete is_active=false). 404 nếu không tồn tại."""
    ok = await content_repo.soft_delete_word(db, str(word_id))
    if not ok:
        raise HTTPException(status_code=404, detail="Word not found")
    await db.commit()
    log.info("ADMIN_DISABLE_WORD  admin=%s  word=%s", user["sub"], word_id)
    return Response(status_code=204)


@router.delete("/tests/{test_id}", status_code=204)
async def admin_disable_test(
    test_id: uuid_mod.UUID,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Vô hiệu hóa bài kiểm tra (soft delete is_active=false). 404 nếu không tồn tại."""
    ok = await quiz_repo.soft_delete_test(db, str(test_id))
    if not ok:
        raise HTTPException(status_code=404, detail="Test not found")
    await db.commit()
    log.info("ADMIN_DISABLE_TEST  admin=%s  test=%s", user["sub"], test_id)
    return Response(status_code=204)


@router.patch("/topics/{topic_id}/enable", response_model=TopicOut)
async def admin_enable_topic(
    topic_id: uuid_mod.UUID,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TopicOut:
    """Kích hoạt lại topic đã disable (S9.5 — AC-13-06)."""
    row = await content_repo.enable_topic(db, str(topic_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    await db.commit()
    log.info("ADMIN_ENABLE_TOPIC  admin=%s  topic=%s", user["sub"], topic_id)
    return TopicOut(**row)


@router.patch("/words/{word_id}/enable", response_model=TopicWordOut)
async def admin_enable_word(
    word_id: uuid_mod.UUID,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TopicWordOut:
    """Kích hoạt lại từ vựng đã disable (S9.5)."""
    row = await content_repo.enable_word(db, str(word_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Word not found")
    await db.commit()
    log.info("ADMIN_ENABLE_WORD  admin=%s  word=%s", user["sub"], word_id)
    return TopicWordOut(**{**row, "tags": []})


@router.patch("/tests/{test_id}/enable", status_code=204)
async def admin_enable_test(
    test_id: uuid_mod.UUID,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Kích hoạt lại bài kiểm tra đã disable (S9.5)."""
    ok = await quiz_repo.enable_test(db, str(test_id))
    if not ok:
        raise HTTPException(status_code=404, detail="Test not found")
    await db.commit()
    log.info("ADMIN_ENABLE_TEST  admin=%s  test=%s", user["sub"], test_id)
    return Response(status_code=204)
