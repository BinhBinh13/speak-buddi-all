-- Migration 003: Thêm cột onboarding vào user_profile (S2.1)
-- Idempotent — chạy nhiều lần không lỗi (IF NOT EXISTS)
--
-- Cách chạy:
--   psql -U <user> -d speakbuddi -f db/migrations/003_onboarding_fields.sql
--
-- Hoặc dùng script Python run_migration.py:
--   python db/migrations/run_migration.py 003_onboarding_fields.sql

ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS daily_minutes    INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS words_per_session INTEGER NOT NULL DEFAULT 10;

-- Thêm index để query nhanh theo onboarding status (target_level IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_user_profile_onboarding
    ON user_profile (user_id)
    WHERE target_level IS NOT NULL;
