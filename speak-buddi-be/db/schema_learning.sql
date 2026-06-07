\encoding UTF8
-- ─── SpeakBuddi — Schema Learning content (PostgreSQL) ───────────────────────
-- Phạm vi S3.1: nhóm Learning content
--   level / topic / tag / topic_word / topic_word_tag
--
-- Yêu cầu thứ tự chạy:
--   1. psql -U <user> -d <db> -f db/schema_core.sql   ← phải chạy TRƯỚC
--      (tạo users, hàm set_updated_at(), extension pgcrypto)
--   2. psql -U <user> -d <db> -f db/schema_learning.sql  ← file này
--
-- Lần đầu setup (idempotent — chạy 2 lần không lỗi):
--   createdb -U postgres speakbuddi
--   psql -U postgres -d speakbuddi -f db/schema_core.sql
--   psql -U postgres -d speakbuddi -f db/schema_learning.sql
--
-- Ghi chú: Nếu schema_core.sql đã chứa learning tables (migration cũ), file này
--   vẫn chạy an toàn nhờ CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

-- Extension pgcrypto (gen_random_uuid) — đảm bảo có dù chạy standalone
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. level ─────────────────────────────────────────────────────────────────
-- Danh mục trình độ A1–C2 (tập cố định 6 giá trị, không cần soft-delete)
-- SRS §5.3 — "Vocabulary gắn level context để lọc theo A1–C2"
CREATE TABLE IF NOT EXISTS level (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(10)  NOT NULL,                         -- A1/A2/B1/B2/C1/C2
    name          VARCHAR(100) NOT NULL,                         -- "Beginner (A1)"…
    display_order SMALLINT     NOT NULL DEFAULT 0,               -- thứ tự roadmap
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_level_code
    ON level (code);

CREATE UNIQUE INDEX IF NOT EXISTS uq_level_name
    ON level (name);

-- ─── 2. topic ─────────────────────────────────────────────────────────────────
-- Chủ đề từ vựng; gắn với 1 level; soft-delete qua is_active (SRS §5.3)
-- source: phân biệt nội dung tạo tay ('admin') vs crawler Langeek ('langeek') — chuẩn bị S9.3
CREATE TABLE IF NOT EXISTS topic (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id      UUID         REFERENCES level (id) ON DELETE SET NULL,
    name          VARCHAR(150) NOT NULL,
    slug          VARCHAR(180) NOT NULL,
    description   TEXT,
    display_order SMALLINT     NOT NULL DEFAULT 0,
    source        VARCHAR(20)  NOT NULL DEFAULT 'admin'
                               CHECK (source IN ('admin', 'langeek')),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,            -- soft-delete §5.3
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_topic_name
    ON topic (name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_topic_slug
    ON topic (slug);

CREATE INDEX IF NOT EXISTS idx_topic_level
    ON topic (level_id);

CREATE INDEX IF NOT EXISTS idx_topic_active_order
    ON topic (is_active, display_order);

-- ─── 3. tag ───────────────────────────────────────────────────────────────────
-- Nhãn gắn cho từ vựng (vd: noun, verb, IELTS, business); hard-delete khi dọn
CREATE TABLE IF NOT EXISTS tag (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tag_name
    ON tag (name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tag_slug
    ON tag (slug);

-- ─── 4. topic_word ────────────────────────────────────────────────────────────
-- Từ vựng trong topic; soft-delete qua is_active; level_id denormalize (§3.4)
-- AC-05-02: lưu meaning_vi, meaning_en, example_sentence, phonetic (IPA)
-- created_by: UUID admin tạo tay; NULL nếu từ crawler (S9.3)
CREATE TABLE IF NOT EXISTS topic_word (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id         UUID         NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    level_id         UUID         REFERENCES level (id) ON DELETE SET NULL,  -- denormalize §3.4
    word             VARCHAR(120) NOT NULL,
    phonetic         VARCHAR(120),                    -- IPA (AC-05-02)
    meaning_vi       VARCHAR(500) NOT NULL,            -- nghĩa tiếng Việt (AC-05-02)
    meaning_en       VARCHAR(500),                     -- định nghĩa EN (AC-05-02)
    example_sentence VARCHAR(1000),                    -- ví dụ dùng trong câu (AC-05-02)
    grammar_note     VARCHAR(1000),                    -- ghi chú ngữ pháp (§3.4)
    audio_url        TEXT,
    source           VARCHAR(20)  NOT NULL DEFAULT 'admin'
                                  CHECK (source IN ('admin', 'langeek')),
    display_order    SMALLINT     NOT NULL DEFAULT 0,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,   -- soft-delete §5.3
    created_by       UUID         REFERENCES users (id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (topic_id, word)        -- chống trùng từ trong cùng topic (AC-13-02)
);

CREATE INDEX IF NOT EXISTS idx_topic_word_topic_active
    ON topic_word (topic_id, is_active);

CREATE INDEX IF NOT EXISTS idx_topic_word_level
    ON topic_word (level_id);

CREATE INDEX IF NOT EXISTS idx_topic_word_created_by
    ON topic_word (created_by);

-- ─── 5. topic_word_tag ────────────────────────────────────────────────────────
-- Bảng nối M:N giữa topic_word và tag; hard-delete khi hủy liên kết
CREATE TABLE IF NOT EXISTS topic_word_tag (
    topic_word_id UUID NOT NULL REFERENCES topic_word (id) ON DELETE CASCADE,
    tag_id        UUID NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
    PRIMARY KEY (topic_word_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_word_tag_tag
    ON topic_word_tag (tag_id);

-- ─── Trigger: tự cập nhật updated_at ─────────────────────────────────────────
-- Dùng lại hàm set_updated_at() đã định nghĩa trong schema_core.sql
-- Guard IF EXISTS: an toàn khi bảng đã tồn tại hoặc chưa tồn tại
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['level', 'topic', 'tag', 'topic_word']
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

-- ─── Seed S3.1: 6 level A1–C2 ────────────────────────────────────────────────
-- Idempotent: bỏ qua nếu code đã tồn tại
INSERT INTO level (id, code, name, display_order)
SELECT id, code, name, display_order FROM (VALUES
    (gen_random_uuid(), 'A1', 'Beginner (A1)',            1::SMALLINT),
    (gen_random_uuid(), 'A2', 'Elementary (A2)',          2::SMALLINT),
    (gen_random_uuid(), 'B1', 'Intermediate (B1)',        3::SMALLINT),
    (gen_random_uuid(), 'B2', 'Upper-Intermediate (B2)', 4::SMALLINT),
    (gen_random_uuid(), 'C1', 'Advanced (C1)',            5::SMALLINT),
    (gen_random_uuid(), 'C2', 'Proficiency (C2)',         6::SMALLINT)
) AS v (id, code, name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM level WHERE code = v.code);

-- ─── Seed S3.1: 3 tag mẫu ────────────────────────────────────────────────────
INSERT INTO tag (name, slug)
SELECT name, slug FROM (VALUES
    ('noun',     'noun'),
    ('verb',     'verb'),
    ('everyday', 'everyday')
) AS v (name, slug)
WHERE NOT EXISTS (SELECT 1 FROM tag WHERE tag.slug = v.slug);

-- ─── Seed S3.1: Topic 1 — Greetings & Introductions (level A1) ───────────────
INSERT INTO topic (id, level_id, name, slug, description, display_order, source)
SELECT
    gen_random_uuid(),
    (SELECT id FROM level WHERE code = 'A1'),
    'Greetings & Introductions',
    'greetings-introductions',
    'Các câu chào hỏi và giới thiệu bản thân cơ bản',
    1,
    'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'greetings-introductions');

-- ─── Seed S3.1: Topic 2 — Daily Routines (level A2) ──────────────────────────
INSERT INTO topic (id, level_id, name, slug, description, display_order, source)
SELECT
    gen_random_uuid(),
    (SELECT id FROM level WHERE code = 'A2'),
    'Daily Routines',
    'daily-routines',
    'Từ vựng và diễn đạt liên quan đến hoạt động hàng ngày',
    1,
    'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'daily-routines');

-- ─── Seed S3.1: topic_word — Greetings & Introductions (5 từ) ────────────────
INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic  WHERE slug = 'greetings-introductions'),
    (SELECT id FROM level  WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence,
    'admin', v.display_order
FROM (VALUES
    ('hello',     '/həˈloʊ/',         'xin chào',      'a greeting used when meeting someone',     'Hello! My name is Linh.',            1::SMALLINT),
    ('goodbye',   '/ˌɡʊdˈbaɪ/',      'tạm biệt',      'said when leaving someone',                'Goodbye! See you tomorrow.',          2::SMALLINT),
    ('name',      '/neɪm/',           'tên',            'a word that identifies a person or thing', 'My name is Lan. What is your name?',  3::SMALLINT),
    ('meet',      '/miːt/',           'gặp gỡ',         'to come together with someone',            'Nice to meet you!',                   4::SMALLINT),
    ('introduce', '/ˌɪntrəˈdjuːs/',  'giới thiệu',    'to present someone to another person',     'Let me introduce my friend Minh.',    5::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
      AND word = v.word
);

-- ─── Seed S3.1: topic_word — Daily Routines (5 từ) ───────────────────────────
INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic  WHERE slug = 'daily-routines'),
    (SELECT id FROM level  WHERE code = 'A2'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence,
    'admin', v.display_order
FROM (VALUES
    ('wake up',   '/weɪk ʌp/',   'thức dậy',              'to stop sleeping',                               'I wake up at 6 every morning.',         1::SMALLINT),
    ('breakfast', '/ˈbrekfəst/', 'bữa sáng',              'the first meal of the day',                      'I eat breakfast before school.',         2::SMALLINT),
    ('commute',   '/kəˈmjuːt/',  'đi lại (thường ngày)', 'to travel regularly between home and work',      'My commute takes 30 minutes.',          3::SMALLINT),
    ('schedule',  '/ˈʃedjuːl/',  'lịch trình',            'a plan of things to do at certain times',        'I have a busy schedule today.',          4::SMALLINT),
    ('routine',   '/ruːˈtiːn/',  'thói quen hàng ngày',  'a usual set of activities done regularly',       'Exercise is part of my daily routine.',  5::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'daily-routines')
      AND word = v.word
);

-- ─── Seed S3.1: liên kết topic_word_tag ──────────────────────────────────────
-- noun  → name, breakfast, schedule, routine
-- verb  → meet, introduce, wake up, commute
-- everyday → hello, goodbye, wake up, breakfast
INSERT INTO topic_word_tag (topic_word_id, tag_id)
SELECT tw.id, tg.id
FROM (VALUES
    ('name',       'noun'),
    ('breakfast',  'noun'),
    ('schedule',   'noun'),
    ('routine',    'noun'),
    ('meet',       'verb'),
    ('introduce',  'verb'),
    ('wake up',    'verb'),
    ('commute',    'verb'),
    ('hello',      'everyday'),
    ('goodbye',    'everyday'),
    ('wake up',    'everyday'),
    ('breakfast',  'everyday')
) AS v (word, tag_slug)
JOIN topic_word tw ON tw.word = v.word
JOIN tag        tg ON tg.slug = v.tag_slug
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word_tag
    WHERE topic_word_id = tw.id AND tag_id = tg.id
);
