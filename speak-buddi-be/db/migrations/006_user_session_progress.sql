-- ─── Migration 006: user_session_progress + user_topic (S2.5) ─────────────────
-- Chạy idempotent (IF NOT EXISTS) — an toàn khi chạy lại.
-- Yêu cầu: schema_core.sql + schema_learning.sql đã chạy trước.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── user_session_progress ────────────────────────────────────────────────────
-- Lưu tiến độ batch AI conversation của user trên từng topic.
-- batch_index + batch_size snapshot theo lần chạy để không bị lệch khi
-- user đổi words_per_session sau này.
CREATE TABLE IF NOT EXISTS user_session_progress (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id     UUID        NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    batch_index  SMALLINT    NOT NULL,
    batch_size   SMALLINT    NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                             CHECK (status IN ('in_progress', 'completed')),
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, topic_id, batch_index)
);

CREATE INDEX IF NOT EXISTS idx_usp_user_topic
    ON user_session_progress (user_id, topic_id);

-- ─── user_topic ───────────────────────────────────────────────────────────────
-- Danh sách topic user đã add vào danh sách học từ vựng (từ TopicModal).
-- VocabularyPage sẽ hiển thị đúng các topic user đã chọn, không dùng
-- dropdown level nữa (AC-S2.5).
CREATE TABLE IF NOT EXISTS user_topic (
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id  UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_ut_user
    ON user_topic (user_id);
