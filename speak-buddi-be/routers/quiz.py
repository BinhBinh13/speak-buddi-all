# speak-buddi-be/routers/quiz.py
# ─── Quiz/Test API routes (S4.2 + S4.3 + S4.4) ───────────────────────────────
#
# Endpoints:
#   GET  /api/tests?topic_id={uuid}              → list[VocabularyTestOut]
#   GET  /api/tests/{test_id}                    → VocabularyTestOut  (404 nếu inactive)
#   GET  /api/tests/{test_id}/questions          → list[QuizQuestionOut]
#   POST /api/tests/{test_id}/attempts           → QuizAttemptOut  (S4.3)
#   POST /api/attempts/{attempt_id}/submit       → QuizAttemptOut  (S4.3)
#   GET  /api/attempts/{attempt_id}/result       → QuizAttemptResultOut  (S4.4)
#
# Auth: Depends(current_user) — đồng nhất với /api/auth/me.
# DB: SQLAlchemy async session từ Depends(get_db).
# Pattern: bám routers/learning.py
# ─────────────────────────────────────────────────────────────────────────────

import logging
import uuid as uuid_mod

from fastapi import APIRouter, Depends, HTTPException

from auth.deps import current_user
from db.connection import get_db
from repositories import quiz_repo
from schemas.quiz import (
    VocabularyTestOut,
    VocabularyTestWithAttemptCountOut,
    QuizQuestionOut,
    QuizAnswerOut,
    QuizAttemptOut,
    QuizSubmitRequest,
    QuizAttemptResultOut,
    QuizAnswerReview,
)
from services.quiz_service import check_fill_blank_answer, calculate_score

from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger("speakbuddi.quiz")

router = APIRouter(prefix="/api", tags=["quiz"])


# ─── GET /api/tests?topic_id={uuid}&level_id={uuid} ─────────────────────────
# S4.5: mở rộng filter — hỗ trợ cả topic_id và level_id (optional).
# Kèm attempt_count: số lần user đã làm mỗi bài (status='submitted').

