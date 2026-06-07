\encoding UTF8
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

-- ─── S2.5: user_session_progress + user_topic ─────────────────────────────────

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

CREATE TABLE IF NOT EXISTS user_topic (
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id  UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_ut_user
    ON user_topic (user_id);

-- ─── S7.x: conversation_transcript ───────────────────────────────────────────
-- Đồng bộ từ db/migrations/011_conversation_transcript.sql

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

-- ─── S6.2/S6.3: pronunciation_attempt + pronunciation_syllable_score ──────────
-- Đồng bộ từ db/migrations/007_pronunciation.sql
-- Lưu mỗi lần user luyện phát âm: target_text, điểm (overall/accuracy/fluency),
-- feedback tiếng Việt. Không lưu audio (quyết định thiết kế S6.3).

CREATE TABLE IF NOT EXISTS pronunciation_attempt (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_word_id UUID        REFERENCES topic_word(id) ON DELETE SET NULL,
    target_text   VARCHAR(1000) NOT NULL,
    audio_url     VARCHAR(500),
    overall_score  NUMERIC(5,2) CHECK (overall_score  BETWEEN 0 AND 100),
    accuracy_score NUMERIC(5,2) CHECK (accuracy_score BETWEEN 0 AND 100),
    fluency_score  NUMERIC(5,2) CHECK (fluency_score  BETWEEN 0 AND 100),
    feedback      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pron_attempt_user
    ON pronunciation_attempt (user_id, created_at);

CREATE TABLE IF NOT EXISTS pronunciation_syllable_score (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id    UUID        NOT NULL REFERENCES pronunciation_attempt(id) ON DELETE CASCADE,
    syllable_text VARCHAR(100) NOT NULL,
    score         NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    display_order SMALLINT    NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pron_syl_attempt
    ON pronunciation_syllable_score (attempt_id);

-- ─── S7.2: ai_quota_window ────────────────────────────────────────────────────
-- Cửa sổ quota 5 giờ cho hội thoại AI của free user (AC-09-01/02, BR02/03).
-- Đồng bộ từ db/migrations/008_ai_quota_window.sql.
-- Fixed 5h window; lazy reset (BR03): cửa sổ hết hạn bị bỏ qua, tạo mới.

CREATE TABLE IF NOT EXISTS ai_quota_window (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    window_start_at TIMESTAMPTZ NOT NULL,
    window_end_at   TIMESTAMPTZ NOT NULL,
    used_seconds    INTEGER     NOT NULL DEFAULT 0 CHECK (used_seconds >= 0),
    max_seconds     INTEGER     NOT NULL DEFAULT 900,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, window_start_at)
);

CREATE INDEX IF NOT EXISTS idx_aiqw_user_end
    ON ai_quota_window (user_id, window_end_at);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ai_quota_window'
    ) THEN
        EXECUTE '
            CREATE OR REPLACE TRIGGER trg_ai_quota_window_updated_at
            BEFORE UPDATE ON ai_quota_window
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
        ';
    END IF;
END;
$$;
