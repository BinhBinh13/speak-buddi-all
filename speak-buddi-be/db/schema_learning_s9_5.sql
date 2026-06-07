\encoding UTF8
-- ─── SpeakBuddi — Schema Learning S9.5 (admin_locked) ─────────────────────────
-- Phạm vi: AC-13-06 — Admin edit/disable crawled content; crawler không ghi đè.
-- Chạy sau schema_learning.sql:
--   psql -U postgres -d speakbuddi -f db/schema_learning_s9_5.sql

ALTER TABLE topic
    ADD COLUMN IF NOT EXISTS admin_locked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE topic_word
    ADD COLUMN IF NOT EXISTS admin_locked BOOLEAN NOT NULL DEFAULT FALSE;
