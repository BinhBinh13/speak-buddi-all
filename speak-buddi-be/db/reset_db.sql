\encoding UTF8
-- ─── SpeakBuddi — Reset DB: drop all → recreate schema → seed admin ────────────
--
-- Mục đích: dọn sạch toàn bộ DB và dựng lại từ đầu (development / staging).
--           Chỉ seed tài khoản admin + dữ liệu hệ thống bắt buộc.
--           KHÔNG seed nội dung học (topic, topic_word, quiz…).
--
-- Cách chạy:
--   psql -U postgres -d speakbuddi -f db/reset_db.sql
--
-- Lưu ý: script này DROP hết bảng → KHÔNG chạy trên production.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 1 — DROP TẤT CẢ (theo thứ tự ngược FK)
-- ═══════════════════════════════════════════════════════════════════════════

-- Leaf tables (không có bảng nào tham chiếu đến chúng)
DROP TABLE IF EXISTS content_crawl_log            CASCADE;
DROP TABLE IF EXISTS content_crawl_job            CASCADE;
DROP TABLE IF EXISTS content_source               CASCADE;

DROP TABLE IF EXISTS user_voice_preference        CASCADE;
DROP TABLE IF EXISTS elevenlabs_voice_model       CASCADE;

DROP TABLE IF EXISTS report_export_history        CASCADE;
DROP TABLE IF EXISTS translation_history          CASCADE;

DROP TABLE IF EXISTS quiz_attempt_answer          CASCADE;
DROP TABLE IF EXISTS quiz_answer                  CASCADE;
DROP TABLE IF EXISTS quiz_attempt                 CASCADE;
DROP TABLE IF EXISTS quiz_question                CASCADE;
DROP TABLE IF EXISTS vocabulary_test              CASCADE;

DROP TABLE IF EXISTS pronunciation_syllable_score CASCADE;
DROP TABLE IF EXISTS pronunciation_attempt        CASCADE;

DROP TABLE IF EXISTS ai_quota_window              CASCADE;
DROP TABLE IF EXISTS conversation_transcript      CASCADE;
DROP TABLE IF EXISTS user_session_progress        CASCADE;
DROP TABLE IF EXISTS user_topic                   CASCADE;
DROP TABLE IF EXISTS user_word_progress           CASCADE;

DROP TABLE IF EXISTS payment_transaction          CASCADE;
DROP TABLE IF EXISTS user_subscription            CASCADE;

DROP TABLE IF EXISTS topic_word_tag               CASCADE;
DROP TABLE IF EXISTS topic_word                   CASCADE;
DROP TABLE IF EXISTS topic                        CASCADE;
DROP TABLE IF EXISTS tag                          CASCADE;
DROP TABLE IF EXISTS level                        CASCADE;

DROP TABLE IF EXISTS password_reset_token         CASCADE;
DROP TABLE IF EXISTS user_session                 CASCADE;
DROP TABLE IF EXISTS oauth_account                CASCADE;
DROP TABLE IF EXISTS user_profile                 CASCADE;
DROP TABLE IF EXISTS payment_plan                 CASCADE;
DROP TABLE IF EXISTS users                        CASCADE;

-- Trigger function
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 2 — EXTENSIONS & TRIGGER FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Helper macro: gắn trigger updated_at cho bảng bất kỳ
-- Dùng inline DO block sau mỗi nhóm bảng.

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 3 — SCHEMA: Core (users / auth / payment)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── users ───────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255),
    role          VARCHAR(20)  NOT NULL DEFAULT 'student'
                               CHECK (role IN ('student', 'admin')),
    status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_users_email   ON users (LOWER(email));
CREATE        INDEX idx_users_role   ON users (role, status);

