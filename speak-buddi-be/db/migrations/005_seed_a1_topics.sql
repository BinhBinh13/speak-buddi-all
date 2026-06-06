-- Migration 005: seed thêm topics A1 với difficulty 1–7
-- Mỗi topic có 5 từ vựng mẫu
-- Idempotent — chạy nhiều lần không lỗi

-- ─── Topic 1: Greetings & Introductions (đã có, đảm bảo difficulty=1) ───────────
UPDATE topic SET difficulty = 1
WHERE slug = 'greetings-introductions';

-- ─── Topic 2: Numbers & Counting ─────────────────────────────────────────────
INSERT INTO topic (level_id, name, slug, description, display_order, difficulty, source)
SELECT
    (SELECT id FROM level WHERE code = 'A1'),
    'Numbers & Counting',
    'numbers-counting',
    'Học đếm số và dùng số trong cuộc sống hàng ngày',
    2, 2, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'numbers-counting');

INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic WHERE slug = 'numbers-counting'),
    (SELECT id FROM level WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('one',     '/wʌn/',      'một',     'the number 1',                         'I have one brother.',               1::SMALLINT),
    ('two',     '/tuː/',      'hai',     'the number 2',                         'She has two cats.',                 2::SMALLINT),
    ('ten',     '/ten/',      'mười',    'the number 10',                        'There are ten students.',           3::SMALLINT),
    ('hundred', '/ˈhʌndrəd/', 'trăm',   'the number 100',                       'It costs one hundred dollars.',     4::SMALLINT),
    ('count',   '/kaʊnt/',    'đếm',    'to say numbers in order',              'Can you count to twenty?',          5::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'numbers-counting')
      AND word = v.word
);

-- ─── Topic 3: Colors & Shapes ─────────────────────────────────────────────────
INSERT INTO topic (level_id, name, slug, description, display_order, difficulty, source)
SELECT
    (SELECT id FROM level WHERE code = 'A1'),
    'Colors & Shapes',
    'colors-shapes',
    'Màu sắc và hình dạng cơ bản',
    3, 3, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'colors-shapes');

INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic WHERE slug = 'colors-shapes'),
    (SELECT id FROM level WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('red',     '/red/',      'đỏ',        'the color of blood or fire',           'She wore a red dress.',             1::SMALLINT),
    ('blue',    '/bluː/',     'xanh dương','the color of the sky',                 'The sky is blue today.',            2::SMALLINT),
    ('circle',  '/ˈsɜːrkl/',  'hình tròn', 'a round shape',                       'Draw a circle on the paper.',       3::SMALLINT),
    ('square',  '/skwer/',    'hình vuông','a shape with four equal sides',        'The room is square.',               4::SMALLINT),
    ('color',   '/ˈkʌlər/',   'màu sắc',  'the appearance of something in light', 'What is your favorite color?',      5::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'colors-shapes')
      AND word = v.word
);

-- ─── Topic 4: Family & Friends ────────────────────────────────────────────────
INSERT INTO topic (level_id, name, slug, description, display_order, difficulty, source)
SELECT
    (SELECT id FROM level WHERE code = 'A1'),
    'Family & Friends',
    'family-friends',
    'Từ vựng về gia đình và bạn bè',
    4, 4, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'family-friends');

INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic WHERE slug = 'family-friends'),
    (SELECT id FROM level WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('mother',  '/ˈmʌðər/',  'mẹ',      'a female parent',                      'My mother is a teacher.',           1::SMALLINT),
    ('father',  '/ˈfɑːðər/', 'bố',      'a male parent',                        'My father works in a hospital.',    2::SMALLINT),
    ('sister',  '/ˈsɪstər/', 'chị/em gái','a girl who has the same parents',    'I have one older sister.',          3::SMALLINT),
    ('brother', '/ˈbrʌðər/', 'anh/em trai','a boy who has the same parents',    'My brother plays football.',        4::SMALLINT),
    ('friend',  '/frend/',   'bạn bè',  'a person you like and know well',      'She is my best friend.',            5::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'family-friends')
      AND word = v.word
);

-- ─── Topic 5: Food & Drinks ───────────────────────────────────────────────────
INSERT INTO topic (level_id, name, slug, description, display_order, difficulty, source)
SELECT
    (SELECT id FROM level WHERE code = 'A1'),
    'Food & Drinks',
    'food-drinks',
    'Từ vựng về thức ăn và đồ uống phổ biến',
    5, 5, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'food-drinks');

INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic WHERE slug = 'food-drinks'),
    (SELECT id FROM level WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('water',   '/ˈwɔːtər/', 'nước',    'a clear liquid we drink',              'I drink water every day.',          1::SMALLINT),
    ('rice',    '/raɪs/',    'cơm/gạo', 'a white grain eaten as food',          'We eat rice with every meal.',      2::SMALLINT),
    ('bread',   '/bred/',    'bánh mì', 'a food made from flour and baked',     'I eat bread for breakfast.',        3::SMALLINT),
    ('egg',     '/eg/',      'trứng',   'an oval object laid by a bird',        'She fried two eggs.',               4::SMALLINT),
    ('hungry',  '/ˈhʌŋɡri/', 'đói bụng','feeling the need to eat',             'I am hungry. Let''s eat!',          5::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'food-drinks')
      AND word = v.word
);

-- ─── Topic 6: Animals ─────────────────────────────────────────────────────────
INSERT INTO topic (level_id, name, slug, description, display_order, difficulty, source)
SELECT
    (SELECT id FROM level WHERE code = 'A1'),
    'Animals',
    'animals',
    'Tên các loài động vật thông dụng',
    6, 6, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'animals');

INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic WHERE slug = 'animals'),
    (SELECT id FROM level WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('dog',     '/dɒɡ/',     'chó',     'a common pet animal',                  'My dog likes to run.',              1::SMALLINT),
    ('cat',     '/kæt/',     'mèo',     'a small furry animal kept as a pet',   'The cat is sleeping.',              2::SMALLINT),
    ('bird',    '/bɜːrd/',   'chim',    'an animal with wings and feathers',    'A bird is singing outside.',        3::SMALLINT),
    ('fish',    '/fɪʃ/',     'cá',      'an animal that lives in water',        'We have five fish in the tank.',    4::SMALLINT),
    ('animal',  '/ˈænɪml/',  'động vật','a living thing that is not a plant',  'What is your favorite animal?',     5::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'animals')
      AND word = v.word
);

-- ─── Topic 7: Body Parts ──────────────────────────────────────────────────────
INSERT INTO topic (level_id, name, slug, description, display_order, difficulty, source)
SELECT
    (SELECT id FROM level WHERE code = 'A1'),
    'Body Parts',
    'body-parts',
    'Các bộ phận cơ thể người',
    7, 7, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE slug = 'body-parts');

INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic WHERE slug = 'body-parts'),
    (SELECT id FROM level WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('head',    '/hed/',     'đầu',     'the top part of the body',             'She shook her head.',               1::SMALLINT),
    ('hand',    '/hænd/',    'bàn tay', 'the part at the end of your arm',      'Wash your hands before eating.',    2::SMALLINT),
    ('eye',     '/aɪ/',      'mắt',     'the part of the body used for seeing', 'She has brown eyes.',               3::SMALLINT),
    ('mouth',   '/maʊθ/',    'miệng',   'the opening in the face for eating',   'Open your mouth, please.',          4::SMALLINT),
    ('leg',     '/leɡ/',     'chân',    'the part of the body used for walking','My leg hurts after running.',       5::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'body-parts')
      AND word = v.word
);
