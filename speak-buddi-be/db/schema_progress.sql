-- ─── SpeakBuddi — Schema Progress (PostgreSQL) ───────────────────────────────
-- Phạm vi S3.3: lưu tiến độ học từ của user (per-word + topic context)
--
-- Yêu cầu thứ tự chạy:
--   1. psql -U <user> -d <db> -f db/schema_core.sql     ← phải chạy TRƯỚC
--   2. psql -U <user> -d <db> -f db/schema_learning.sql ← phải chạy TRƯỚC
--   3. psql -U <user> -d <db> -f db/schema_progress.sql ← file này
--
-- Lần đầu setup (idempotent — chạy 2 lần không lỗi):
--   createdb -U postgres speakbuddi
--   psql -U postgres -d speakbuddi -f db/schema_core.sql
--   psql -U postgres -d speakbuddi -f db/schema_learning.sql
--   psql -U postgres -d speakbuddi -f db/schema_progress.sql
--   psql -U postgres -d speakbuddi -f db/seed_dev.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Extension pgcrypto (gen_random_uuid) — đảm bảo có dù chạy standalone
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── user_word_progress ───────────────────────────────────────────────────────
-- Tiến độ học từng từ của từng user (AC-05-03):
--   - Nguồn sự thật per-word: status known / learning
--   - topic_id + level_id lưu snapshot ngữ cảnh để query nhanh không cần JOIN ngược
--   - Topic progress là derived — tính aggregate từ các row của topic (không trùng lặp)
--   - UNIQUE (user_id, topic_word_id) → upsert an toàn khi học lại
--   - Soft-delete topic_word (is_active=false) KHÔNG ảnh hưởng FK (chỉ hard-delete mới kích CASCADE)
--     → tiến độ được bảo toàn khi crawler cập nhật/soft-disable từ (chuẩn bị AC-05-04 / S3.4)
CREATE TABLE IF NOT EXISTS user_word_progress (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_word_id UUID        NOT NULL REFERENCES topic_word(id) ON DELETE CASCADE,
    topic_id      UUID        NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    level_id      UUID        REFERENCES level(id) ON DELETE SET NULL,   -- snapshot level context (AC-05-03)
    status        VARCHAR(20) NOT NULL DEFAULT 'learning'
                              CHECK (status IN ('known', 'learning')),
    review_count  INTEGER     NOT NULL DEFAULT 0,        -- số lần đánh dấu (analytics nhẹ)
    last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, topic_word_id)   -- upsert key: 1 từ / 1 user → 1 dòng
);

-- Index: query nhanh theo (user, topic) — dùng trong GET /api/topics/{id}/progress
CREATE INDEX IF NOT EXISTS idx_uwp_user_topic
    ON user_word_progress (user_id, topic_id);

-- Index: chuẩn bị cho roadmap/level aggregate (EPIC-2/4 tương lai)
CREATE INDEX IF NOT EXISTS idx_uwp_user_level
    ON user_word_progress (user_id, level_id);

-- Index: lọc theo status (analytics, dashboard admin)
CREATE INDEX IF NOT EXISTS idx_uwp_user_status
    ON user_word_progress (user_id, status);

-- ─── Trigger: tự cập nhật updated_at ─────────────────────────────────────────
-- Dùng lại hàm set_updated_at() đã định nghĩa trong schema_core.sql
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_word_progress'
    ) THEN
        EXECUTE '
            CREATE OR REPLACE TRIGGER trg_user_word_progress_updated_at
            BEFORE UPDATE ON user_word_progress
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
        ';
    END IF;
END;
$$;