-- ─── user_profile ─────────────────────────────────────────────────────────
-- daily_minutes / words_per_session: onboarding preferences (migration 003)
CREATE TABLE user_profile (
    user_id            UUID         PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    name               VARCHAR(255),
    target_level       VARCHAR(10),
    learning_goal      VARCHAR(255),
    interests          TEXT[],
    timezone           VARCHAR(60)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    avatar_url         TEXT,
    daily_minutes      INTEGER      NOT NULL DEFAULT 10,
    words_per_session  INTEGER      NOT NULL DEFAULT 10,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_profile_onboarding ON user_profile (user_id) WHERE target_level IS NOT NULL;

-- ─── oauth_account ────────────────────────────────────────────────────────
CREATE TABLE oauth_account (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider         VARCHAR(50)  NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token     TEXT,
    refresh_token    TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);
CREATE INDEX idx_oauth_user ON oauth_account (user_id);

-- ─── user_session ─────────────────────────────────────────────────────────
CREATE TABLE user_session (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(64) NOT NULL,
    user_agent         TEXT,
    ip_address         INET,
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked            BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_session_active ON user_session (user_id, revoked) WHERE revoked = FALSE;

-- ─── password_reset_token ─────────────────────────────────────────────────
CREATE TABLE password_reset_token (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_prt_user    ON password_reset_token (user_id);
CREATE INDEX idx_prt_expires ON password_reset_token (expires_at) WHERE NOT used;

-- ─── payment_plan ─────────────────────────────────────────────────────────
CREATE TABLE payment_plan (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    price_vnd     INTEGER      NOT NULL CHECK (price_vnd >= 0),
    duration_days INTEGER      NOT NULL CHECK (duration_days >= 0),
    description   TEXT,
    features      TEXT[],
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order    SMALLINT     NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_plan_active ON payment_plan (is_active, sort_order);

-- ─── user_subscription ────────────────────────────────────────────────────
CREATE TABLE user_subscription (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    plan_id     UUID        NOT NULL REFERENCES payment_plan (id),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    starts_at   TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    payment_ref VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_sub_status ON user_subscription (user_id, status);

DO $$ DECLARE t TEXT; BEGIN
    FOREACH t IN ARRAY ARRAY['users','user_profile','oauth_account','payment_plan','user_subscription'] LOOP
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 4 — SCHEMA: Learning (level / topic / tag / topic_word)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── level ────────────────────────────────────────────────────────────────
CREATE TABLE level (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(10) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    display_order SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_level_code ON level (code);
CREATE UNIQUE INDEX uq_level_name ON level (name);

-- ─── topic ────────────────────────────────────────────────────────────────
-- difficulty (migration 004): độ khó 1–N để sắp xếp roadmap
-- admin_locked (S9.5): crawler không ghi đè khi admin đã sửa
CREATE TABLE topic (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id      UUID         REFERENCES level (id) ON DELETE SET NULL,
    name          VARCHAR(150) NOT NULL,
    slug          VARCHAR(180) NOT NULL,
    description   TEXT,
    display_order SMALLINT     NOT NULL DEFAULT 0,
    difficulty    SMALLINT     NOT NULL DEFAULT 1,
    source        VARCHAR(20)  NOT NULL DEFAULT 'admin'
                               CHECK (source IN ('admin', 'langeek')),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    admin_locked  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_topic_name         ON topic (name);
CREATE UNIQUE INDEX uq_topic_slug         ON topic (slug);
CREATE        INDEX idx_topic_level       ON topic (level_id);
CREATE        INDEX idx_topic_active      ON topic (is_active, display_order);
CREATE        INDEX idx_topic_difficulty  ON topic (level_id, difficulty);

-- ─── tag ──────────────────────────────────────────────────────────────────
CREATE TABLE tag (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_tag_name ON tag (name);
CREATE UNIQUE INDEX uq_tag_slug ON tag (slug);

-- ─── topic_word ───────────────────────────────────────────────────────────
-- admin_locked (S9.5): crawler không ghi đè khi admin đã sửa
CREATE TABLE topic_word (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id         UUID          NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    level_id         UUID          REFERENCES level (id) ON DELETE SET NULL,
    word             VARCHAR(120)  NOT NULL,
    phonetic         VARCHAR(120),
    meaning_vi       VARCHAR(500)  NOT NULL,
    meaning_en       VARCHAR(500),
    example_sentence VARCHAR(1000),
    grammar_note     VARCHAR(1000),
    audio_url        TEXT,
    source           VARCHAR(20)   NOT NULL DEFAULT 'admin'
                                   CHECK (source IN ('admin', 'langeek')),
    display_order    SMALLINT      NOT NULL DEFAULT 0,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    admin_locked     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by       UUID          REFERENCES users (id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (topic_id, word)
);
CREATE INDEX idx_topic_word_topic  ON topic_word (topic_id, is_active);
CREATE INDEX idx_topic_word_level  ON topic_word (level_id);
CREATE INDEX idx_topic_word_by     ON topic_word (created_by);

-- ─── topic_word_tag ───────────────────────────────────────────────────────
CREATE TABLE topic_word_tag (
    topic_word_id UUID NOT NULL REFERENCES topic_word (id) ON DELETE CASCADE,
    tag_id        UUID NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
    PRIMARY KEY (topic_word_id, tag_id)
);
CREATE INDEX idx_twt_tag ON topic_word_tag (tag_id);

DO $$ DECLARE t TEXT; BEGIN
    FOREACH t IN ARRAY ARRAY['level','topic','tag','topic_word'] LOOP
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 5 — SCHEMA: Progress
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE user_word_progress (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_word_id UUID        NOT NULL REFERENCES topic_word (id) ON DELETE CASCADE,
    topic_id      UUID        NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    level_id      UUID        REFERENCES level (id) ON DELETE SET NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'learning'
                              CHECK (status IN ('known', 'learning')),
    review_count  INTEGER     NOT NULL DEFAULT 0,
    last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, topic_word_id)
);
CREATE INDEX idx_uwp_user_topic  ON user_word_progress (user_id, topic_id);
CREATE INDEX idx_uwp_user_level  ON user_word_progress (user_id, level_id);
CREATE INDEX idx_uwp_user_status ON user_word_progress (user_id, status);

CREATE TABLE user_session_progress (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_id     UUID        NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    batch_index  SMALLINT    NOT NULL,
    batch_size   SMALLINT    NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                             CHECK (status IN ('in_progress', 'completed')),
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, topic_id, batch_index)
);
CREATE INDEX idx_usp_user_topic ON user_session_progress (user_id, topic_id);

CREATE TABLE user_topic (
    user_id  UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_id UUID        NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);
CREATE INDEX idx_ut_user ON user_topic (user_id);

CREATE TABLE conversation_transcript (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_id      UUID        NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    batch_index   SMALLINT    NOT NULL,
    messages      JSONB       NOT NULL DEFAULT '[]'::JSONB,
    covered_words JSONB       NOT NULL DEFAULT '[]'::JSONB,
    batch_done    BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, topic_id, batch_index)
);
CREATE INDEX idx_conv_user_topic ON conversation_transcript (user_id, topic_id);

CREATE TABLE pronunciation_attempt (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_word_id  UUID          REFERENCES topic_word (id) ON DELETE SET NULL,
    target_text    VARCHAR(1000) NOT NULL,
    audio_url      VARCHAR(500),
    overall_score  NUMERIC(5,2)  CHECK (overall_score  BETWEEN 0 AND 100),
    accuracy_score NUMERIC(5,2)  CHECK (accuracy_score BETWEEN 0 AND 100),
    fluency_score  NUMERIC(5,2)  CHECK (fluency_score  BETWEEN 0 AND 100),
    feedback       TEXT,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pron_user ON pronunciation_attempt (user_id, created_at);

CREATE TABLE pronunciation_syllable_score (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id    UUID         NOT NULL REFERENCES pronunciation_attempt (id) ON DELETE CASCADE,
    syllable_text VARCHAR(100) NOT NULL,
    score         NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    display_order SMALLINT     NOT NULL DEFAULT 0
);
CREATE INDEX idx_pron_syl ON pronunciation_syllable_score (attempt_id);

CREATE TABLE ai_quota_window (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    window_start_at TIMESTAMPTZ NOT NULL,
    window_end_at   TIMESTAMPTZ NOT NULL,
    used_seconds    INTEGER     NOT NULL DEFAULT 0 CHECK (used_seconds >= 0),
    max_seconds     INTEGER     NOT NULL DEFAULT 900,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, window_start_at)
);
CREATE INDEX idx_aiqw_user_end ON ai_quota_window (user_id, window_end_at);

DO $$ DECLARE t TEXT; BEGIN
    FOREACH t IN ARRAY ARRAY['user_word_progress','ai_quota_window'] LOOP
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 6 — SCHEMA: Quiz / Test
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE vocabulary_test (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id    UUID         REFERENCES topic (id) ON DELETE SET NULL,
    level_id    UUID         REFERENCES level (id) ON DELETE SET NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by  UUID         REFERENCES users (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vt_topic       ON vocabulary_test (topic_id);
CREATE INDEX idx_vt_level       ON vocabulary_test (level_id);
CREATE INDEX idx_vt_active      ON vocabulary_test (is_active, topic_id);

CREATE TABLE quiz_question (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_test_id UUID        NOT NULL REFERENCES vocabulary_test (id) ON DELETE CASCADE,
    topic_word_id      UUID        REFERENCES topic_word (id) ON DELETE SET NULL,
    question_text      TEXT        NOT NULL,
    question_type      VARCHAR(30) NOT NULL
                                   CHECK (question_type IN ('flashcard','multiple_choice','fill_blank','grammar_mapping')),
    display_order      SMALLINT    NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_qq_test       ON quiz_question (vocabulary_test_id);
CREATE INDEX idx_qq_word       ON quiz_question (topic_word_id);
CREATE INDEX idx_qq_test_order ON quiz_question (vocabulary_test_id, display_order);

CREATE TABLE quiz_answer (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_question_id UUID        NOT NULL REFERENCES quiz_question (id) ON DELETE CASCADE,
    answer_text      TEXT        NOT NULL,
    is_correct       BOOLEAN     NOT NULL DEFAULT FALSE,
    display_order    SMALLINT    NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_qa_question ON quiz_answer (quiz_question_id);

CREATE TABLE quiz_attempt (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    vocabulary_test_id UUID         NOT NULL REFERENCES vocabulary_test (id) ON DELETE CASCADE,
    total_questions    SMALLINT     NOT NULL DEFAULT 0,
    correct_answers    SMALLINT     NOT NULL DEFAULT 0,
    wrong_answers      SMALLINT     NOT NULL DEFAULT 0,
    score_percent      DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    status             VARCHAR(20)  NOT NULL DEFAULT 'in_progress'
                                    CHECK (status IN ('in_progress', 'submitted')),
    started_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    submitted_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_attempt_score  CHECK (score_percent BETWEEN 0 AND 100),
    CONSTRAINT chk_attempt_counts CHECK (total_questions >= 0 AND correct_answers >= 0 AND wrong_answers >= 0)
);
CREATE INDEX idx_qattempt_user      ON quiz_attempt (user_id);
CREATE INDEX idx_qattempt_test      ON quiz_attempt (vocabulary_test_id);
CREATE INDEX idx_qattempt_submitted ON quiz_attempt (submitted_at);

CREATE TABLE quiz_attempt_answer (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_attempt_id  UUID        NOT NULL REFERENCES quiz_attempt (id) ON DELETE CASCADE,
    quiz_question_id UUID        NOT NULL REFERENCES quiz_question (id) ON DELETE CASCADE,
    quiz_answer_id   UUID        REFERENCES quiz_answer (id) ON DELETE SET NULL,
    text_answer      TEXT,
    is_correct       BOOLEAN     NOT NULL DEFAULT FALSE,
    answered_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (quiz_attempt_id, quiz_question_id)
);
CREATE INDEX idx_qaa_attempt  ON quiz_attempt_answer (quiz_attempt_id);
CREATE INDEX idx_qaa_question ON quiz_attempt_answer (quiz_question_id);

DO $$ DECLARE t TEXT; BEGIN
    FOREACH t IN ARRAY ARRAY['vocabulary_test','quiz_question','quiz_answer','quiz_attempt','quiz_attempt_answer'] LOOP
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 7 — SCHEMA: Payment transaction
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE payment_transaction (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    plan_id                 UUID         NOT NULL REFERENCES payment_plan (id) ON DELETE RESTRICT,
    user_subscription_id    UUID         REFERENCES user_subscription (id) ON DELETE SET NULL,
    provider                VARCHAR(80)  NOT NULL DEFAULT 'mock',
    provider_transaction_id VARCHAR(255),
    amount_vnd              INTEGER      NOT NULL CHECK (amount_vnd >= 0),
    currency                CHAR(3)      NOT NULL DEFAULT 'VND',
    status                  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                         CHECK (status IN ('pending','success','failed','cancelled','refunded')),
    failure_reason          VARCHAR(500),
    paid_at                 TIMESTAMPTZ,
    raw_payload             JSONB,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_payment_provider_tx ON payment_transaction (provider, provider_transaction_id);
CREATE        INDEX idx_pt_user            ON payment_transaction (user_id);
CREATE        INDEX idx_pt_plan            ON payment_transaction (plan_id);
CREATE        INDEX idx_pt_status          ON payment_transaction (status, paid_at);
CREATE        INDEX idx_pt_subscription    ON payment_transaction (user_subscription_id);

CREATE TRIGGER trg_payment_transaction_updated_at
    BEFORE UPDATE ON payment_transaction
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 8 — SCHEMA: Voice preference (S8.4)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE elevenlabs_voice_model (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_id     TEXT        NOT NULL UNIQUE,
    model_id     TEXT        NOT NULL DEFAULT 'eleven_multilingual_v2',
    display_name TEXT        NOT NULL,
    accent       TEXT,
    gender       TEXT,
    is_pro       BOOLEAN     NOT NULL DEFAULT FALSE,
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    sort_order   INT         NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_elvm_active ON elevenlabs_voice_model (is_active, sort_order);

CREATE TABLE user_voice_preference (
    user_id        UUID        PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    voice_model_id UUID        NOT NULL REFERENCES elevenlabs_voice_model (id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ DECLARE t TEXT; BEGIN
    FOREACH t IN ARRAY ARRAY['elevenlabs_voice_model','user_voice_preference'] LOOP
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 9 — SCHEMA: Crawler (S9.3 + S9.4 columns inline)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE content_source (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(120) NOT NULL,
    base_url             TEXT         NOT NULL,
    is_enabled           BOOLEAN      NOT NULL DEFAULT TRUE,
    schedule_cron        VARCHAR(80)  NOT NULL DEFAULT '0 3 * * 0',
    rate_limit_ms        INTEGER      NOT NULL DEFAULT 1000,
    max_retries          SMALLINT     NOT NULL DEFAULT 3,
    retry_delay_seconds  INTEGER      NOT NULL DEFAULT 300,
    notify_email         VARCHAR(255),
    last_success_at      TIMESTAMPTZ,
    robots_checked_at    TIMESTAMPTZ,
    compliance_note      TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_content_source_name ON content_source (name);

CREATE TABLE content_crawl_job (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID        NOT NULL REFERENCES content_source (id) ON DELETE CASCADE,
    trigger_type    VARCHAR(20) NOT NULL DEFAULT 'manual'
                                CHECK (trigger_type IN ('scheduled','manual','retry')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','running','success','failed')),
    retry_count     SMALLINT    NOT NULL DEFAULT 0,
    retry_status    VARCHAR(20) NOT NULL DEFAULT 'none'
                                CHECK (retry_status IN ('none','pending','scheduled','exhausted')),
    next_retry_at   TIMESTAMPTZ,
    failure_context JSONB,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    stats_json      JSONB       NOT NULL DEFAULT '{}'::JSONB,
    preview_json    JSONB,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_crawl_job_source  ON content_crawl_job (source_id, started_at DESC);
CREATE INDEX idx_crawl_job_status  ON content_crawl_job (status);
CREATE INDEX idx_crawl_job_retry   ON content_crawl_job (retry_status, next_retry_at)
    WHERE retry_status = 'scheduled';

CREATE TABLE content_crawl_log (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id       UUID        NOT NULL REFERENCES content_crawl_job (id) ON DELETE CASCADE,
    level_code   VARCHAR(10),
    topic_slug   VARCHAR(180),
    severity     VARCHAR(10) NOT NULL DEFAULT 'info'
                             CHECK (severity IN ('info','warn','error')),
    message      TEXT        NOT NULL,
    payload_json JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_crawl_log_job ON content_crawl_log (job_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 10 — SCHEMA: Miscellaneous (translation history, report export)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE translation_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    source_text TEXT        NOT NULL,
    target_text TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_translation_user ON translation_history (user_id, created_at DESC);

CREATE TABLE report_export_history (
    id            BIGSERIAL   PRIMARY KEY,
    admin_user_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    report_type   TEXT        NOT NULL CHECK (report_type IN ('revenue','users','learning','ai_usage')),
    export_format TEXT        NOT NULL CHECK (export_format IN ('xlsx','pdf')),
    filter_params JSONB,
    file_name     VARCHAR(255),
    status        TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','completed','failed')),
    error_message VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMPTZ
);
CREATE INDEX idx_report_admin   ON report_export_history (admin_user_id, created_at DESC);
CREATE INDEX idx_report_type    ON report_export_history (report_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 11 — SEED: Dữ liệu hệ thống bắt buộc
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 11.1 Levels A1–C2 ────────────────────────────────────────────────────
INSERT INTO level (code, name, display_order) VALUES
    ('A1', 'Beginner (A1)',            1),
    ('A2', 'Elementary (A2)',          2),
    ('B1', 'Intermediate (B1)',        3),
    ('B2', 'Upper-Intermediate (B2)', 4),
    ('C1', 'Advanced (C1)',            5),
    ('C2', 'Proficiency (C2)',         6);

-- ─── 11.2 Payment plans ───────────────────────────────────────────────────
INSERT INTO payment_plan (name, price_vnd, duration_days, description, features, sort_order) VALUES
    ('Miễn phí',       0,       0,   'Trải nghiệm cơ bản',
     ARRAY['Hội thoại AI 15 phút/ngày','Học từ vựng A1–B1','Quiz cơ bản'], 0),
    ('Pro tháng',      99000,   30,  'Học không giới hạn mỗi tháng',
     ARRAY['Hội thoại AI không giới hạn','Toàn bộ từ vựng A1–C2','Luyện phát âm nâng cao','Chọn giọng AI','Phân tích chi tiết'], 1),
    ('Pro năm',        799000,  365, 'Tiết kiệm 33% so với gói tháng',
     ARRAY['Tất cả tính năng Pro tháng','Ưu tiên hỗ trợ','Nội dung độc quyền'], 2),
    ('Pro vĩnh viễn',  1990000, 0,   'Trả một lần, dùng mãi mãi',
     ARRAY['Tất cả tính năng Pro tháng','Không bao giờ hết hạn','Cập nhật tính năng miễn phí','Ưu tiên hỗ trợ cao nhất'], 3);

-- ─── 11.3 ElevenLabs voice models ────────────────────────────────────────
INSERT INTO elevenlabs_voice_model (id, voice_id, model_id, display_name, accent, gender, is_pro, is_active, sort_order) VALUES
    ('10000000-0000-0000-0000-000000000001'::uuid,
     'pNInz6obpgDQGcFmaJgB', 'eleven_multilingual_v2', 'Sarah',  'Tiếng Anh Mỹ', 'female', FALSE, TRUE, 0),
    ('10000000-0000-0000-0000-000000000002'::uuid,
     'EXAVITQu4vr4xnSDxMaL', 'eleven_multilingual_v2', 'James',  'Tiếng Anh Anh', 'male',  TRUE,  TRUE, 1),
    ('10000000-0000-0000-0000-000000000003'::uuid,
     'jsCqWAovK2LkecY7zXl4', 'eleven_multilingual_v2', 'Chloe',  'Tiếng Anh Úc', 'female', TRUE,  TRUE, 2);

-- ─── 11.4 Langeek crawler source ─────────────────────────────────────────
INSERT INTO content_source (name, base_url, is_enabled, schedule_cron, rate_limit_ms, compliance_note) VALUES
    ('Langeek Level-Based Vocabulary',
     'https://langeek.co/en-VI/vocab/level-based',
     TRUE, '0 3 * * 0', 1000,
     'Weekly sync — comply with Langeek ToS/robots.txt before production');

-- ═══════════════════════════════════════════════════════════════════════════
-- PHẦN 12 — SEED: Admin account
-- Password hash: SHA-256 hex của 'admin123'
--   Python: hashlib.sha256('admin123'.encode()).hexdigest()
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO users (id, email, password_hash, role, status) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@speakbuddi.com',
    encode(digest('admin123', 'sha256'), 'hex'),
    'admin',
    'active'
);

INSERT INTO user_profile (user_id, name, target_level, learning_goal, interests, timezone) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Admin SpeakBuddi',
    'C2',
    'Quản trị hệ thống',
    ARRAY['admin','management'],
    'Asia/Ho_Chi_Minh'
);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────
-- Kết quả sau khi chạy:
--   ✓ 32 bảng được tạo sạch
--   ✓ Levels A1–C2 (6 dòng)
--   ✓ Payment plans (4 gói)
--   ✓ ElevenLabs voice models (3 giọng)
--   ✓ Langeek content source (1 nguồn)
--   ✓ Admin account: admin@speakbuddi.com / admin123
-- ─────────────────────────────────────────────────────────────────────────
