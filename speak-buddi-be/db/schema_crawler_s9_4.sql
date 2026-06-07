\encoding UTF8
-- ─── SpeakBuddi — Schema Crawler S9.4 (retry / notify / failure context) ───────
-- Chạy sau schema_crawler.sql
-- Idempotent — an toàn chạy nhiều lần

ALTER TABLE content_source
    ADD COLUMN IF NOT EXISTS max_retries SMALLINT NOT NULL DEFAULT 3;

ALTER TABLE content_source
    ADD COLUMN IF NOT EXISTS retry_delay_seconds INTEGER NOT NULL DEFAULT 300;

ALTER TABLE content_source
    ADD COLUMN IF NOT EXISTS notify_email VARCHAR(255);

ALTER TABLE content_crawl_job
    ADD COLUMN IF NOT EXISTS retry_count SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE content_crawl_job
    ADD COLUMN IF NOT EXISTS retry_status VARCHAR(20) NOT NULL DEFAULT 'none';

ALTER TABLE content_crawl_job
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE content_crawl_job
    ADD COLUMN IF NOT EXISTS failure_context JSONB;

-- Mở rộng trigger_type cho retry
ALTER TABLE content_crawl_job DROP CONSTRAINT IF EXISTS content_crawl_job_trigger_type_check;
ALTER TABLE content_crawl_job ADD CONSTRAINT content_crawl_job_trigger_type_check
    CHECK (trigger_type IN ('scheduled', 'manual', 'retry'));

ALTER TABLE content_crawl_job DROP CONSTRAINT IF EXISTS content_crawl_job_retry_status_check;
ALTER TABLE content_crawl_job ADD CONSTRAINT content_crawl_job_retry_status_check
    CHECK (retry_status IN ('none', 'pending', 'scheduled', 'exhausted'));

CREATE INDEX IF NOT EXISTS idx_crawl_job_retry_scheduled
    ON content_crawl_job (retry_status, next_retry_at)
    WHERE retry_status = 'scheduled';

UPDATE content_source
SET    max_retries = 3,
       retry_delay_seconds = 300
WHERE  max_retries IS NULL OR retry_delay_seconds IS NULL;
