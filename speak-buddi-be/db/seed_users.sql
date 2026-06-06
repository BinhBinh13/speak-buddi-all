-- ─── SpeakBuddi — Seed: Identity / Auth tables ──────────────────────────────
-- File   : db/seed_users.sql
-- Phụ thuộc: schema_core.sql phải chạy trước (tạo tables + seed payment_plan)
-- Idempotent: ON CONFLICT (id) DO NOTHING — chạy lại nhiều lần không sinh lỗi
--
-- Mật khẩu mặc định (SHA-256 hex, khớp BE hashlib.sha256):
--   • admin@speakbuddi.com   →  "Admin@123"
--   • demo@speakbuddi.com    →  "password123"   (tương thích MOCK_USERS trong main.py)
--   • Tất cả student khác   →  "Student@123"
--   • oauth.user@gmail.com  →  (đăng nhập Google — password_hash NULL)
--
-- Cách chạy lần đầu:
--   psql -U postgres -d speakbuddi -f db/schema_core.sql
--   psql -U postgres -d speakbuddi -f db/seed_users.sql
--
-- Reset và chạy lại từ đầu:
--   psql -U postgres -d speakbuddi \
--     -c "TRUNCATE users CASCADE; \
--         DELETE FROM payment_plan;" \
--     -f db/schema_core.sql \
--     -f db/seed_users.sql
--
-- UUID cố định: 00000000-0000-0000-0000-00000000000x (dễ reference khi test)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. USERS
--    role  : student | admin
--    status: active | suspended | deleted
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at)
VALUES

-- ── Admin ─────────────────────────────────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000001',
  'admin@speakbuddi.com',
  encode(digest('Admin@123', 'sha256'), 'hex'),
  'admin', 'active',
  NOW() - INTERVAL '120 days',
  NOW() - INTERVAL '1 day'
),

-- ── Demo user (tương thích MOCK_USERS: id = "u_001", password = "password123") ─
(
  '00000000-0000-0000-0000-000000000002',
  'demo@speakbuddi.com',
  encode(digest('password123', 'sha256'), 'hex'),
  'student', 'active',
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '3 days'
),

-- ── Student A1 — mới bắt đầu, gói Free ───────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000003',
  'bdang798@gmail.com',
  encode(digest('Student@123', 'sha256'), 'hex'),
  'student', 'active',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),

-- ── Student A2 — gói Pro Tháng ────────────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000004',
  'ngaidang53@gmail.com',
  encode(digest('Student@123', 'sha256'), 'hex'),
  'student', 'active',
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '2 days'
),

-- ── Student B1 — gói Pro Tháng ────────────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000005',
  'lan.pham@gmail.com',
  encode(digest('Student@123', 'sha256'), 'hex'),
  'student', 'active',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '5 days'
),

-- ── Student B2 — gói Pro Năm ──────────────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000006',
  'cuong.le@gmail.com',
  encode(digest('Student@123', 'sha256'), 'hex'),
  'student', 'active',
  NOW() - INTERVAL '180 days',
  NOW() - INTERVAL '7 days'
),

-- ── Student C1 — gói Pro Năm ──────────────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000007',
  'thuy.hoang@gmail.com',
  encode(digest('Student@123', 'sha256'), 'hex'),
  'student', 'active',
  NOW() - INTERVAL '365 days',
  NOW() - INTERVAL '14 days'
),

-- ── Student A2 — gói Pro Vĩnh Viễn ───────────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000008',
  'duc.vo@gmail.com',
  encode(digest('Student@123', 'sha256'), 'hex'),
  'student', 'active',
  NOW() - INTERVAL '200 days',
  NOW() - INTERVAL '1 day'
),

-- ── Student B1 — đăng nhập qua Google OAuth (password_hash = NULL) ────────────
(
  '00000000-0000-0000-0000-000000000009',
  'oauth.user@gmail.com',
  NULL,
  'student', 'active',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '2 days'
),

-- ── Student A1 — tài khoản bị khóa (suspended) ───────────────────────────────
(
  '00000000-0000-0000-0000-000000000010',
  'suspended.user@gmail.com',
  encode(digest('Student@123', 'sha256'), 'hex'),
  'student', 'suspended',
  NOW() - INTERVAL '70 days',
  NOW() - INTERVAL '20 days'
)

ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. USER_PROFILE
--    target_level : A1 | A2 | B1 | B2 | C1 | C2 | NULL (admin / chưa onboard)
--    interests    : TEXT[]
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO user_profile (user_id, name, target_level, learning_goal, interests, timezone, avatar_url, created_at, updated_at)
VALUES

