-- ─── S3.4 Verify: giả lập crawler Langeek — AC-05-04 ─────────────────────────
-- Chạy trên DB dev sau khi đã có schema + seed data:
--   psql -U postgres -d speakbuddi -f db/schema_core.sql
--   psql -U postgres -d speakbuddi -f db/schema_learning.sql
--   psql -U postgres -d speakbuddi -f db/schema_progress.sql
--   psql -U postgres -d speakbuddi -f db/seed_dev.sql
--
-- Kịch bản verify (4 bước A → D, chạy theo thứ tự):
--   A: Crawler thêm từ mới (source='langeek') vào topic đang học
--   B: Các từ cũ giữ nguyên progress sau khi thêm từ mới
--   C: Soft-disable 1 từ đã known → biến mất UI, progress còn trong DB
--   D: percent_known re-base đúng theo tập từ active sau thay đổi nội dung
--
-- Script IDEMPOTENT: có thể chạy nhiều lần không lỗi (DO block kiểm tra tồn tại).
-- Reviewer: sau mỗi khối, quan sát kết quả SELECT để xác nhận AC.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Tiện ích: UUID demo user & topic target ──────────────────────────────────
-- Demo user đã seed: '00000000-0000-0000-0000-000000000002' (demo@speakbuddi.com)
-- Topic target: 'greetings-introductions' (A1) — đã có 5 từ admin-seed

-- ═════════════════════════════════════════════════════════════════════════════
-- BƯỚC CHUẨN BỊ: Seed progress cho 2 từ cũ (hello, goodbye) của demo user.
-- Giả lập học viên đã đánh dấu hello=known, goodbye=learning trước khi crawler chạy.
-- ═════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    v_user_id   UUID := '00000000-0000-0000-0000-000000000002';
    v_topic_id  UUID;
    v_level_id  UUID;
    v_word_id   UUID;
BEGIN
    SELECT id INTO v_topic_id FROM topic WHERE slug = 'greetings-introductions';
    SELECT id INTO v_level_id FROM level WHERE code = 'A1';

    -- hello → known
    SELECT id INTO v_word_id FROM topic_word
    WHERE topic_id = v_topic_id AND word = 'hello';

    INSERT INTO user_word_progress
        (user_id, topic_word_id, topic_id, level_id, status)
    VALUES
        (v_user_id, v_word_id, v_topic_id, v_level_id, 'known')
    ON CONFLICT (user_id, topic_word_id) DO UPDATE SET status = 'known';

    -- goodbye → learning
    SELECT id INTO v_word_id FROM topic_word
    WHERE topic_id = v_topic_id AND word = 'goodbye';

    INSERT INTO user_word_progress
        (user_id, topic_word_id, topic_id, level_id, status)
    VALUES
        (v_user_id, v_word_id, v_topic_id, v_level_id, 'learning')
    ON CONFLICT (user_id, topic_word_id) DO UPDATE SET status = 'learning';

    RAISE NOTICE '[PREP] Seeded progress: hello=known, goodbye=learning for user %', v_user_id;
END;
$$;

-- ─── Trạng thái ban đầu ────────────────────────────────────────────────────────
-- Reviewer: xác nhận topic có 5 từ active, 1 known, 1 learning
SELECT
    tw.word,
    tw.source,
    tw.is_active,
    uwp.status AS progress_status
FROM topic_word tw
LEFT JOIN user_word_progress uwp
       ON uwp.topic_word_id = tw.id
      AND uwp.user_id = '00000000-0000-0000-0000-000000000002'
WHERE tw.topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
ORDER BY tw.display_order;


-- ═════════════════════════════════════════════════════════════════════════════
-- KỊCH BẢN A: Crawler thêm từ mới (AC-05-04 a)
-- Mô phỏng: crawler Langeek insert 1 từ mới 'greet' vào topic 'greetings-introductions'
-- Kỳ vọng: GET /api/topics/{id}/words trả thêm từ 'greet' (is_active=true, source='langeek')
-- ═════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    v_topic_id  UUID;
    v_level_id  UUID;
    v_new_id    UUID;
BEGIN
    SELECT id INTO v_topic_id FROM topic WHERE slug = 'greetings-introductions';
    SELECT id INTO v_level_id FROM level WHERE code = 'A1';

    -- Idempotent: chỉ insert nếu từ 'greet' chưa tồn tại trong topic
    IF NOT EXISTS (
        SELECT 1 FROM topic_word
        WHERE topic_id = v_topic_id AND word = 'greet'
    ) THEN
        INSERT INTO topic_word
            (topic_id, level_id, word, phonetic, meaning_vi, meaning_en,
             example_sentence, source, display_order, is_active)
        VALUES
            (v_topic_id, v_level_id, 'greet', '/ɡriːt/', 'chào đón',
             'to say hello to someone', 'She greeted him with a smile.',
             'langeek', 6, TRUE)
        RETURNING id INTO v_new_id;

        RAISE NOTICE '[KỊCH BẢN A] Inserted new Langeek word "greet" id=%', v_new_id;
    ELSE
        RAISE NOTICE '[KỊCH BẢN A] Word "greet" đã tồn tại, bỏ qua insert.';
    END IF;
END;
$$;

-- Verify A: topic phải có 6 từ active (5 cũ + greet mới)
SELECT
    COUNT(*) AS total_active_words,
    SUM(CASE WHEN source = 'langeek' THEN 1 ELSE 0 END) AS langeek_count
