# speak-buddi-be/repositories/quiz_repo.py
# ─── Repository layer cho nhóm Quiz/Test ──────────────────────────────────────
#
# Phạm vi S4.1: raw SQL + text(), async, nhận AsyncSession
# Pattern: bám sát repositories/user_repo.py
#
# Dùng ở:
#   S4.2 — get_test_by_id, get_questions_by_test
#   S4.3 — create_attempt, upsert_attempt_answer
#   S4.4 — submit_attempt, get_answers_by_attempt
#   S4.5 — get_tests_by_topic, get_attempts_by_user_test
#   S9.1 — create_test, soft_delete_test, create_question_with_answers,
#          list_tests_admin, update_test, replace_questions_for_test
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ═══════════════════════════════════════════════════════════════════════════════
# vocabulary_test
# ═══════════════════════════════════════════════════════════════════════════════

async def get_tests_by_topic(db: AsyncSession, topic_id: str) -> list[dict]:
    """Lấy tất cả bài kiểm tra active của 1 topic (S4.5 — lọc test theo topic)."""
    r = await db.execute(
        text("""
            SELECT vt.id::text,
                   vt.topic_id::text,
                   vt.level_id::text,
                   l.code AS level_code,
                   vt.title,
                   vt.description,
                   vt.is_active,
                   vt.created_by::text,
                   vt.created_at
            FROM   vocabulary_test vt
            LEFT JOIN level l ON l.id = vt.level_id
            WHERE  vt.topic_id = CAST(:topic_id AS UUID)
              AND  vt.is_active = TRUE
            ORDER  BY vt.created_at ASC
        """),
        {"topic_id": topic_id},
    )
    return [dict(row) for row in r.mappings().all()]


async def get_tests_by_filter(
    db: AsyncSession,
    topic_id: str | None = None,
    level_id: str | None = None,
) -> list[dict]:
    """
    Lấy tất cả bài kiểm tra active, lọc theo topic và/hoặc level.
    Nếu cả 2 None → trả tất cả bài active (trang list không filter).
    S4.5 — AC-06-04: chỉ trả is_active=TRUE để dùng vocabulary mới nhất.
    """
    conditions = ["vt.is_active = TRUE"]
    params: dict = {}

    if topic_id:
        conditions.append("vt.topic_id = CAST(:topic_id AS UUID)")
        params["topic_id"] = topic_id
    if level_id:
        conditions.append("vt.level_id = CAST(:level_id AS UUID)")
        params["level_id"] = level_id

    where_clause = " AND ".join(conditions)
    sql = f"""
        SELECT vt.id::text,
               vt.topic_id::text,
               vt.level_id::text,
               l.code AS level_code,
               vt.title,
               vt.description,
               vt.is_active,
               vt.created_by::text,
               vt.created_at
        FROM   vocabulary_test vt
        LEFT JOIN level l ON l.id = vt.level_id
        WHERE  {where_clause}
        ORDER  BY vt.created_at ASC
    """
    r = await db.execute(text(sql), params)
    return [dict(row) for row in r.mappings().all()]


async def get_attempt_count_by_user(
    db: AsyncSession,
    user_id: str,
    test_ids: list[str],
) -> dict[str, int]:
    """
    Đếm số lượt làm bài (status='submitted') của user cho từng test_id.
    Trả dict { test_id: count } — các test_id không có attempt trả 0.
    Chỉ đếm attempt đã submitted (không đếm in_progress bị bỏ dở).
    S4.5 — AC-06: badge "Đã làm X lần" trên QuizListPage.
    """
    if not test_ids:
        return {}
    r = await db.execute(
        text("""
            SELECT qa.vocabulary_test_id::text AS test_id,
                   COUNT(*)::int              AS cnt
            FROM   quiz_attempt qa
            WHERE  qa.user_id = CAST(:user_id AS UUID)
              AND  qa.vocabulary_test_id = ANY(CAST(:test_ids AS UUID[]))
              AND  qa.status = 'submitted'
            GROUP  BY qa.vocabulary_test_id
        """),
        {"user_id": user_id, "test_ids": test_ids},
    )
    result = {row["test_id"]: row["cnt"] for row in r.mappings().all()}
    # Điền 0 cho test chưa có attempt
    for tid in test_ids:
        result.setdefault(tid, 0)
    return result


