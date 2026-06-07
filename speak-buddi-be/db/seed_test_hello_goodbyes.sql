\encoding UTF8
-- ─── SpeakBuddi — Seed: Topic "Hello and Goodbyes" + Vocabulary Test ─────────
--
-- Nội dung:
--   1. Topic: Hello and Goodbyes (A1)
--   2. 10 topic_word
--   3. 1 vocabulary_test
--   4. Quiz questions đa dạng: multiple_choice, fill_blank, grammar_mapping
--
-- Yêu cầu: reset_db.sql đã chạy xong (levels A1–C2 đã tồn tại)
--
-- Cách chạy:
--   psql -U postgres -d speakbuddi -f db/seed_test_hello_goodbyes.sql
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 1 — TOPIC
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO topic (id, level_id, name, slug, description, display_order, difficulty, source)
SELECT
    '11000000-0000-0000-0000-000000000001'::uuid,
    (SELECT id FROM level WHERE code = 'A1'),
    'Hello and Goodbyes',
    'hello-and-goodbyes',
    'Cách chào hỏi và tạm biệt trong tiếng Anh — từ thông thường đến trang trọng',
    1, 1, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'hello-and-goodbyes');

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 2 — TOPIC WORDS (10 từ)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO topic_word (id, topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT v.id, t.id, l.id, v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('11100000-0000-0000-0000-000000000001'::uuid, 'hello',     '/həˈloʊ/',        'xin chào',          'A common greeting used when meeting someone',          'Hello! My name is Lan.',                     1::SMALLINT),
    ('11100000-0000-0000-0000-000000000002'::uuid, 'goodbye',   '/ˌɡʊdˈbaɪ/',     'tạm biệt',          'Said when leaving or parting from someone',            'Goodbye! See you tomorrow.',                 2::SMALLINT),
    ('11100000-0000-0000-0000-000000000003'::uuid, 'hi',        '/haɪ/',           'chào (thân mật)',   'An informal greeting',                                 'Hi! How are you doing?',                     3::SMALLINT),
    ('11100000-0000-0000-0000-000000000004'::uuid, 'bye',       '/baɪ/',           'tạm biệt (thân mật)', 'An informal way of saying goodbye',                  'Bye! Talk to you later.',                    4::SMALLINT),
    ('11100000-0000-0000-0000-000000000005'::uuid, 'welcome',   '/ˈwelkəm/',       'chào mừng',         'Used to greet someone who has arrived',                'Welcome to our school!',                     5::SMALLINT),
    ('11100000-0000-0000-0000-000000000006'::uuid, 'greet',     '/ɡriːt/',         'chào đón',          'To say hello to someone when you meet them',          'She always greets guests with a smile.',      6::SMALLINT),
    ('11100000-0000-0000-0000-000000000007'::uuid, 'farewell',  '/ˌferˈwel/',      'lời tạm biệt',      'A goodbye, especially a formal or final one',          'They said their farewells at the airport.',  7::SMALLINT),
    ('11100000-0000-0000-0000-000000000008'::uuid, 'wave',      '/weɪv/',          'vẫy tay',           'To raise your hand and move it side to side as a greeting', 'He waved goodbye from the window.',    8::SMALLINT),
    ('11100000-0000-0000-0000-000000000009'::uuid, 'see you',   '/siː juː/',       'hẹn gặp lại',       'An informal way of saying goodbye',                    'See you on Monday!',                         9::SMALLINT),
    ('11100000-0000-0000-0000-000000000010'::uuid, 'take care', '/teɪk ker/',      'bảo trọng',         'Said when saying goodbye, wishing someone well',       'Take care! Drive safely.',                  10::SMALLINT)
) AS v(id, word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
CROSS JOIN topic t
CROSS JOIN level l
WHERE t.slug = 'hello-and-goodbyes'
  AND l.code  = 'A1'
  AND NOT EXISTS (
      SELECT 1 FROM topic_word tw
      WHERE tw.topic_id = t.id AND tw.word = v.word
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 3 — VOCABULARY TEST
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO vocabulary_test (id, topic_id, level_id, title, description, is_active)
SELECT
    '12000000-0000-0000-0000-000000000001'::uuid,
    (SELECT id FROM topic WHERE slug = 'hello-and-goodbyes'),
    (SELECT id FROM level WHERE code  = 'A1'),
    'Test: Hello and Goodbyes A1',
    'Bài kiểm tra từ vựng chủ đề Chào hỏi & Tạm biệt — trình độ A1',
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM vocabulary_test WHERE title = 'Test: Hello and Goodbyes A1'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 4 — QUIZ QUESTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- NHÓM A — MULTIPLE CHOICE (5 câu)
-- ────────────────────────────────────────────────────────────────────────────

-- Q-MC-1: "hello" nghĩa là gì?
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000001'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       '11100000-0000-0000-0000-000000000001'::uuid,
       '"hello" có nghĩa là gì?', 'multiple_choice', 1
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000001'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000001'::uuid, ans, corr, ord
FROM (VALUES
    ('xin chào',   TRUE,  1::SMALLINT),
    ('tạm biệt',   FALSE, 2::SMALLINT),
    ('cảm ơn',     FALSE, 3::SMALLINT),
    ('xin lỗi',    FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000001'::uuid
);

-- Q-MC-2: "farewell" nghĩa là gì?
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000002'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       '11100000-0000-0000-0000-000000000007'::uuid,
       '"farewell" có nghĩa là gì?', 'multiple_choice', 2
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000002'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000002'::uuid, ans, corr, ord
FROM (VALUES
    ('lời tạm biệt',  TRUE,  1::SMALLINT),
    ('chào mừng',     FALSE, 2::SMALLINT),
    ('vẫy tay',       FALSE, 3::SMALLINT),
    ('bảo trọng',     FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000002'::uuid
);

-- Q-MC-3: Từ nào KHÔNG dùng để chào hỏi?
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000003'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       NULL,
       'Từ nào KHÔNG phải là cách chào hỏi khi gặp mặt?', 'multiple_choice', 3
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000003'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000003'::uuid, ans, corr, ord
FROM (VALUES
    ('farewell',   TRUE,  1::SMALLINT),   -- farewell = chia tay, không dùng khi gặp
    ('hello',      FALSE, 2::SMALLINT),
    ('hi',         FALSE, 3::SMALLINT),
    ('welcome',    FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000003'::uuid
);

-- Q-MC-4: "welcome" nghĩa là gì?
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000004'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       '11100000-0000-0000-0000-000000000005'::uuid,
       '"welcome" có nghĩa là gì?', 'multiple_choice', 4
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000004'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000004'::uuid, ans, corr, ord
FROM (VALUES
    ('chào mừng',     TRUE,  1::SMALLINT),
    ('chào đón',      FALSE, 2::SMALLINT),
    ('hẹn gặp lại',   FALSE, 3::SMALLINT),
    ('bảo trọng',     FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000004'::uuid
);

-- Q-MC-5: Cách tạm biệt trang trọng nhất là?
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000005'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       NULL,
       'Trong tiếng Anh, cách nói tạm biệt TRANG TRỌNG nhất là?', 'multiple_choice', 5
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000005'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000005'::uuid, ans, corr, ord
FROM (VALUES
    ('farewell',   TRUE,  1::SMALLINT),
    ('bye',        FALSE, 2::SMALLINT),
    ('see you',    FALSE, 3::SMALLINT),
    ('take care',  FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000005'::uuid
);

-- ────────────────────────────────────────────────────────────────────────────
-- NHÓM B — FILL BLANK (4 câu)
-- ────────────────────────────────────────────────────────────────────────────

-- Q-FB-1: "___! My name is Lan." → hello
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000006'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       '11100000-0000-0000-0000-000000000001'::uuid,
       'Điền vào chỗ trống: "_____! My name is Lan." (= lời chào gặp mặt)', 'fill_blank', 6
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000006'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000006'::uuid, ans, corr, ord
FROM (VALUES
    ('hello',    TRUE,  1::SMALLINT),
    ('hi',       TRUE,  2::SMALLINT),   -- cũng chấp nhận
    ('goodbye',  FALSE, 3::SMALLINT),
    ('bye',      FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000006'::uuid
);

-- Q-FB-2: "___! See you tomorrow." → goodbye
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000007'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       '11100000-0000-0000-0000-000000000002'::uuid,
       'Điền vào chỗ trống: "_____! See you tomorrow." (= nói khi rời đi)', 'fill_blank', 7
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000007'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000007'::uuid, ans, corr, ord
FROM (VALUES
    ('goodbye',   TRUE,  1::SMALLINT),
    ('bye',       TRUE,  2::SMALLINT),   -- cũng chấp nhận
    ('hello',     FALSE, 3::SMALLINT),
    ('welcome',   FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000007'::uuid
);

-- Q-FB-3: "___ to our school!" → welcome
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000008'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       '11100000-0000-0000-0000-000000000005'::uuid,
       'Điền vào chỗ trống: "_____ to our school!" (= chào mừng đến trường)', 'fill_blank', 8
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000008'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000008'::uuid, ans, corr, ord
FROM (VALUES
    ('welcome',    TRUE,  1::SMALLINT),
    ('hello',      FALSE, 2::SMALLINT),
    ('farewell',   FALSE, 3::SMALLINT),
    ('greet',      FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000008'::uuid
);

-- Q-FB-4: "___ care! Drive safely." → take
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000009'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       '11100000-0000-0000-0000-000000000010'::uuid,
       'Điền vào chỗ trống: "_____ care! Drive safely." (= lời dặn dò khi tạm biệt)', 'fill_blank', 9
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000009'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000009'::uuid, ans, corr, ord
FROM (VALUES
    ('take',    TRUE,  1::SMALLINT),
    ('have',    FALSE, 2::SMALLINT),
    ('be',      FALSE, 3::SMALLINT),
    ('stay',    FALSE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000009'::uuid
);

-- ────────────────────────────────────────────────────────────────────────────
-- NHÓM C — GRAMMAR MAPPING (2 câu)
-- Mỗi câu: nối từ tiếng Anh với nghĩa tiếng Việt tương ứng
-- ────────────────────────────────────────────────────────────────────────────

-- Q-GM-1: Nối nhóm chào hỏi (hello, hi, greet, welcome)
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000010'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       NULL,
       'Nối từ bên TRÁI với nghĩa đúng bên PHẢI: hello / hi / greet / welcome', 'grammar_mapping', 10
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000010'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000010'::uuid, ans, corr, ord
FROM (VALUES
    ('hello   → xin chào',      TRUE, 1::SMALLINT),
    ('hi      → chào (thân mật)',TRUE, 2::SMALLINT),
    ('greet   → chào đón',      TRUE, 3::SMALLINT),
    ('welcome → chào mừng',     TRUE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000010'::uuid
);

-- Q-GM-2: Nối nhóm tạm biệt (goodbye, bye, farewell, see you, take care, wave)
INSERT INTO quiz_question (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
SELECT '13000000-0000-0000-0000-000000000011'::uuid,
       '12000000-0000-0000-0000-000000000001'::uuid,
       NULL,
       'Nối từ bên TRÁI với nghĩa đúng bên PHẢI: goodbye / bye / farewell / see you', 'grammar_mapping', 11
WHERE NOT EXISTS (SELECT 1 FROM quiz_question WHERE id = '13000000-0000-0000-0000-000000000011'::uuid);

INSERT INTO quiz_answer (quiz_question_id, answer_text, is_correct, display_order)
SELECT '13000000-0000-0000-0000-000000000011'::uuid, ans, corr, ord
FROM (VALUES
    ('goodbye  → tạm biệt',        TRUE, 1::SMALLINT),
    ('bye      → tạm biệt (thân)', TRUE, 2::SMALLINT),
    ('farewell → lời tạm biệt',    TRUE, 3::SMALLINT),
    ('see you  → hẹn gặp lại',     TRUE, 4::SMALLINT)
) AS v(ans, corr, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM quiz_answer WHERE quiz_question_id = '13000000-0000-0000-0000-000000000011'::uuid
);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────
-- Tóm tắt sau khi chạy:
--   Topic : Hello and Goodbyes (A1, slug: hello-and-goodbyes)
--   Words : 10 từ (hello, goodbye, hi, bye, welcome, greet, farewell, wave, see you, take care)
--   Test  : "Test: Hello and Goodbyes A1"
--   ┌─────────────────────────┬───────┐
--   │ Loại câu hỏi            │ Số câu│
--   ├─────────────────────────┼───────┤
--   │ multiple_choice         │   5   │
--   │ fill_blank              │   4   │
--   │ grammar_mapping         │   2   │
--   ├─────────────────────────┼───────┤
--   │ TỔNG                    │  11   │
--   └─────────────────────────┴───────┘
-- ─────────────────────────────────────────────────────────────────────────