FROM topic_word
WHERE topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
  AND is_active = TRUE;
-- Kỳ vọng: total_active_words=6, langeek_count=1


-- ═════════════════════════════════════════════════════════════════════════════
-- KỊCH BẢN B: Từ cũ giữ progress sau khi thêm từ mới (AC-05-04 b)
-- Kỳ vọng: hello vẫn known, goodbye vẫn learning — không bị xóa/reset
-- ═════════════════════════════════════════════════════════════════════════════
SELECT
    tw.word,
    tw.source,
    uwp.status AS progress_status,
    uwp.updated_at AS last_updated
FROM topic_word tw
JOIN user_word_progress uwp
  ON uwp.topic_word_id = tw.id
 AND uwp.user_id = '00000000-0000-0000-0000-000000000002'
WHERE tw.topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
ORDER BY tw.display_order;
-- Kỳ vọng: hello=known, goodbye=learning vẫn còn nguyên.
-- Từ 'greet' (Langeek mới) KHÔNG xuất hiện ở đây (chưa có progress row) → badge "Mới" trên FE.


-- ═════════════════════════════════════════════════════════════════════════════
-- KỊCH BẢN C: Soft-disable từ đã học → biến mất UI, progress còn trong DB (AC-05-04 c / BR11)
-- Mô phỏng: admin/crawler soft-disable từ 'hello' (đang known)
-- ═════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    v_topic_id UUID;
    v_word_id  UUID;
BEGIN
    SELECT id INTO v_topic_id FROM topic WHERE slug = 'greetings-introductions';
    SELECT id INTO v_word_id  FROM topic_word
    WHERE topic_id = v_topic_id AND word = 'hello';

    -- Soft-disable: KHÔNG xóa row (hard-delete sẽ kích CASCADE → mất progress)
    UPDATE topic_word
    SET is_active = FALSE
    WHERE id = v_word_id;

    RAISE NOTICE '[KỊCH BẢN C] Soft-disabled word "hello" (id=%)', v_word_id;
END;
$$;

-- Verify C.1: words API chỉ trả từ active → 'hello' không xuất hiện (5 từ còn lại)
SELECT word, is_active, source
FROM topic_word
WHERE topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
  AND is_active = TRUE
ORDER BY display_order;
-- Kỳ vọng: 5 từ (goodbye, name, meet, introduce, greet) — KHÔNG có hello

-- Verify C.2: progress của 'hello' VẪN CÒN trong DB (lịch sử bảo toàn, BR11)
SELECT
    tw.word,
    tw.is_active,
    uwp.status   AS progress_status,
    uwp.user_id
FROM topic_word tw
JOIN user_word_progress uwp ON uwp.topic_word_id = tw.id
WHERE tw.word = 'hello'
  AND tw.topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions');
-- Kỳ vọng: 1 row — is_active=false, progress_status='known' (lịch sử giữ nguyên)


-- ═════════════════════════════════════════════════════════════════════════════
-- KỊCH BẢN D: percent_known re-base đúng theo tập từ active sau thay đổi (AC-05-04 d)
-- Tập active hiện tại (sau B+C): goodbye, name, meet, introduce, greet = 5 từ
-- Progress active: goodbye=learning, hello=known (nhưng hello disabled → không tính)
-- Kỳ vọng: total_words=5, known_count=0, percent_known=0%
--   (hello known nhưng is_active=false → endpoint đã JOIN is_active=TRUE → không đếm)
-- ═════════════════════════════════════════════════════════════════════════════
SELECT
    COUNT(tw.id)                                                    AS total_active_words,
    COUNT(uwp.id) FILTER (WHERE uwp.status = 'known')              AS known_count,
    COUNT(uwp.id) FILTER (WHERE uwp.status = 'learning')           AS learning_count,
    ROUND(
        COUNT(uwp.id) FILTER (WHERE uwp.status = 'known')::NUMERIC
        / NULLIF(COUNT(tw.id), 0) * 100
    )                                                               AS percent_known
FROM topic_word tw
LEFT JOIN user_word_progress uwp
       ON uwp.topic_word_id = tw.id
      AND uwp.user_id = '00000000-0000-0000-0000-000000000002'
WHERE tw.topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
  AND tw.is_active = TRUE;
-- Kỳ vọng: total=5, known=0, learning=1 (goodbye), percent_known=0%
-- (hello là known nhưng is_active=FALSE → bị loại khỏi JOIN → không tính vào known)


-- ─── Dọn dẹp (tùy chọn — bỏ comment nếu muốn reset về trạng thái ban đầu) ───
-- Khôi phục hello active để seed không bị ảnh hưởng lần chạy tiếp:
/*
DO $$
DECLARE v_topic_id UUID;
BEGIN
    SELECT id INTO v_topic_id FROM topic WHERE slug = 'greetings-introductions';
    UPDATE topic_word SET is_active = TRUE  WHERE topic_id = v_topic_id AND word = 'hello';
    DELETE FROM topic_word                   WHERE topic_id = v_topic_id AND word = 'greet';
    DELETE FROM user_word_progress
    WHERE user_id = '00000000-0000-0000-0000-000000000002'
      AND topic_id = v_topic_id;
    RAISE NOTICE '[CLEANUP] Reset topic về trạng thái ban đầu.';
END;
$$;
*/