-- Admin (không có target_level / goal)
(
  '00000000-0000-0000-0000-000000000001',
  'Nguyễn Quản Trị',
  NULL, NULL,
  ARRAY[]::TEXT[],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  NOW() - INTERVAL '120 days',
  NOW() - INTERVAL '1 day'
),

-- Demo User — B1, mục tiêu IELTS 7.0
(
  '00000000-0000-0000-0000-000000000002',
  'Demo User',
  'B1',
  'IELTS 7.0',
  ARRAY['technology', 'travel', 'business'],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '3 days'
),

-- Nguyễn Thị Hà — A1, du lịch nước ngoài
(
  '00000000-0000-0000-0000-000000000003',
  'Nguyễn Thị Hà',
  'A2',
  'Giao tiếp cơ bản khi đi du lịch nước ngoài',
  ARRAY['travel', 'food', 'culture'],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ha',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),

-- Trần Minh — A2, giao tiếp công việc
(
  '00000000-0000-0000-0000-000000000004',
  'Trần Minh',
  'B1',
  'Giao tiếp tự tin với đồng nghiệp nước ngoài',
  ARRAY['business', 'technology', 'sports'],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=minh',
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '2 days'
),

-- Phạm Thị Lan — B1, TOEIC 700+
(
  '00000000-0000-0000-0000-000000000005',
  'Phạm Thị Lan',
  'B2',
  'TOEIC 700+',
  ARRAY['business', 'finance', 'travel'],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=lan',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '5 days'
),

-- Lê Văn Cường — B2, IELTS 7.5
(
  '00000000-0000-0000-0000-000000000006',
  'Lê Văn Cường',
  'C1',
  'IELTS 7.5 để du học Úc',
  ARRAY['academic', 'science', 'technology', 'music'],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cuong',
  NOW() - INTERVAL '180 days',
  NOW() - INTERVAL '7 days'
),

-- Hoàng Minh Thùy — C1, môi trường quốc tế
(
  '00000000-0000-0000-0000-000000000007',
  'Hoàng Minh Thùy',
  'C2',
  'Làm việc tự tin trong môi trường quốc tế',
  ARRAY['business', 'leadership', 'culture', 'travel', 'art'],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=thuy',
  NOW() - INTERVAL '365 days',
  NOW() - INTERVAL '14 days'
),

-- Võ Quốc Đức — A2, xem phim không phụ đề
(
  '00000000-0000-0000-0000-000000000008',
  'Võ Quốc Đức',
  'B1',
  'Xem phim Mỹ không cần phụ đề',
  ARRAY['entertainment', 'movies', 'music', 'gaming'],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=duc',
  NOW() - INTERVAL '200 days',
  NOW() - INTERVAL '1 day'
),

-- OAuth User — B1, cải thiện phát âm
(
  '00000000-0000-0000-0000-000000000009',
  'Google User',
  'B1',
  'Cải thiện phát âm và ngữ điệu tự nhiên',
  ARRAY['travel', 'technology', 'food'],
  'Asia/Ho_Chi_Minh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=oauth',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '2 days'
),

-- Suspended User — A1
(
  '00000000-0000-0000-0000-000000000010',
  'Nguyễn Bị Khóa',
  'A1',
  NULL,
  ARRAY[]::TEXT[],
  'Asia/Ho_Chi_Minh',
  NULL,
  NOW() - INTERVAL '70 days',
  NOW() - INTERVAL '20 days'
)

ON CONFLICT (user_id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. OAUTH_ACCOUNT
--    Chỉ cho user đăng nhập qua Google (oauth.user@gmail.com)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO oauth_account (id, user_id, provider, provider_user_id, token_expires_at, created_at, updated_at)
VALUES
(
  '00000000-0000-0000-0000-000000000a09',
  '00000000-0000-0000-0000-000000000009',
  'google',
  'google_uid_oauth_user_001',
  NOW() + INTERVAL '1 hour',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (provider, provider_user_id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. USER_SUBSCRIPTION
--    Tham chiếu payment_plan bằng name (ID sinh tự động trong schema_core.sql)
--    status: pending | active | expired | cancelled
--
--    Phân bổ gói:
--      demo          → Pro tháng  (active)
--      minh.tran     → Pro tháng  (active)
--      lan.pham      → Pro tháng  (active)
--      cuong.le      → Pro năm    (active)
--      thuy.hoang    → Pro năm    (active)
--      duc.vo        → Pro vĩnh viễn (active, expires_at NULL vì duration_days = 0)
--      oauth.user    → Pro tháng  (active)
--      suspended     → Pro tháng  (expired)
--      ha.nguyen     → (không có, dùng Free)
--      admin         → (không có)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO user_subscription (id, user_id, plan_id, status, starts_at, expires_at, payment_ref, created_at, updated_at)
VALUES

-- demo → Pro tháng (active, 18 ngày còn lại)
(
  '00000000-0000-0000-0000-000000000b02',
  '00000000-0000-0000-0000-000000000002',
  (SELECT id FROM payment_plan WHERE name = 'Pro tháng' LIMIT 1),
  'active',
  NOW() - INTERVAL '12 days',
  NOW() + INTERVAL '18 days',
  'PAY-DEMO-001',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
),

-- minh.tran → Pro tháng (active, còn 22 ngày)
(
  '00000000-0000-0000-0000-000000000b04',
  '00000000-0000-0000-0000-000000000004',
  (SELECT id FROM payment_plan WHERE name = 'Pro tháng' LIMIT 1),
  'active',
  NOW() - INTERVAL '8 days',
  NOW() + INTERVAL '22 days',
  'PAY-MINH-001',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
),

-- lan.pham → Pro tháng (active, còn 5 ngày — gần hết hạn)
(
  '00000000-0000-0000-0000-000000000b05',
  '00000000-0000-0000-0000-000000000005',
  (SELECT id FROM payment_plan WHERE name = 'Pro tháng' LIMIT 1),
  'active',
  NOW() - INTERVAL '25 days',
  NOW() + INTERVAL '5 days',
  'PAY-LAN-001',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days'
),

-- cuong.le → Pro năm (active, còn 185 ngày)
(
  '00000000-0000-0000-0000-000000000b06',
  '00000000-0000-0000-0000-000000000006',
  (SELECT id FROM payment_plan WHERE name = 'Pro năm' LIMIT 1),
  'active',
  NOW() - INTERVAL '180 days',
  NOW() + INTERVAL '185 days',
  'PAY-CUONG-001',
  NOW() - INTERVAL '180 days',
  NOW() - INTERVAL '180 days'
),

-- thuy.hoang → Pro năm (active, mới mua 14 ngày)
(
  '00000000-0000-0000-0000-000000000b07',
  '00000000-0000-0000-0000-000000000007',
  (SELECT id FROM payment_plan WHERE name = 'Pro năm' LIMIT 1),
  'active',
  NOW() - INTERVAL '14 days',
  NOW() + INTERVAL '351 days',
  'PAY-THUY-001',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days'
),

-- duc.vo → Pro vĩnh viễn (active, expires_at = NULL — dùng duration_days = 0)
(
  '00000000-0000-0000-0000-000000000b08',
  '00000000-0000-0000-0000-000000000008',
  (SELECT id FROM payment_plan WHERE name = 'Pro vĩnh viễn' LIMIT 1),
  'active',
  NOW() - INTERVAL '200 days',
  NULL,
  'PAY-DUC-001',
  NOW() - INTERVAL '200 days',
  NOW() - INTERVAL '200 days'
),

-- oauth.user → Pro tháng (active)
(
  '00000000-0000-0000-0000-000000000b09',
  '00000000-0000-0000-0000-000000000009',
  (SELECT id FROM payment_plan WHERE name = 'Pro tháng' LIMIT 1),
  'active',
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '20 days',
  'PAY-OAUTH-001',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),

-- suspended.user → Pro tháng (expired — hết hạn 20 ngày trước)
(
  '00000000-0000-0000-0000-000000000b10',
  '00000000-0000-0000-0000-000000000010',
  (SELECT id FROM payment_plan WHERE name = 'Pro tháng' LIMIT 1),
  'expired',
  NOW() - INTERVAL '50 days',
  NOW() - INTERVAL '20 days',
  'PAY-SUS-001',
  NOW() - INTERVAL '50 days',
  NOW() - INTERVAL '20 days'
)

ON CONFLICT (id) DO NOTHING;


COMMIT;

-- ─── Kiểm tra nhanh sau khi seed ─────────────────────────────────────────────
-- Chạy query sau để xác nhận:
--
-- SELECT
--     u.email,
--     u.role,
--     u.status,
--     p.name                          AS profile_name,
--     p.target_level,
--     pp.name                         AS plan_name,
--     us.status                       AS sub_status,
--     us.expires_at::DATE             AS expires_date
-- FROM users u
-- LEFT JOIN user_profile      p  ON p.user_id  = u.id
-- LEFT JOIN user_subscription us ON us.user_id = u.id
-- LEFT JOIN payment_plan      pp ON pp.id       = us.plan_id
-- ORDER BY u.created_at;
