-- Migration 015: last_active_at cho email nhắc quay lại sau N ngày không dùng app
-- Idempotent — chạy nhiều lần không lỗi (IF NOT EXISTS)
--
-- Cách chạy:
--   psql -U <user> -d speakbuddi -f db/migrations/015_user_last_active.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_last_active
    ON users (last_active_at)
    WHERE status = 'active';
