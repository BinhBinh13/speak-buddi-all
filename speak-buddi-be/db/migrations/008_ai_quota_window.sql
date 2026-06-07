-- ─── Migration 008: ai_quota_window (S7.2) ───────────────────────────────────
-- Bảng lưu cửa sổ quota 5 giờ cho hội thoại AI của free user (AC-09-01/02, BR02/03).
-- Chạy idempotent (IF NOT EXISTS) — an toàn khi chạy lại.
-- Yêu cầu: schema_core.sql + migration 007_pronunciation.sql đã chạy trước.
--
-- Thiết kế:
--   - Fixed 5h window: window_start_at cố định, window_end_at = window_start_at + 5h.
--   - max_seconds = 900 (15 phút) — BR02.
--   - Lazy reset (BR03): cửa sổ hết hạn bị bỏ qua lúc check, tạo cửa sổ mới.
--   - UNIQUE (user_id, window_start_at): 1 cửa sổ / user / mốc thời gian.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS ai_quota_window (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    window_start_at TIMESTAMPTZ NOT NULL,
    window_end_at   TIMESTAMPTZ NOT NULL,   -- = window_start_at + interval '5 hours'
    used_seconds    INTEGER     NOT NULL DEFAULT 0 CHECK (used_seconds >= 0),
    max_seconds     INTEGER     NOT NULL DEFAULT 900,   -- BR02: 15 phút
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, window_start_at)
);

-- Index để tìm nhanh cửa sổ active của user (window_end_at > NOW())
CREATE INDEX IF NOT EXISTS idx_aiqw_user_end
    ON ai_quota_window (user_id, window_end_at);

-- Trigger tự cập nhật updated_at (dùng lại hàm set_updated_at() từ schema_core.sql)
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
