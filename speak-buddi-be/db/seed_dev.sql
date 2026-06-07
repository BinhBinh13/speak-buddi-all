-- ─── SpeakBuddi — Dev seed: users + user_profile ────────────────────────────
-- Dùng để test local; KHÔNG chạy trên production.
--
-- Yêu cầu thứ tự chạy:
--   psql -U postgres -d speakbuddi -f db/schema_core.sql
--   psql -U postgres -d speakbuddi -f db/schema_learning.sql
--   psql -U postgres -d speakbuddi -f db/seed_dev.sql   ← file này
--
-- Password hash: SHA-256 hex (khớp hashlib.sha256(pw.encode()).hexdigest() trong main.py)
--   password123  → encode(digest('password123','sha256'),'hex')
--   admin123     → encode(digest('admin123','sha256'),'hex')
--   student123   → encode(digest('student123','sha256'),'hex')
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. users ─────────────────────────────────────────────────────────────────

INSERT INTO users (id, email, password_hash, role, status)
SELECT id, email, password_hash, role, status FROM (VALUES

    -- Admin (role = 'admin')
    ('00000000-0000-0000-0000-000000000001'::uuid,
     'admin@speakbuddi.com',
     encode(digest('admin123', 'sha256'), 'hex'),
     'admin', 'active'),

    -- Demo student khớp MOCK_USERS hiện tại
    ('00000000-0000-0000-0000-000000000002'::uuid,
     'demo@speakbuddi.com',
     encode(digest('password123', 'sha256'), 'hex'),
     'student', 'active'),

    -- Thêm 1 student level A1 để test onboarding
    ('00000000-0000-0000-0000-000000000003'::uuid,
     'student@speakbuddi.com',
     encode(digest('student123', 'sha256'), 'hex'),
     'student', 'active')

) AS v (id, email, password_hash, role, status)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = v.email);

-- ── 2. user_profile ───────────────────────────────────────────────────────────

INSERT INTO user_profile (user_id, name, target_level, learning_goal, interests, timezone)
SELECT u.id, v.name, v.target_level, v.learning_goal, v.interests::text[], v.timezone
FROM (VALUES

    ('admin@speakbuddi.com',
     'Admin SpeakBuddi',
     'C2',
     'Quản trị hệ thống',
     '{admin,management}',
     'Asia/Ho_Chi_Minh'),

    ('demo@speakbuddi.com',
     'Demo User',
     'B1',
     'IELTS 7.0',
     '{travel,business,technology}',
     'Asia/Ho_Chi_Minh'),

    ('student@speakbuddi.com',
     'Học Sinh A1',
     'A1',
     'Giao tiếp cơ bản',
     '{everyday,greetings}',
     'Asia/Ho_Chi_Minh')

) AS v (email, name, target_level, learning_goal, interests, timezone)
JOIN users u ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM user_profile WHERE user_id = u.id);

-- ── 3. elevenlabs_voice_model (S8.4) ─────────────────────────────────────────
-- Voice mặc định khớp ELEVENLABS_VOICE_ID (pNInz6obpgDQGcFmaJgB).

INSERT INTO elevenlabs_voice_model (id, voice_id, model_id, display_name, accent, gender, is_pro, is_active, sort_order)
SELECT id, voice_id, model_id, display_name, accent, gender, is_pro, is_active, sort_order FROM (VALUES
    ('10000000-0000-0000-0000-000000000001'::uuid,
     'pNInz6obpgDQGcFmaJgB',
     'eleven_multilingual_v2',
     'Sarah',
     'Tiếng Anh Mỹ',
     'female',
     FALSE,
     TRUE,
     0),
    ('10000000-0000-0000-0000-000000000002'::uuid,
     'EXAVITQu4vr4xnSDxMaL',
     'eleven_multilingual_v2',
     'James',
     'Tiếng Anh Anh',
     'male',
     TRUE,
     TRUE,
     1),
    ('10000000-0000-0000-0000-000000000003'::uuid,
     'jsCqWAovK2LkecY7zXl4',
     'eleven_multilingual_v2',
     'Chloe',
     'Tiếng Anh Úc',
     'female',
     TRUE,
     TRUE,
     2)
) AS v (id, voice_id, model_id, display_name, accent, gender, is_pro, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM elevenlabs_voice_model LIMIT 1);
