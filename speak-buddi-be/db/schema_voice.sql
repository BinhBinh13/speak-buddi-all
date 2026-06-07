\encoding UTF8
-- ─── SpeakBuddi — Schema Voice/Preference bổ sung (PostgreSQL) ───────────────
-- Phạm vi S8.4: elevenlabs_voice_model + user_voice_preference (UC11/AC-11)
--
-- Yêu cầu thứ tự chạy:
--   1. psql -U <user> -d <db> -f db/schema_core.sql
--   2. psql -U <user> -d <db> -f db/schema_learning.sql
--   3. psql -U <user> -d <db> -f db/schema_progress.sql
--   4. psql -U <user> -d <db> -f db/schema_quiz.sql
--   5. psql -U <user> -d <db> -f db/schema_payment.sql
--   6. psql -U <user> -d <db> -f db/schema_voice.sql   ← file này
--
-- Idempotent — chạy lại nhiều lần không lỗi.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── 1. elevenlabs_voice_model ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS elevenlabs_voice_model (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_id     TEXT         NOT NULL UNIQUE,
    model_id     TEXT         NOT NULL DEFAULT 'eleven_multilingual_v2',
    display_name TEXT         NOT NULL,
    accent       TEXT,
    gender       TEXT,
    is_pro       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elvm_active_sort
    ON elevenlabs_voice_model (is_active, sort_order);


-- ─── 2. user_voice_preference ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_voice_preference (
    user_id        UUID         PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    voice_model_id UUID         NOT NULL REFERENCES elevenlabs_voice_model (id),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ─── Trigger: tự cập nhật updated_at ─────────────────────────────────────────
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['elevenlabs_voice_model', 'user_voice_preference']
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) AND EXISTS (
            SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
        ) THEN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
                 CREATE TRIGGER trg_%s_updated_at
                     BEFORE UPDATE ON %I
                     FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
                t, t, t, t
            );
        END IF;
    END LOOP;
END $$;
