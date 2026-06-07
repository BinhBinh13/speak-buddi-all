-- Migration 011: lưu transcript hội thoại AI theo user + topic + batch (S7.x)
-- Idempotent — chạy nhiều lần không lỗi
--
-- Chạy: psql -U <user> -d speakbuddi -f db/migrations/011_conversation_transcript.sql

CREATE TABLE IF NOT EXISTS conversation_transcript (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id      UUID        NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    batch_index   SMALLINT    NOT NULL,
    messages      JSONB       NOT NULL DEFAULT '[]'::JSONB,
    covered_words JSONB       NOT NULL DEFAULT '[]'::JSONB,
    batch_done    BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, topic_id, batch_index)
);

CREATE INDEX IF NOT EXISTS idx_conv_transcript_user_topic
    ON conversation_transcript (user_id, topic_id);
