\encoding UTF8
-- ─── SpeakBuddi — Schema Quiz/Test (PostgreSQL) ──────────────────────────────
-- Pham vi S4.1: nhom Quiz/Test — bai kiem tra tu vung
--   vocabulary_test / quiz_question / quiz_answer / quiz_attempt / quiz_attempt_answer
--
-- Yêu cầu thứ tự chạy:
--   1. psql -U <user> -d <db> -f db/schema_core.sql      ← users + set_updated_at()
--   2. psql -U <user> -d <db> -f db/schema_learning.sql  ← level / topic / topic_word
--   3. psql -U <user> -d <db> -f db/schema_progress.sql  ← user_word_progress
--   4. psql -U <user> -d <db> -f db/schema_quiz.sql      ← file này
--
-- Lần đầu setup (idempotent — chạy 2 lần không lỗi):
--   createdb -U postgres speakbuddi
--   psql -U postgres -d speakbuddi -f db/schema_core.sql
--   psql -U postgres -d speakbuddi -f db/schema_learning.sql
--   psql -U postgres -d speakbuddi -f db/schema_progress.sql
--   psql -U postgres -d speakbuddi -f db/schema_quiz.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Extension pgcrypto (gen_random_uuid) — dam bao co du chay standalone
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── 1. vocabulary_test ───────────────────────────────────────────────────────
-- Bài kiểm tra từ vựng; gắn với topic + level; soft-delete qua is_active (§5.3)
-- created_by: UUID admin tạo; NULL nếu tự sinh (hệ thống tạo tự động)
CREATE TABLE IF NOT EXISTS vocabulary_test (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id     UUID         REFERENCES topic (id) ON DELETE SET NULL,    -- gắn topic, nullable
    level_id     UUID         REFERENCES level (id) ON DELETE SET NULL,    -- lọc theo A1–C2
    title        VARCHAR(200) NOT NULL,                                     -- tiêu đề bài kiểm tra
    description  TEXT,                                                      -- mô tả (nullable)
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,                        -- soft-delete §5.3
    created_by   UUID         REFERENCES users (id) ON DELETE SET NULL,    -- admin tạo
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vt_topic
    ON vocabulary_test (topic_id);

CREATE INDEX IF NOT EXISTS idx_vt_level
    ON vocabulary_test (level_id);

CREATE INDEX IF NOT EXISTS idx_vt_active_topic
    ON vocabulary_test (is_active, topic_id);


-- ─── 2. quiz_question ─────────────────────────────────────────────────────────
-- Câu hỏi trong bài kiểm tra; 4 loại theo AC-06-01:
--   flashcard | multiple_choice | fill_blank | grammar_mapping
-- topic_word_id: nullable — flashcard có thể không gắn từ cụ thể
CREATE TABLE IF NOT EXISTS quiz_question (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_test_id  UUID         NOT NULL REFERENCES vocabulary_test (id) ON DELETE CASCADE,
    topic_word_id       UUID         REFERENCES topic_word (id) ON DELETE SET NULL,  -- nullable
    question_text       TEXT         NOT NULL,    -- nội dung câu hỏi (hoặc "từ" cho flashcard)
    question_type       VARCHAR(30)  NOT NULL
                                     CHECK (question_type IN (
                                         'flashcard', 'multiple_choice',
                                         'fill_blank', 'grammar_mapping'
                                     )),
    display_order       SMALLINT     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qq_test
    ON quiz_question (vocabulary_test_id);

CREATE INDEX IF NOT EXISTS idx_qq_word
    ON quiz_question (topic_word_id);

CREATE INDEX IF NOT EXISTS idx_qq_test_order
    ON quiz_question (vocabulary_test_id, display_order);


-- ─── 3. quiz_answer ───────────────────────────────────────────────────────────
-- Đáp án cho câu hỏi multiple_choice / grammar_mapping
-- Không tạo row cho flashcard (user tự đánh giá) và fill_blank (user gõ text)
CREATE TABLE IF NOT EXISTS quiz_answer (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_question_id  UUID         NOT NULL REFERENCES quiz_question (id) ON DELETE CASCADE,
    answer_text       TEXT         NOT NULL,
    is_correct        BOOLEAN      NOT NULL DEFAULT FALSE,  -- chỉ 1 đáp án đúng (hoặc nhiều với grammar_mapping)
    display_order     SMALLINT     NOT NULL DEFAULT 0,       -- thứ tự shuffle/hiển thị
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_question
    ON quiz_answer (quiz_question_id);


-- ─── 4. quiz_attempt ──────────────────────────────────────────────────────────
-- Lượt làm bài của user; lưu snapshot điểm số theo BR08
-- score_percent = correct_answers / total_questions × 100
CREATE TABLE IF NOT EXISTS quiz_attempt (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    vocabulary_test_id  UUID         NOT NULL REFERENCES vocabulary_test (id) ON DELETE CASCADE,
    total_questions     SMALLINT     NOT NULL DEFAULT 0,      -- snapshot khi bắt đầu
    correct_answers     SMALLINT     NOT NULL DEFAULT 0,      -- tích lũy khi nộp
    wrong_answers       SMALLINT     NOT NULL DEFAULT 0,      -- = total - correct
    score_percent       DECIMAL(5,2) NOT NULL DEFAULT 0.00,   -- BR08: correct/total × 100
    status              VARCHAR(20)  NOT NULL DEFAULT 'in_progress'
                                     CHECK (status IN ('in_progress', 'submitted')),
    started_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    submitted_at        TIMESTAMPTZ,                          -- NULL khi chưa nộp
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_attempt_score   CHECK (score_percent >= 0 AND score_percent <= 100),
    CONSTRAINT chk_attempt_counts  CHECK (
        total_questions >= 0 AND correct_answers >= 0 AND wrong_answers >= 0
    )
);

CREATE INDEX IF NOT EXISTS idx_qa_user
    ON quiz_attempt (user_id);

CREATE INDEX IF NOT EXISTS idx_qa_test
    ON quiz_attempt (vocabulary_test_id);

CREATE INDEX IF NOT EXISTS idx_qa_user_test
    ON quiz_attempt (user_id, vocabulary_test_id);

CREATE INDEX IF NOT EXISTS idx_qa_submitted
    ON quiz_attempt (submitted_at);


-- ─── 5. quiz_attempt_answer ───────────────────────────────────────────────────
-- Câu trả lời từng câu trong lượt làm; snapshot — không thay đổi khi test được sửa (AC-06-04)
-- quiz_answer_id NULLABLE — NULL với flashcard (tự đánh giá) và fill_blank (gõ text)
-- text_answer: chuỗi user gõ với fill_blank; NULL với multiple_choice/flashcard
-- is_correct: chấm điểm snapshot tại thời điểm nộp (không tính lại sau)
-- UNIQUE (quiz_attempt_id, quiz_question_id): 1 câu hỏi / 1 lượt = 1 answer (an toàn upsert)
CREATE TABLE IF NOT EXISTS quiz_attempt_answer (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_attempt_id  UUID        NOT NULL REFERENCES quiz_attempt (id) ON DELETE CASCADE,
    quiz_question_id UUID        NOT NULL REFERENCES quiz_question (id) ON DELETE CASCADE,
    quiz_answer_id   UUID        REFERENCES quiz_answer (id) ON DELETE SET NULL,  -- NULLABLE §5.3
    text_answer      TEXT,                                                          -- fill_blank
    is_correct       BOOLEAN     NOT NULL DEFAULT FALSE,                            -- snapshot
    answered_at      TIMESTAMPTZ,                                                   -- NULL nếu chưa trả lời
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_attempt_question UNIQUE (quiz_attempt_id, quiz_question_id)
);

CREATE INDEX IF NOT EXISTS idx_qaa_attempt
    ON quiz_attempt_answer (quiz_attempt_id);

CREATE INDEX IF NOT EXISTS idx_qaa_question
    ON quiz_attempt_answer (quiz_question_id);

CREATE INDEX IF NOT EXISTS idx_qaa_answer
    ON quiz_attempt_answer (quiz_answer_id);


-- ─── Trigger: tự cập nhật updated_at ─────────────────────────────────────────
-- Dùng lại hàm set_updated_at() đã định nghĩa trong schema_core.sql
-- Guard IF EXISTS: an toàn khi bảng đã tồn tại hoặc chưa tồn tại
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'vocabulary_test', 'quiz_question', 'quiz_answer',
        'quiz_attempt', 'quiz_attempt_answer'
    ]
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            EXECUTE format(
                'CREATE OR REPLACE TRIGGER trg_%I_updated_at
                 BEFORE UPDATE ON %I
                 FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
                t, t
            );
        END IF;
    END LOOP;
END;
$$;


-- ─── Seed S4.1: 1 vocabulary_test + 5 quiz_question đa dạng type ─────────────
-- Gắn với topic 'greetings-introductions' (đã seed trong schema_learning.sql)
-- Idempotent: kiểm tra WHERE NOT EXISTS trước khi insert

-- 1. vocabulary_test
INSERT INTO vocabulary_test (id, topic_id, level_id, title, description, is_active)
SELECT
    gen_random_uuid(),
    (SELECT id FROM topic WHERE slug = 'greetings-introductions'),
    (SELECT id FROM level WHERE code  = 'A1'),
    'Test: Greetings & Introductions A1',
    'Bài kiểm tra từ vựng chủ đề Chào hỏi & Giới thiệu bản thân — trình độ A1',
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM vocabulary_test
    WHERE title = 'Test: Greetings & Introductions A1'
);

-- 2. quiz_question — flashcard: từ "hello"
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT
    gen_random_uuid(),
    (SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'),
    (SELECT id FROM topic_word
     WHERE  topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
       AND  word = 'hello'),
    'hello',
    'flashcard',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_question
    WHERE vocabulary_test_id = (
              SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
          )
      AND question_text = 'hello'
      AND question_type = 'flashcard'
);

-- 3. quiz_question — multiple_choice: hỏi nghĩa "goodbye"
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT
    gen_random_uuid(),
    (SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'),
    (SELECT id FROM topic_word
     WHERE  topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
       AND  word = 'goodbye'),
    '"goodbye" có nghĩa là gì?',
    'multiple_choice',
    2
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_question
    WHERE vocabulary_test_id = (
              SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
          )
      AND question_text = '"goodbye" có nghĩa là gì?'
);

-- 4. quiz_question — multiple_choice: hỏi nghĩa "name"
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT
    gen_random_uuid(),
    (SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'),
    (SELECT id FROM topic_word
     WHERE  topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
       AND  word = 'name'),
    '"name" có nghĩa là gì?',
    'multiple_choice',
    3
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_question
    WHERE vocabulary_test_id = (
              SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
          )
      AND question_text = '"name" có nghĩa là gì?'
);

-- 5. quiz_question — fill_blank: điền từ vào chỗ trống
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT
    gen_random_uuid(),
    (SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'),
    NULL,
    'Điền vào chỗ trống: "Nice to _____ you!" (= gặp)',
    'fill_blank',
    4
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_question
    WHERE vocabulary_test_id = (
              SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
          )
      AND question_type = 'fill_blank'
);

-- 6. quiz_question — grammar_mapping: nối từ với nghĩa
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT
    gen_random_uuid(),
    (SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'),
    NULL,
    'Nối từ bên trái với nghĩa đúng bên phải: hello / goodbye / meet / introduce',
    'grammar_mapping',
    5
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_question
    WHERE vocabulary_test_id = (
              SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
          )
      AND question_type = 'grammar_mapping'
);

-- 7. quiz_answer — cho câu "goodbye" (multiple_choice, 4 đáp án, 1 đúng)
INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT q.id, v.answer_text, v.is_correct, v.display_order
FROM quiz_question q,
(VALUES
    ('tạm biệt',    TRUE,  1::SMALLINT),
    ('xin chào',    FALSE, 2::SMALLINT),
    ('cảm ơn',      FALSE, 3::SMALLINT),
    ('gặp gỡ',      FALSE, 4::SMALLINT)
) AS v (answer_text, is_correct, display_order)
WHERE q.question_text = '"goodbye" có nghĩa là gì?'
  AND q.vocabulary_test_id = (
      SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
  )
  AND NOT EXISTS (
      SELECT 1 FROM quiz_answer qa WHERE qa.quiz_question_id = q.id
  );

-- 8. quiz_answer — cho câu "name" (multiple_choice, 4 đáp án, 1 đúng)
INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT q.id, v.answer_text, v.is_correct, v.display_order
FROM quiz_question q,
(VALUES
    ('tên',         TRUE,  1::SMALLINT),
    ('số điện thoại', FALSE, 2::SMALLINT),
    ('địa chỉ',     FALSE, 3::SMALLINT),
    ('tuổi',        FALSE, 4::SMALLINT)
) AS v (answer_text, is_correct, display_order)
WHERE q.question_text = '"name" có nghĩa là gì?'
  AND q.vocabulary_test_id = (
      SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
  )
  AND NOT EXISTS (
      SELECT 1 FROM quiz_answer qa WHERE qa.quiz_question_id = q.id
  );

-- 9a. quiz_answer — cho câu fill_blank: đáp án đúng "meet" + decoy options
INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT q.id, v.answer_text, v.is_correct, v.display_order
FROM quiz_question q,
(VALUES
    ('meet',      TRUE,  1::SMALLINT),
    ('greet',     FALSE, 2::SMALLINT),
    ('see',       FALSE, 3::SMALLINT),
    ('know',      FALSE, 4::SMALLINT)
) AS v (answer_text, is_correct, display_order)
WHERE q.question_type = 'fill_blank'
  AND q.vocabulary_test_id = (
      SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
  )
  AND NOT EXISTS (
      SELECT 1 FROM quiz_answer qa WHERE qa.quiz_question_id = q.id
  );

-- 9b. quiz_answer — cho câu grammar_mapping (nối từ-nghĩa, cả 4 đều đúng)
INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT q.id, v.answer_text, v.is_correct, v.display_order
FROM quiz_question q,
(VALUES
    ('hello → xin chào',       TRUE, 1::SMALLINT),
    ('goodbye → tạm biệt',     TRUE, 2::SMALLINT),
    ('meet → gặp gỡ',          TRUE, 3::SMALLINT),
    ('introduce → giới thiệu', TRUE, 4::SMALLINT)
) AS v (answer_text, is_correct, display_order)
WHERE q.question_type = 'grammar_mapping'
  AND q.vocabulary_test_id = (
      SELECT id FROM vocabulary_test WHERE title = 'Test: Greetings & Introductions A1'
  )
  AND NOT EXISTS (
      SELECT 1 FROM quiz_answer qa WHERE qa.quiz_question_id = q.id
  );