@router.get("/tests", response_model=list[VocabularyTestWithAttemptCountOut])
async def list_tests(
    topic_id: uuid_mod.UUID | None = None,
    level_id: uuid_mod.UUID | None = None,
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[VocabularyTestWithAttemptCountOut]:
    """
    Trả danh sách bài kiểm tra active, lọc theo topic_id và/hoặc level_id.
    Kèm attempt_count: số lần user hiện tại đã làm mỗi bài (status='submitted').
    Nếu không truyền filter → trả tất cả bài active.
    Backward-compat: caller cũ truyền topic_id vẫn hoạt động.
    """
    rows = await quiz_repo.get_tests_by_filter(
        db,
        topic_id=str(topic_id) if topic_id else None,
        level_id=str(level_id) if level_id else None,
    )
    log.info(
        "LIST_TESTS  topic=%s  level=%s  count=%d",
        topic_id, level_id, len(rows),
    )
    if not rows:
        return []

    test_ids = [r["id"] for r in rows]
    count_map = await quiz_repo.get_attempt_count_by_user(db, user["sub"], test_ids)

    return [
        VocabularyTestWithAttemptCountOut(
            **row,
            attempt_count=count_map.get(row["id"], 0),
        )
        for row in rows
    ]


# ─── GET /api/tests/{test_id} ────────────────────────────────────────────────

@router.get("/tests/{test_id}", response_model=VocabularyTestOut)
async def get_test(
    test_id: uuid_mod.UUID,
    _user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> VocabularyTestOut:
    """
    Trả metadata 1 bài kiểm tra.
    404 nếu không tồn tại hoặc is_active = FALSE.
    """
    row = await quiz_repo.get_test_by_id(db, str(test_id))
    if row is None or not row.get("is_active", False):
        raise HTTPException(status_code=404, detail="Test not found or inactive")
    log.info("GET_TEST  test=%s", test_id)
    return VocabularyTestOut(**row)


# ─── GET /api/tests/{test_id}/questions ──────────────────────────────────────

@router.get("/tests/{test_id}/questions", response_model=list[QuizQuestionOut])
async def get_test_questions(
    test_id: uuid_mod.UUID,
    _user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[QuizQuestionOut]:
    """
    Trả toàn bộ câu hỏi + đáp án của bài kiểm tra.
    404 nếu test không tồn tại.
    Trả list rỗng nếu test không có câu hỏi nào.

    Lưu ý bảo mật (MVP): is_correct được trả về cho client — acceptable vì
    quiz mục đích học tập; S4.3 sẽ validate server-side khi submit.
    """
    # Kiểm tra test tồn tại (không kiểm tra is_active vì admin xem được)
    test_row = await quiz_repo.get_test_by_id(db, str(test_id))
    if test_row is None:
        raise HTTPException(status_code=404, detail="Test not found")

    questions = await quiz_repo.get_questions_by_test(db, str(test_id))

    result: list[QuizQuestionOut] = []
    for q in questions:
        answers = [QuizAnswerOut(**a) for a in q.get("answers", [])]
        result.append(QuizQuestionOut(
            id=q["id"],
            vocabulary_test_id=q["vocabulary_test_id"],
            topic_word_id=q.get("topic_word_id"),
            question_text=q["question_text"],
            question_type=q["question_type"],
            display_order=q["display_order"],
            answers=answers,
        ))

    log.info("GET_QUESTIONS  test=%s  count=%d", test_id, len(result))
    return result


# ─── POST /api/tests/{test_id}/attempts ──────────────────────────────────────

@router.post("/tests/{test_id}/attempts", response_model=QuizAttemptOut, status_code=201)
async def start_attempt(
    test_id: uuid_mod.UUID,
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> QuizAttemptOut:
    """
    Tạo lượt làm bài mới cho user (S4.3).
    404 nếu test không tồn tại hoặc is_active=FALSE.
    """
    test_row = await quiz_repo.get_test_by_id(db, str(test_id))
    if test_row is None or not test_row.get("is_active", False):
        raise HTTPException(status_code=404, detail="Test not found or inactive")

    questions = await quiz_repo.get_questions_by_test(db, str(test_id))
    total_q = len(questions)

    attempt = await quiz_repo.create_attempt(
        db, user_id=user["sub"], test_id=str(test_id), total_q=total_q
    )
    await db.commit()
    log.info("START_ATTEMPT  user=%s  test=%s  attempt=%s", user["sub"], test_id, attempt["id"])
    return QuizAttemptOut(**attempt)


# ─── POST /api/attempts/{attempt_id}/submit ──────────────────────────────────

@router.post("/attempts/{attempt_id}/submit", response_model=QuizAttemptOut)
async def submit_quiz(
    attempt_id: uuid_mod.UUID,
    body: QuizSubmitRequest,
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> QuizAttemptOut:
    """
    Nộp bài kiểm tra (S4.3).
    422 nếu số câu trả lời không khớp total_questions.
    403 nếu attempt không thuộc về user hiện tại.
    409 nếu attempt đã submitted.
    """
    attempt = await quiz_repo.get_attempt_by_id(db, str(attempt_id))
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt["user_id"] != user["sub"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if attempt["status"] != "in_progress":
        raise HTTPException(status_code=409, detail="Attempt already submitted")

    total_q = attempt["total_questions"]
    if len(body.answers) != total_q:
        raise HTTPException(
            status_code=422,
            detail=f"Expected {total_q} answers, got {len(body.answers)}",
        )

    # Load câu hỏi + đáp án để chấm điểm
    questions = await quiz_repo.get_questions_by_test(db, attempt["vocabulary_test_id"])
    q_map = {q["id"]: q for q in questions}  # question_id → question dict

    correct = 0
    wrong = 0

    for ans in body.answers:
        q_id = str(ans.quiz_question_id)
        q = q_map.get(q_id)
        if q is None:
            continue

        q_type = q["question_type"]
        is_correct = False

        if q_type == "flashcard":
            is_correct = True  # self-rating — user tự đánh giá

        elif q_type == "multiple_choice":
            if ans.quiz_answer_id:
                answer_id = str(ans.quiz_answer_id)
                matched = next(
                    (a for a in q.get("answers", []) if a["id"] == answer_id),
                    None,
                )
                is_correct = matched["is_correct"] if matched else False

        elif q_type == "fill_blank":
            correct_answer = next(
                (a for a in q.get("answers", []) if a.get("is_correct")),
                None,
            )
            if correct_answer and ans.text_answer:
                is_correct = check_fill_blank_answer(
                    ans.text_answer, correct_answer["answer_text"]
                )

        elif q_type == "grammar_mapping":
            # S4.3: self-grading — S4.4 có thể thêm proper pair-check
            is_correct = True

        if is_correct:
            correct += 1
        else:
            wrong += 1

        await quiz_repo.upsert_attempt_answer(
            db,
            attempt_id=str(attempt_id),
            question_id=q_id,
            answer_id=str(ans.quiz_answer_id) if ans.quiz_answer_id else None,
            text_answer=ans.text_answer,
            is_correct=is_correct,
        )

    score = calculate_score(correct, total_q)
    result = await quiz_repo.submit_attempt(db, str(attempt_id), correct, wrong, score)
    await db.commit()
    log.info("SUBMIT_ATTEMPT  attempt=%s  score=%.1f%%", attempt_id, score)
    return QuizAttemptOut(**result)


# ─── GET /api/attempts/{attempt_id}/result ───────────────────────────────────

@router.get("/attempts/{attempt_id}/result", response_model=QuizAttemptResultOut)
async def get_attempt_result(
    attempt_id: uuid_mod.UUID,
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> QuizAttemptResultOut:
    """
    Lấy kết quả đầy đủ 1 lượt làm bài (S4.4).
    403 nếu attempt không thuộc về user hiện tại.
    409 nếu attempt chưa submit (in_progress).
    """
    attempt = await quiz_repo.get_attempt_by_id(db, str(attempt_id))
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt["user_id"] != user["sub"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if attempt["status"] != "submitted":
        raise HTTPException(status_code=409, detail="Attempt not yet submitted")

    answers_raw = await quiz_repo.get_attempt_result(db, str(attempt_id))
    answers = [
        QuizAnswerReview(
            question_id=a["quiz_question_id"],
            question_text=a["question_text"],
            question_type=a["question_type"],
            user_answer_id=a.get("user_answer_id"),
            user_text_answer=a.get("user_text_answer"),
            correct_answer_text=a.get("correct_answer_text"),
            is_correct=a["is_correct"],
        )
        for a in answers_raw
    ]

    # Tính thời gian làm bài, guard max(0, ...) để tránh clock-skew âm
    duration = None
    if attempt.get("submitted_at") and attempt.get("started_at"):
        delta = attempt["submitted_at"] - attempt["started_at"]
        duration = max(0, int(delta.total_seconds()))

    log.info(
        "GET_RESULT  attempt=%s  score=%.1f%%  answers=%d",
        attempt_id,
        float(attempt["score_percent"]),
        len(answers),
    )
    return QuizAttemptResultOut(
        id=attempt["id"],
        vocabulary_test_id=attempt["vocabulary_test_id"],
        total_questions=attempt["total_questions"],
        correct_answers=attempt["correct_answers"],
        wrong_answers=attempt["wrong_answers"],
        score_percent=float(attempt["score_percent"]),
        status=attempt["status"],
        started_at=attempt["started_at"],
        submitted_at=attempt.get("submitted_at"),
        duration_seconds=duration,
        answers=answers,
    )
