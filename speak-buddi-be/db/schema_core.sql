\encoding UTF8
-- ─── SpeakBuddi — Schema cot loi (PostgreSQL) ───────────────────────────────
-- Phạm vi S1.1: nhóm Identity/Auth + Payment/Subscription (SRS §5.3)
-- Phạm vi S3.1 (Activated): nhóm Learning content — level/topic/tag/topic_word/topic_word_tag
--
-- Cách chạy (idempotent — chạy 2 lần không lỗi):
--   psql -U <user> -d <db> -f db/schema_core.sql
--
-- Sau đó chạy schema learning content (S3.1):
--   psql -U <user> -d <db> -f db/schema_learning.sql
--
-- Lần đầu (tạo DB):
--   createdb -U postgres speakbuddi
--   psql -U postgres -d speakbuddi -f db/schema_core.sql
--   psql -U postgres -d speakbuddi -f db/schema_learning.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Bật extension cần thiết
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()


-- ─── DROP TABLES (Development Only) ─────────────────────────────────────────
DROP TABLE IF EXISTS user_subscription CASCADE;
DROP TABLE IF EXISTS payment_plan CASCADE;
DROP TABLE IF EXISTS password_reset_token CASCADE;
DROP TABLE IF EXISTS user_session CASCADE;
DROP TABLE IF EXISTS oauth_account CASCADE;
DROP TABLE IF EXISTS user_profile CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Xóa trigger function nếu muốn reset hoàn toàn
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- ─── 1. users ─────────────────────────────────────────────────────────────────
-- Role: student | admin (BR01 §4.5: "Paid User là subscription state, không phải role")
-- status: active | suspended | deleted (soft-delete cấp user)
CREATE TABLE IF NOT EXISTS users (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email            VARCHAR(320) NOT NULL,
    password_hash    VARCHAR(255),          -- NULL nếu chỉ đăng ký qua OAuth
    role             VARCHAR(20)  NOT NULL DEFAULT 'student'
                                   CHECK (role IN ('student', 'admin')),
    status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email
    ON users (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_users_role_status
    ON users (role, status);

-- ─── 2. user_profile ─────────────────────────────────────────────────────────
-- 1-1 với users; lưu thông tin onboarding (S2.1+)
CREATE TABLE IF NOT EXISTS user_profile (
    user_id          UUID         PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    name             VARCHAR(255),
    target_level     VARCHAR(10),           -- A1-C2; NULL trước khi onboarding
    learning_goal    VARCHAR(255),          -- ví dụ "IELTS 7.0"
    interests        TEXT[],                -- mảng chủ đề yêu thích (onboarding S2.1)
    roadmap_sequence JSONB,                -- ordered scenario array sinh bởi AI (S2.1 v2)
    timezone         VARCHAR(60)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    avatar_url       TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 3. oauth_account ────────────────────────────────────────────────────────
-- Liên kết tài khoản OAuth (Google, Apple, …) — chuẩn bị S1.6
CREATE TABLE IF NOT EXISTS oauth_account (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider         VARCHAR(50)  NOT NULL,        -- 'google', 'apple', …
    provider_user_id VARCHAR(255) NOT NULL,
    access_token     TEXT,                          -- lưu mã hóa; KHÔNG log
    refresh_token    TEXT,                          -- lưu mã hóa; KHÔNG log
    token_expires_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_account_user
    ON oauth_account (user_id);

-- ─── 4. user_session ─────────────────────────────────────────────────────────
-- Lưu refresh token hash (§4.5: không lưu raw token) — chuẩn bị S1.8
CREATE TABLE IF NOT EXISTS user_session (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    refresh_token_hash  VARCHAR(64)  NOT NULL,      -- SHA-256 hex của raw refresh token
    user_agent          TEXT,
    ip_address          INET,
    expires_at          TIMESTAMPTZ  NOT NULL,
    revoked             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_session_user_active
    ON user_session (user_id, revoked)
    WHERE revoked = FALSE;

-- ─── 5. password_reset_token ─────────────────────────────────────────────────
-- Lưu token hash (§4.5: không lưu raw token) — dùng khi S1.8 migrate sang DB
CREATE TABLE IF NOT EXISTS password_reset_token (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,  -- SHA-256 hex của raw token
    expires_at TIMESTAMPTZ  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_token (user_id);
CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_token (expires_at)
    WHERE NOT used;

-- ─── 6. payment_plan ─────────────────────────────────────────────────────────
-- Danh sách gói trả phí (Admin CRUD ở S10.1)
-- is_active: false = soft-delete (BR07)
CREATE TABLE IF NOT EXISTS payment_plan (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(255) NOT NULL,
    price_vnd        INTEGER      NOT NULL CHECK (price_vnd >= 0),
    duration_days    INTEGER      NOT NULL CHECK (duration_days >= 0),
    description      TEXT,
    features         TEXT[],                -- danh sách tính năng hiển thị
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order       SMALLINT     NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_plan_active
    ON payment_plan (is_active, sort_order);

-- ─── 7. user_subscription ───────────────────────────────────────────────────
-- Trạng thái subscription của user (BR04: "Paid User là subscription state, không phải role")
-- status: pending | active | expired | cancelled
CREATE TABLE IF NOT EXISTS user_subscription (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    plan_id          UUID         NOT NULL REFERENCES payment_plan (id),
    status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    starts_at        TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ,
    payment_ref      VARCHAR(255),          -- mã giao dịch từ payment gateway
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscription_user_status
    ON user_subscription (user_id, status);

-- ─── Trigger: tự cập nhật updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users', 'user_profile', 'oauth_account',
        'payment_plan', 'user_subscription',
        'level', 'topic', 'tag', 'topic_word'
    ]
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            EXECUTE format(
                'CREATE OR REPLACE TRIGGER trg_%I_updated_at
                 BEFORE UPDATE ON %I
                 FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
                t, t
            );
        END IF;
    END LOOP;
END;
$$;

-- ─── Seed: dữ liệu mẫu payment_plan ─────────────────────────────────────────
-- Chỉ insert nếu bảng còn trống (idempotent re-run)
INSERT INTO payment_plan (name, price_vnd, duration_days, description, features, sort_order)
SELECT * FROM (VALUES
    ('Miễn phí',    0,     0,
     'Trải nghiệm cơ bản',
     ARRAY['Hội thoại AI 15 phút/ngày', 'Học từ vựng A1–B1', 'Quiz cơ bản'],
     0),
    ('Pro tháng', 99000,  30,
     'Học không giới hạn mỗi tháng',
     ARRAY['Hội thoại AI không giới hạn', 'Toàn bộ từ vựng A1–C2',
           'Luyện phát âm nâng cao', 'Chọn giọng AI', 'Phân tích chi tiết'],
     1),
    ('Pro năm',  799000, 365,
     'Tiết kiệm 33% so với gói tháng',
     ARRAY['Tất cả tính năng Pro tháng', 'Ưu tiên hỗ trợ', 'Nội dung độc quyền'],
     2),
    ('Pro vĩnh viễn', 1990000, 0,
     'Trả một lần, dùng mãi mãi',
     ARRAY['Tất cả tính năng Pro tháng', 'Không bao giờ hết hạn',
           'Cập nhật tính năng miễn phí', 'Ưu tiên hỗ trợ cao nhất'],
     3)
) AS v (name, price_vnd, duration_days, description, features, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM payment_plan LIMIT 1);



