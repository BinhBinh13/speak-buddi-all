\encoding UTF8
-- ─── SpeakBuddi — Schema Crawler / Content sync (PostgreSQL) ─────────────────
-- Phạm vi S9.3: Langeek crawler job + log + source config
-- Chạy sau schema_core.sql (users) — không phụ thuộc schema_learning
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── content_source ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_source (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(120) NOT NULL,
    base_url          TEXT         NOT NULL,
    is_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    schedule_cron     VARCHAR(80)  NOT NULL DEFAULT '0 3 * * 0',
    rate_limit_ms     INTEGER      NOT NULL DEFAULT 1000,
    last_success_at   TIMESTAMPTZ,
    robots_checked_at TIMESTAMPTZ,
    compliance_note   TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_source_name
    ON content_source (name);

-- ─── content_crawl_job ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_crawl_job (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id    UUID         NOT NULL REFERENCES content_source (id) ON DELETE CASCADE,
    trigger_type VARCHAR(20)  NOT NULL DEFAULT 'manual'
                              CHECK (trigger_type IN ('scheduled', 'manual')),
    status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'running', 'success', 'failed')),
    started_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    finished_at  TIMESTAMPTZ,
    stats_json   JSONB        NOT NULL DEFAULT '{}'::jsonb,
    preview_json JSONB,
    error_message TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawl_job_source_started
    ON content_crawl_job (source_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_crawl_job_status
    ON content_crawl_job (status);

-- ─── content_crawl_log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_crawl_log (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id       UUID         NOT NULL REFERENCES content_crawl_job (id) ON DELETE CASCADE,
    level_code   VARCHAR(10),
    topic_slug   VARCHAR(180),
    severity     VARCHAR(10)  NOT NULL DEFAULT 'info'
                              CHECK (severity IN ('info', 'warn', 'error')),
    message      TEXT         NOT NULL,
    payload_json JSONB,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawl_log_job
    ON content_crawl_log (job_id, created_at DESC);

-- ─── Seed default Langeek source ──────────────────────────────────────────────
INSERT INTO content_source (name, base_url, is_enabled, schedule_cron, rate_limit_ms, compliance_note)
VALUES (
    'Langeek Level-Based Vocabulary',
    'https://langeek.co/en-VI/vocab/level-based',
    TRUE,
    '0 3 * * 0',
    1000,
    'Weekly sync — comply with Langeek ToS/robots.txt before production'
)
ON CONFLICT (name) DO NOTHING;
