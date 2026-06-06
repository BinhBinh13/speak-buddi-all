-- speak-buddi-be/db/migrations/006_translation_history.sql
-- S5.2: Tạo bảng translation_history để lưu lịch sử dịch của user đã đăng nhập.
-- Chạy: psql -U <user> -d speakbuddi -f db/migrations/006_translation_history.sql

CREATE TABLE IF NOT EXISTS translation_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_text TEXT        NOT NULL,
    target_text TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index tối ưu query top-20 theo user + thời gian mới nhất (AC-07-03)
CREATE INDEX IF NOT EXISTS idx_translation_history_user_created
    ON translation_history (user_id, created_at DESC);
