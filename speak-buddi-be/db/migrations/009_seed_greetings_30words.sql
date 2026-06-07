-- Migration 009: seed thêm 25 từ cho topic Greetings & Introductions (A1)
-- Sau migration này topic có đủ 30 từ (5 từ gốc + 25 từ mới)
-- Idempotent — chạy nhiều lần không lỗi

-- ─── Thêm tag mới nếu chưa có ────────────────────────────────────────────────
INSERT INTO tag (name, slug)
SELECT name, slug FROM (VALUES
    ('adjective',  'adjective'),
    ('expression', 'expression')
) AS v (name, slug)
WHERE NOT EXISTS (SELECT 1 FROM tag WHERE tag.slug = v.slug);

-- ─── 25 từ mới cho Greetings & Introductions ─────────────────────────────────
INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic WHERE slug = 'greetings-introductions'),
    (SELECT id FROM level WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('hi',          '/haɪ/',              'chào (thân mật)',      'an informal greeting',                               'Hi! How are you today?',                      6::SMALLINT),
    ('bye',         '/baɪ/',              'tạm biệt (thân mật)', 'an informal way of saying farewell',                 'Bye! See you tomorrow!',                      7::SMALLINT),
    ('thank you',   '/θæŋk juː/',         'cảm ơn',              'words used to show gratitude',                       'Thank you for helping me!',                   8::SMALLINT),
    ('please',      '/pliːz/',            'làm ơn',              'used to make a request more polite',                 'Please sit down.',                            9::SMALLINT),
    ('sorry',       '/ˈsɒri/',            'xin lỗi',             'an expression of apology',                           'Sorry, I am late!',                          10::SMALLINT),
    ('excuse me',   '/ɪkˈskjuːz miː/',   'xin lỗi / cho hỏi',  'used to politely get someone''s attention',          'Excuse me, can you help me?',                11::SMALLINT),
    ('fine',        '/faɪn/',             'ổn / khỏe',           'in good health or satisfactory condition',           'I am fine, thank you.',                      12::SMALLINT),
    ('good',        '/ɡʊd/',              'tốt / giỏi',          'of a high quality or satisfactory standard',         'Good morning, everyone!',                    13::SMALLINT),
    ('morning',     '/ˈmɔːrnɪŋ/',         'buổi sáng',           'the early part of the day before noon',              'Good morning! Did you sleep well?',           14::SMALLINT),
    ('afternoon',   '/ˌæftərˈnuːn/',      'buổi chiều',          'the time from noon until evening',                   'Good afternoon, sir.',                       15::SMALLINT),
    ('evening',     '/ˈiːvnɪŋ/',          'buổi tối',            'the part of the day between afternoon and night',   'Good evening! Welcome to our home.',          16::SMALLINT),
    ('night',       '/naɪt/',             'đêm',                 'the dark time between one day and the next',         'Good night! Sleep well.',                    17::SMALLINT),
    ('welcome',     '/ˈwelkəm/',          'chào mừng',           'to greet someone in a warm and friendly way',        'Welcome to our class!',                      18::SMALLINT),
    ('yes',         '/jes/',              'vâng / có',           'used to agree or give a positive answer',            'Yes, I understand you.',                     19::SMALLINT),
    ('no',          '/nəʊ/',              'không',               'used to disagree or give a negative answer',         'No, thank you. I am full.',                  20::SMALLINT),
    ('age',         '/eɪdʒ/',             'tuổi',                'the number of years someone has lived',              'What is your age?',                          21::SMALLINT),
    ('from',        '/frɒm/',             'từ / đến từ',         'used to show the place where someone comes',         'I am from Vietnam. Where are you from?',     22::SMALLINT),
    ('student',     '/ˈstjuːdənt/',       'học sinh / sinh viên','a person who is studying at a school',               'I am a student at Hanoi University.',         23::SMALLINT),
    ('teacher',     '/ˈtiːtʃər/',         'giáo viên',           'a person who teaches others',                        'She is my English teacher.',                  24::SMALLINT),
    ('greet',       '/ɡriːt/',            'chào hỏi',            'to say hello or welcome to someone',                 'He greeted us with a big smile.',             25::SMALLINT),
    ('smile',       '/smaɪl/',            'mỉm cười',            'to turn up the corners of your mouth to show joy',   'She smiled and said good morning.',           26::SMALLINT),
    ('again',       '/əˈɡen/',            'lại / nữa',           'one more time',                                      'Nice to see you again!',                     27::SMALLINT),
    ('see',         '/siː/',              'gặp / nhìn thấy',     'to use your eyes; to meet someone',                  'See you tomorrow!',                          28::SMALLINT),
    ('later',       '/ˈleɪtər/',          'sau / hẹn gặp lại',  'at a time in the future',                            'See you later, everyone!',                   29::SMALLINT),
    ('how',         '/haʊ/',              'thế nào / như thế nào','used to ask about condition or way',                'How are you? I hope you are well.',           30::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
      AND word = v.word
);

-- ─── Gắn tag cho 25 từ mới ───────────────────────────────────────────────────
-- noun: age, morning, afternoon, evening, night, student, teacher, smile, welcome
-- verb: greet, smile, see
-- adjective: fine, good
-- expression: thank you, please, sorry, excuse me, hi, bye, yes, no, again, later, how
INSERT INTO topic_word_tag (topic_word_id, tag_id)
SELECT tw.id, tg.id
FROM (VALUES
    ('age',        'noun'),
    ('morning',    'noun'),
    ('afternoon',  'noun'),
    ('evening',    'noun'),
    ('night',      'noun'),
    ('student',    'noun'),
    ('teacher',    'noun'),
    ('smile',      'noun'),
    ('welcome',    'noun'),
    ('greet',      'verb'),
    ('smile',      'verb'),
    ('see',        'verb'),
    ('fine',       'adjective'),
    ('good',       'adjective'),
    ('thank you',  'expression'),
    ('please',     'expression'),
    ('sorry',      'expression'),
    ('excuse me',  'expression'),
    ('hi',         'expression'),
    ('bye',        'expression'),
    ('yes',        'expression'),
    ('no',         'expression'),
    ('again',      'expression'),
    ('later',      'expression'),
    ('how',        'expression'),
    ('hi',         'everyday'),
    ('bye',        'everyday'),
    ('thank you',  'everyday'),
    ('please',     'everyday'),
    ('sorry',      'everyday'),
    ('fine',       'everyday'),
    ('good',       'everyday'),
    ('morning',    'everyday'),
    ('student',    'everyday'),
    ('teacher',    'everyday')
) AS v (word, tag_slug)
JOIN topic_word tw ON tw.word = v.word
    AND tw.topic_id = (SELECT id FROM topic WHERE slug = 'greetings-introductions')
JOIN tag tg ON tg.slug = v.tag_slug
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word_tag
    WHERE topic_word_id = tw.id AND tag_id = tg.id
);