async def get_test_by_id(db: AsyncSession, test_id: str) -> dict | None:
    """Lấy 1 bài kiểm tra theo id (bao gồm cả is_active=false để admin xem)."""
    r = await db.execute(
        text("""
            SELECT vt.id::text,
                   vt.topic_id::text,
                   vt.level_id::text,
                   vt.title,
                   vt.description,
                   vt.is_active,
                   vt.created_by::text,
                   vt.created_at
            FROM   vocabulary_test vt
            WHERE  vt.id = CAST(:test_id AS UUID)
        """),
        {"test_id": test_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def create_test(db: AsyncSession, data: dict) -> dict:
    """
    Tạo bài kiểm tra mới (Admin S9.1).
    data keys: topic_id (nullable), level_id (nullable), title, description (nullable),
               created_by (nullable)
    """
    r = await db.execute(
        text("""
            INSERT INTO vocabulary_test
                (topic_id, level_id, title, description, created_by)
            VALUES
                (
                    CAST(:topic_id AS UUID),
                    CAST(:level_id AS UUID),
                    :title,
                    :description,
                    CAST(:created_by AS UUID)
                )
            RETURNING id::text,
                      topic_id::text,
                      level_id::text,
                      title,
                      description,
                      is_active,
                      created_by::text,
                      created_at
        """),
        {
            "topic_id":   data.get("topic_id"),
            "level_id":   data.get("level_id"),
            "title":      data["title"],
            "description": data.get("description"),
            "created_by": data.get("created_by"),
        },
    )
    return dict(r.mappings().first())


async def soft_delete_test(db: AsyncSession, test_id: str) -> bool:
    """Soft-delete bài kiểm tra: set is_active=false (Admin S9.2 — AC-13-03 / §5.3)."""
    r = await db.execute(
        text("""
            UPDATE vocabulary_test
            SET    is_active = FALSE
            WHERE  id = CAST(:test_id AS UUID)
        """),
        {"test_id": test_id},
    )
    return r.rowcount > 0


async def enable_test(db: AsyncSession, test_id: str) -> bool:
    """Re-enable vocabulary test (S9.5)."""
    r = await db.execute(
        text("""
            UPDATE vocabulary_test
            SET    is_active = TRUE
            WHERE  id = CAST(:test_id AS UUID)
        """),
        {"test_id": test_id},
    )
    return r.rowcount > 0


async def list_tests_admin(
    db: AsyncSession,
    search: str | None = None,
    topic_id: str | None = None,
    level_id: str | None = None,
    include_inactive: bool = True,
) -> list[dict]:
    """
    Danh sách bài kiểm tra cho Admin (kèm question_count + attempt_count tổng).
    Mặc định include_inactive=True để Admin thấy cả test draft/inactive.
    """
    conditions = []
    params: dict = {}

    if not include_inactive:
        conditions.append("vt.is_active = TRUE")
    if search:
        conditions.append("(vt.title ILIKE :search OR vt.description ILIKE :search)")
        params["search"] = f"%{search}%"
    if topic_id:
        conditions.append("vt.topic_id = CAST(:topic_id AS UUID)")
        params["topic_id"] = topic_id
    if level_id:
        conditions.append("vt.level_id = CAST(:level_id AS UUID)")
        params["level_id"] = level_id

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    sql = f"""
        SELECT vt.id::text,
               vt.topic_id::text,
               t.name AS topic_name,
               vt.level_id::text,
               l.code AS level_code,
               vt.title,
               vt.description,
               vt.is_active,
               vt.created_by::text,
               vt.created_at,
               COUNT(DISTINCT qq.id)::int AS question_count,
               COUNT(DISTINCT qa.id) FILTER (WHERE qa.status = 'submitted')::int AS attempt_count
        FROM   vocabulary_test vt
        LEFT JOIN topic t          ON t.id = vt.topic_id
        LEFT JOIN level l          ON l.id = vt.level_id
        LEFT JOIN quiz_question qq ON qq.vocabulary_test_id = vt.id
        LEFT JOIN quiz_attempt qa  ON qa.vocabulary_test_id = vt.id
        {where_clause}
        GROUP  BY vt.id, t.name, l.code
        ORDER  BY vt.created_at DESC
    """
    r = await db.execute(text(sql), params)
    return [dict(row) for row in r.mappings().all()]


async def update_test(db: AsyncSession, test_id: str, data: dict) -> dict | None:
    """Cập nhật metadata bài kiểm tra (Admin S9.1). Trả None nếu không tìm thấy."""
    r = await db.execute(
        text("""
            UPDATE vocabulary_test
            SET    topic_id    = CAST(:topic_id AS UUID),
                   level_id    = CAST(:level_id AS UUID),
                   title       = :title,
                   description = :description
            WHERE  id = CAST(:test_id AS UUID)
            RETURNING id::text,
                      topic_id::text,
                      level_id::text,
                      title,
                      description,
                      is_active,
                      created_by::text,
                      created_at
        """),
        {
            "test_id":     test_id,
            "topic_id":    data.get("topic_id"),
            "level_id":    data.get("level_id"),
            "title":       data["title"],
            "description": data.get("description"),
        },
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def list_tests_admin(
    db: AsyncSession,
    search: str | None = None,
    topic_id: str | None = None,
    level_id: str | None = None,
    include_inactive: bool = True,
) -> list[dict]:
    """
    Danh sách bài kiểm tra cho Admin (kèm question_count + attempt_count tổng).
    Mặc định include_inactive=True để Admin thấy cả test draft/inactive.
    """
    conditions = []
    params: dict = {}

    if not include_inactive:
        conditions.append("vt.is_active = TRUE")
    if search:
        conditions.append("(vt.title ILIKE :search OR vt.description ILIKE :search)")
        params["search"] = f"%{search}%"
    if topic_id:
        conditions.append("vt.topic_id = CAST(:topic_id AS UUID)")
        params["topic_id"] = topic_id
    if level_id:
        conditions.append("vt.level_id = CAST(:level_id AS UUID)")
        params["level_id"] = level_id

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    sql = f"""
        SELECT vt.id::text,
               vt.topic_id::text,
               t.name AS topic_name,
               vt.level_id::text,
               l.code AS level_code,
               vt.title,
               vt.description,
               vt.is_active,
               vt.created_by::text,
               vt.created_at,
               COUNT(DISTINCT qq.id)::int AS question_count,
               COUNT(DISTINCT qa.id) FILTER (WHERE qa.status = 'submitted')::int AS attempt_count
        FROM   vocabulary_test vt
        LEFT JOIN topic t          ON t.id = vt.topic_id
        LEFT JOIN level l          ON l.id = vt.level_id
        LEFT JOIN quiz_question qq ON qq.vocabulary_test_id = vt.id
        LEFT JOIN quiz_attempt qa  ON qa.vocabulary_test_id = vt.id
        {where_clause}
        GROUP  BY vt.id, t.name, l.code
        ORDER  BY vt.created_at DESC
    """
    r = await db.execute(text(sql), params)
    return [dict(row) for row in r.mappings().all()]


async def update_test(db: AsyncSession, test_id: str, data: dict) -> dict | None:
    """Cập nhật metadata bài kiểm tra (Admin S9.1). Trả None nếu không tìm thấy."""
    r = await db.execute(
        text("""
            UPDATE vocabulary_test
            SET    topic_id    = CAST(:topic_id AS UUID),
                   level_id    = CAST(:level_id AS UUID),
                   title       = :title,
                   description = :description
            WHERE  id = CAST(:test_id AS UUID)
            RETURNING id::text,
                      topic_id::text,
                      level_id::text,
                      title,
                      description,
                      is_active,
                      created_by::text,
                      created_at
        """),
        {
            "test_id":     test_id,
            "topic_id":    data.get("topic_id"),
            "level_id":    data.get("level_id"),
            "title":       data["title"],
            "description": data.get("description"),
        },
    )
    row = r.mappings().first()
    return dict(row) if row else None


# ═══════════════════════════════════════════════════════════════════════════════
# quiz_question + quiz_answer
# ═══════════════════════════════════════════════════════════════════════════════

async def get_questions_by_test(db: AsyncSession, test_id: str) -> list[dict]:
    """
    Lấy tất cả câu hỏi + đáp án của 1 bài kiểm tra (S4.2).
    Trả về list[dict] — mỗi dict có key 'answers': list[dict].
    """
    # Lấy câu hỏi
    r_questions = await db.execute(
        text("""
            SELECT qq.id::text,
                   qq.vocabulary_test_id::text,
                   qq.topic_word_id::text,
                   qq.question_text,
                   qq.question_type,
                   qq.display_order
            FROM   quiz_question qq
            WHERE  qq.vocabulary_test_id = CAST(:test_id AS UUID)
            ORDER  BY qq.display_order ASC, qq.created_at ASC
        """),
        {"test_id": test_id},
    )
    questions = [dict(row) for row in r_questions.mappings().all()]
    if not questions:
        return []

    # Lấy đáp án cho tất cả câu hỏi trong 1 query (tối ưu N+1)
    question_ids = [q["id"] for q in questions]
    r_answers = await db.execute(
        text("""
            SELECT qa.id::text,
                   qa.quiz_question_id::text,
                   qa.answer_text,
                   qa.is_correct,
                   qa.display_order
            FROM   quiz_answer qa
            WHERE  qa.quiz_question_id = ANY(CAST(:qids AS UUID[]))
            ORDER  BY qa.display_order ASC
        """),
        {"qids": question_ids},
    )
    answers_by_qid: dict[str, list[dict]] = {}
    for row in r_answers.mappings().all():
        a = dict(row)
        answers_by_qid.setdefault(a["quiz_question_id"], []).append(a)

    # Ghép answers vào từng question
    for q in questions:
        q["answers"] = answers_by_qid.get(q["id"], [])

    return questions


async def create_question_with_answers(
    db: AsyncSession,
    question_data: dict,
    answers_data: list[dict],
) -> dict:
    """
    Tạo câu hỏi + danh sách đáp án trong 1 transaction (Admin S9.1).
    question_data keys: vocabulary_test_id, topic_word_id (nullable), question_text,
                        question_type, display_order
    answers_data: list of {answer_text, is_correct, display_order}
    Trả về dict câu hỏi kèm key 'answers'.
    """
    r = await db.execute(
        text("""
            INSERT INTO quiz_question
                (vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
            VALUES
                (
                    CAST(:vocabulary_test_id AS UUID),
                    CAST(:topic_word_id AS UUID),
                    :question_text,
                    :question_type,
                    :display_order
                )
            RETURNING id::text,
                      vocabulary_test_id::text,
                      topic_word_id::text,
                      question_text,
                      question_type,
                      display_order
        """),
        {
            "vocabulary_test_id": question_data["vocabulary_test_id"],
            "topic_word_id":      question_data.get("topic_word_id"),
            "question_text":      question_data["question_text"],
            "question_type":      question_data["question_type"],
            "display_order":      question_data.get("display_order", 0),
        },
    )
    question = dict(r.mappings().first())
    question_id = question["id"]

    # Chèn đáp án (nếu có — flashcard/fill_blank không có answers)
    inserted_answers: list[dict] = []
    for ans in answers_data:
        r_ans = await db.execute(
            text("""
                INSERT INTO quiz_answer
                    (quiz_question_id, answer_text, is_correct, display_order)
                VALUES
                    (CAST(:qid AS UUID), :answer_text, :is_correct, :display_order)
                RETURNING id::text,
                          quiz_question_id::text,
                          answer_text,
                          is_correct,
                          display_order
            """),
            {
                "qid":          question_id,
                "answer_text":  ans["answer_text"],
                "is_correct":   ans.get("is_correct", False),
                "display_order": ans.get("display_order", 0),
            },
        )
        inserted_answers.append(dict(r_ans.mappings().first()))

    question["answers"] = inserted_answers
    return question


async def replace_questions_for_test(
    db: AsyncSession,
    test_id: str,
    questions_data: list[dict],
) -> list[dict]:
    """
    Đồng bộ toàn bộ câu hỏi + đáp án của 1 bài kiểm tra (Admin S9.1 — editor PUT).

    MVP strategy (ghi nhận trong plan §6 — risk "sync nested"):
    xoá toàn bộ question/answer cũ của test (CASCADE xoá answer theo FK) rồi
    insert lại theo payload mới. Đơn giản & an toàn cho 1 transaction; chấp nhận
    đổi id question/answer (không ảnh hưởng quiz_attempt_answer vì ON DELETE CASCADE
    chỉ xảy ra khi xoá test, còn ở đây ta chỉ xoá theo vocabulary_test_id — xem note).

    Lưu ý: nếu test đã có attempt cũ tham chiếu quiz_question_id, xoá+insert lại sẽ
    khiến quiz_attempt_answer của các attempt cũ trỏ tới question_id không còn tồn tại
    (FK ON DELETE CASCADE trên quiz_attempt_answer.quiz_question_id sẽ xoá luôn các
    answer ghi nhận đó). Đây là đánh đổi chấp nhận được cho MVP Admin editor — ghi
    rõ trong implement log để Reviewer/PO biết (TBD: làm diff giữ id nếu cần giữ
    lịch sử chấm điểm chính xác tuyệt đối).
    """
    # Xoá toàn bộ câu hỏi cũ — CASCADE xoá quiz_answer + quiz_attempt_answer liên quan
    await db.execute(
        text("DELETE FROM quiz_question WHERE vocabulary_test_id = CAST(:test_id AS UUID)"),
        {"test_id": test_id},
    )

    inserted: list[dict] = []
    for q in questions_data:
        question = await create_question_with_answers(
            db,
            question_data={
                "vocabulary_test_id": test_id,
                "topic_word_id":      q.get("topic_word_id"),
                "question_text":      q["question_text"],
                "question_type":      q["question_type"],
                "display_order":      q.get("display_order", 0),
            },
            answers_data=[
                {
                    "answer_text":   a["answer_text"],
                    "is_correct":    a.get("is_correct", False),
                    "display_order": a.get("display_order", 0),
                }
                for a in q.get("answers", [])
            ],
        )
        inserted.append(question)

    return inserted


# ═══════════════════════════════════════════════════════════════════════════════
# quiz_attempt
# ═══════════════════════════════════════════════════════════════════════════════

async def create_attempt(
    db: AsyncSession,
    user_id: str,
    test_id: str,
    total_q: int,
) -> dict:
    """
    Bắt đầu lượt làm bài mới (S4.3).
    total_q: snapshot số câu hỏi tại thời điểm bắt đầu.
    """
    r = await db.execute(
        text("""
            INSERT INTO quiz_attempt
                (user_id, vocabulary_test_id, total_questions, status)
            VALUES
                (CAST(:user_id AS UUID), CAST(:test_id AS UUID), :total_q, 'in_progress')
            RETURNING id::text,
                      user_id::text,
                      vocabulary_test_id::text,
                      total_questions,
                      correct_answers,
                      wrong_answers,
                      score_percent,
                      status,
                      started_at,
                      submitted_at
        """),
        {"user_id": user_id, "test_id": test_id, "total_q": total_q},
    )
    return dict(r.mappings().first())


async def submit_attempt(
    db: AsyncSession,
    attempt_id: str,
    correct: int,
    wrong: int,
    score: float,
) -> dict:
    """
    Nộp bài và cập nhật điểm (S4.4).
    score = correct / total × 100, tính bởi quiz_service.calculate_score().
    Snapshot is_correct trong quiz_attempt_answer đã được set trước khi gọi hàm này.
    """
    r = await db.execute(
        text("""
            UPDATE quiz_attempt
            SET    correct_answers = :correct,
                   wrong_answers   = :wrong,
                   score_percent   = :score,
                   status          = 'submitted',
                   submitted_at    = NOW()
            WHERE  id = CAST(:attempt_id AS UUID)
            RETURNING id::text,
                      user_id::text,
                      vocabulary_test_id::text,
                      total_questions,
                      correct_answers,
                      wrong_answers,
                      score_percent,
                      status,
                      started_at,
                      submitted_at
        """),
        {"attempt_id": attempt_id, "correct": correct, "wrong": wrong, "score": score},
    )
    return dict(r.mappings().first())


async def get_attempt_by_id(db: AsyncSession, attempt_id: str) -> dict | None:
    """Lấy 1 lượt làm bài theo id."""
    r = await db.execute(
        text("""
            SELECT qa.id::text,
                   qa.user_id::text,
                   qa.vocabulary_test_id::text,
                   qa.total_questions,
                   qa.correct_answers,
                   qa.wrong_answers,
                   qa.score_percent,
                   qa.status,
                   qa.started_at,
                   qa.submitted_at
            FROM   quiz_attempt qa
            WHERE  qa.id = CAST(:attempt_id AS UUID)
        """),
        {"attempt_id": attempt_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_attempts_by_user_test(
    db: AsyncSession,
    user_id: str,
    test_id: str,
) -> list[dict]:
    """
    Lấy lịch sử lượt làm bài của user cho 1 test (S4.5).
    Sắp xếp mới nhất trước — phục vụ trang lịch sử.
    """
    r = await db.execute(
        text("""
            SELECT qa.id::text,
                   qa.user_id::text,
                   qa.vocabulary_test_id::text,
                   qa.total_questions,
                   qa.correct_answers,
                   qa.wrong_answers,
                   qa.score_percent,
                   qa.status,
                   qa.started_at,
                   qa.submitted_at
            FROM   quiz_attempt qa
            WHERE  qa.user_id            = CAST(:user_id AS UUID)
              AND  qa.vocabulary_test_id = CAST(:test_id AS UUID)
            ORDER  BY qa.started_at DESC
        """),
        {"user_id": user_id, "test_id": test_id},
    )
    return [dict(row) for row in r.mappings().all()]


# ═══════════════════════════════════════════════════════════════════════════════
# quiz_attempt_answer
# ═══════════════════════════════════════════════════════════════════════════════

async def upsert_attempt_answer(
    db: AsyncSession,
    attempt_id: str,
    question_id: str,
    answer_id: str | None,
    text_answer: str | None,
    is_correct: bool,
) -> dict:
    """
    Upsert câu trả lời của user (S4.3).
    UNIQUE (quiz_attempt_id, quiz_question_id) đảm bảo an toàn khi gọi lại.
    quiz_answer_id: None với flashcard / fill_blank.
    is_correct: snapshot tại thời điểm submit — không tính lại sau (AC-06-04).
    """
    r = await db.execute(
        text("""
            INSERT INTO quiz_attempt_answer
                (quiz_attempt_id, quiz_question_id, quiz_answer_id,
                 text_answer, is_correct, answered_at)
            VALUES
                (
                    CAST(:attempt_id  AS UUID),
                    CAST(:question_id AS UUID),
                    CAST(:answer_id   AS UUID),
                    :text_answer,
                    :is_correct,
                    NOW()
                )
            ON CONFLICT (quiz_attempt_id, quiz_question_id) DO UPDATE
                SET quiz_answer_id = EXCLUDED.quiz_answer_id,
                    text_answer    = EXCLUDED.text_answer,
                    is_correct     = EXCLUDED.is_correct,
                    answered_at    = EXCLUDED.answered_at
            RETURNING id::text,
                      quiz_attempt_id::text,
                      quiz_question_id::text,
                      quiz_answer_id::text,
                      text_answer,
                      is_correct,
                      answered_at
        """),
        {
            "attempt_id":  attempt_id,
            "question_id": question_id,
            "answer_id":   answer_id,
            "text_answer": text_answer,
            "is_correct":  is_correct,
        },
    )
    return dict(r.mappings().first())


async def get_answers_by_attempt(db: AsyncSession, attempt_id: str) -> list[dict]:
    """Lấy toàn bộ câu trả lời của 1 lượt làm bài (S4.4 — trang kết quả)."""
    r = await db.execute(
        text("""
            SELECT qaa.id::text,
                   qaa.quiz_attempt_id::text,
                   qaa.quiz_question_id::text,
                   qaa.quiz_answer_id::text,
                   qaa.text_answer,
                   qaa.is_correct,
                   qaa.answered_at
            FROM   quiz_attempt_answer qaa
            WHERE  qaa.quiz_attempt_id = CAST(:attempt_id AS UUID)
            ORDER  BY qaa.answered_at ASC NULLS LAST
        """),
        {"attempt_id": attempt_id},
    )
    return [dict(row) for row in r.mappings().all()]


async def get_attempt_result(db: AsyncSession, attempt_id: str) -> list[dict]:
    """
    Lấy câu trả lời kèm context câu hỏi + đáp án đúng (S4.4 — result page).
    JOIN quiz_attempt_answer → quiz_question → quiz_answer (đáp án đúng).
    LATERAL subquery + LIMIT 1 để tránh duplicate khi có nhiều đáp án đúng
    (grammar_mapping).
    flashcard không có quiz_answer rows → correct_answer_text = NULL (acceptable).
    """
    r = await db.execute(
        text("""
            SELECT
                qaa.quiz_question_id::text,
                qq.question_text,
                qq.question_type,
                qaa.quiz_answer_id::text       AS user_answer_id,
                qaa.text_answer                AS user_text_answer,
                qaa.is_correct,
                ca.answer_text                 AS correct_answer_text
            FROM quiz_attempt_answer qaa
            JOIN quiz_question qq ON qq.id = qaa.quiz_question_id
            LEFT JOIN LATERAL (
                SELECT answer_text
                FROM   quiz_answer
                WHERE  quiz_question_id = qq.id
                  AND  is_correct = TRUE
                ORDER  BY display_order ASC
                LIMIT  1
            ) ca ON TRUE
            WHERE qaa.quiz_attempt_id = CAST(:attempt_id AS UUID)
            ORDER BY qaa.answered_at ASC NULLS LAST
        """),
        {"attempt_id": attempt_id},
    )
    return [dict(row) for row in r.mappings().all()]
