-- ─── Migration 007: pronunciation_attempt + pronunciation_syllable_score (S6.2) ─
-- Chạy idempotent (IF NOT EXISTS) — an toàn khi chạy lại.
-- Yêu cầu: schema_core.sql + schema_learning.sql + migration 006 đã chạy trước.
-- audio_url để NULL ở S6.2; S6.3 sẽ điền vào.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── pronunciation_attempt ────────────────────────────────────────────────────
-- Lưu mỗi lần user luyện phát âm 1 từ: target_text, transcript (không lưu),
-- điểm overall/accuracy/fluency, feedback tiếng Việt.
-- audio_url để NULL ở S6.2 — S6.3 sẽ dùng khi có storage.
-- topic_word_id FK tuỳ chọn: NULL khi dùng từ hardcode; TBD khi nối roadmap/vocab.
CREATE TABLE IF NOT EXISTS pronunciation_attempt (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_word_id UUID        REFERENCES topic_word(id) ON DELETE SET NULL,
    target_text   VARCHAR(1000) NOT NULL,
    audio_url     VARCHAR(500),                     -- NULL ở S6.2, S6.3 sẽ dùng
    overall_score  NUMERIC(5,2) CHECK (overall_score  BETWEEN 0 AND 100),
    accuracy_score NUMERIC(5,2) CHECK (accuracy_score BETWEEN 0 AND 100),
    fluency_score  NUMERIC(5,2) CHECK (fluency_score  BETWEEN 0 AND 100),
    feedback      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pron_attempt_user
    ON pronunciation_attempt (user_id, created_at);

-- ─── pronunciation_syllable_score ─────────────────────────────────────────────
-- Breakdown điểm từng âm tiết trong 1 lần attempt.
-- display_order: thứ tự hiển thị chip âm tiết trên FE.
CREATE TABLE IF NOT EXISTS pronunciation_syllable_score (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id    UUID        NOT NULL REFERENCES pronunciation_attempt(id) ON DELETE CASCADE,
    syllable_text VARCHAR(100) NOT NULL,
    score         NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    display_order SMALLINT    NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pron_syl_attempt
    ON pronunciation_syllable_score (attempt_id);
