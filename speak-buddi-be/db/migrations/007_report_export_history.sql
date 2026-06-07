-- speak-buddi-be/db/migrations/007_report_export_history.sql
-- S11.3: Lịch sử xuất báo cáo admin (AC-12-03)
-- Chạy: psql -U <user> -d speakbuddi -f db/migrations/007_report_export_history.sql

CREATE TABLE IF NOT EXISTS report_export_history (
    id              BIGSERIAL PRIMARY KEY,
    admin_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type     TEXT NOT NULL CHECK (report_type IN ('revenue', 'users', 'learning', 'ai_usage')),
    export_format   TEXT NOT NULL CHECK (export_format IN ('xlsx', 'pdf')),
    filter_params   JSONB,
    file_name       VARCHAR(255),
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed', 'failed')),
    error_message   VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_export_admin_created
    ON report_export_history (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_export_type
    ON report_export_history (report_type);
