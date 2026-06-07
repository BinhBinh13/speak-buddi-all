\encoding UTF8
-- ─── SpeakBuddi — Schema Payment/Subscription bổ sung (PostgreSQL) ───────────
-- Phạm vi S8.1: bảng payment_transaction (giao dịch thanh toán — UC10/AC-10-01)
--
-- Lưu ý: payment_plan / user_subscription đã có trong schema_core.sql (S1.1).
--        File này CHỈ thêm payment_transaction, không sửa 2 bảng đó.
--
-- Yêu cầu thứ tự chạy:
--   1. psql -U <user> -d <db> -f db/schema_core.sql      ← payment_plan, user_subscription, set_updated_at()
--   2. psql -U <user> -d <db> -f db/schema_learning.sql
--   3. psql -U <user> -d <db> -f db/schema_progress.sql
--   4. psql -U <user> -d <db> -f db/schema_quiz.sql
--   5. psql -U <user> -d <db> -f db/schema_payment.sql   ← file này
--
-- Idempotent — chạy lại nhiều lần không lỗi (CREATE TABLE/INDEX IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

-- Extension pgcrypto (gen_random_uuid) — đảm bảo có đủ khi chạy standalone
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── 1. payment_transaction ──────────────────────────────────────────────────
-- Giao dịch thanh toán của Student khi mua/gia hạn payment_plan (UC10, §5.3).
-- provider: 'mock' (mặc định, S8.1) / 'vnpay' / 'momo' / 'payos' / 'stripe'… (TBD §6)
-- status: pending (S8.1 tạo) → success | failed | cancelled | refunded (S8.2/S8.3)
-- raw_payload: payload thô từ provider — CHỈ lưu DB, KHÔNG đưa vào log (§4.5)
CREATE TABLE IF NOT EXISTS payment_transaction (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    plan_id                  UUID         NOT NULL REFERENCES payment_plan (id) ON DELETE RESTRICT,
    user_subscription_id     UUID         REFERENCES user_subscription (id) ON DELETE SET NULL,  -- gắn khi S8.2 kích hoạt subscription
    provider                 VARCHAR(80)  NOT NULL DEFAULT 'mock',
    provider_transaction_id  VARCHAR(255),                                    -- mã từ provider; NULL lúc vừa tạo
    amount_vnd               INTEGER      NOT NULL CHECK (amount_vnd >= 0),   -- snapshot price_vnd tại thời điểm mua
    currency                 CHAR(3)      NOT NULL DEFAULT 'VND',
    status                   VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                          CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'refunded')),
    failure_reason           VARCHAR(500),                                    -- điền ở S8.3
    paid_at                  TIMESTAMPTZ,                                     -- set ở S8.2 khi thành công
    raw_payload              JSONB,                                           -- payload provider — KHÔNG log (§4.5)
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Chống xử lý webhook trùng (S8.2 cần) — NULL provider_transaction_id không vi phạm UNIQUE trong Postgres
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_provider_tx
    ON payment_transaction (provider, provider_transaction_id);

-- Lịch sử giao dịch của user
CREATE INDEX IF NOT EXISTS idx_pt_user
    ON payment_transaction (user_id);

-- Analytics doanh thu theo gói (S11.2)
CREATE INDEX IF NOT EXISTS idx_pt_plan
    ON payment_transaction (plan_id);

-- Lọc giao dịch thành công cho dashboard (S11.1)
CREATE INDEX IF NOT EXISTS idx_pt_status_paid
    ON payment_transaction (status, paid_at);

CREATE INDEX IF NOT EXISTS idx_pt_subscription
    ON payment_transaction (user_subscription_id);


-- ─── Trigger: tự cập nhật updated_at ─────────────────────────────────────────
-- Dùng lại function set_updated_at() đã tạo trong schema_core.sql.
-- Chỉ tạo trigger nếu bảng tồn tại (idempotent + an toàn khi chạy standalone).
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['payment_transaction']
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) AND EXISTS (
            SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
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
