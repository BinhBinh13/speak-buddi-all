-- Migration 010: seed thêm 50 từ cho topic Numbers & Counting (A1)
-- Sau migration này topic có đủ 55 từ (5 từ gốc + 50 từ mới)
-- Idempotent — chạy nhiều lần không lỗi
--
-- Chạy: psql -U <user> -d speakbuddi -f db/migrations/010_seed_numbers_50words.sql

-- ─── Đảm bảo tag adjective có sẵn (từ migration 009) ───────────────────────
INSERT INTO tag (name, slug)
SELECT name, slug FROM (VALUES
    ('adjective', 'adjective')
) AS v (name, slug)
WHERE NOT EXISTS (SELECT 1 FROM tag WHERE tag.slug = v.slug);

-- ─── 50 từ mới cho Numbers & Counting ────────────────────────────────────────
INSERT INTO topic_word (topic_id, level_id, word, phonetic, meaning_vi, meaning_en, example_sentence, source, display_order)
SELECT
    (SELECT id FROM topic WHERE slug = 'numbers-counting'),
    (SELECT id FROM level WHERE code = 'A1'),
    v.word, v.phonetic, v.meaning_vi, v.meaning_en, v.example_sentence, 'admin', v.ord
FROM (VALUES
    ('zero',      '/ˈzɪroʊ/',           'số không',            'the number 0',                                      'The score is zero to zero.',                    6::SMALLINT),
    ('three',     '/θriː/',             'ba',                  'the number 3',                                      'I have three sisters.',                         7::SMALLINT),
    ('four',      '/fɔːr/',             'bốn',                 'the number 4',                                      'There are four chairs in the room.',              8::SMALLINT),
    ('five',      '/faɪv/',             'năm',                 'the number 5',                                      'She bought five apples.',                       9::SMALLINT),
    ('six',       '/sɪks/',             'sáu',                 'the number 6',                                      'The bus comes every six minutes.',               10::SMALLINT),
    ('seven',     '/ˈsevən/',           'bảy',                 'the number 7',                                      'There are seven days in a week.',                 11::SMALLINT),
    ('eight',     '/eɪt/',              'tám',                 'the number 8',                                      'He sleeps eight hours every night.',              12::SMALLINT),
    ('nine',      '/naɪn/',             'chín',                'the number 9',                                      'School starts at nine o''clock.',                13::SMALLINT),
    ('eleven',    '/ɪˈlevən/',          'mười một',            'the number 11',                                     'My birthday is on the eleventh of May.',          14::SMALLINT),
    ('twelve',    '/twelv/',            'mười hai',            'the number 12',                                     'There are twelve months in a year.',              15::SMALLINT),
    ('thirteen',  '/ˌθɜːrˈtiːn/',        'mười ba',             'the number 13',                                     'She is thirteen years old.',                      16::SMALLINT),
    ('fourteen',  '/ˌfɔːrˈtiːn/',        'mười bốn',            'the number 14',                                     'The meeting starts at fourteen hundred hours.',   17::SMALLINT),
    ('fifteen',   '/ˌfɪfˈtiːn/',         'mười lăm',            'the number 15',                                     'I wait fifteen minutes for the bus.',             18::SMALLINT),
    ('sixteen',   '/ˌsɪkˈstiːn/',        'mười sáu',            'the number 16',                                     'You can drive at sixteen in some countries.',     19::SMALLINT),
    ('seventeen', '/ˌsevənˈtiːn/',       'mười bảy',            'the number 17',                                     'He scored seventeen points in the game.',         20::SMALLINT),
    ('eighteen',  '/ˌeɪˈtiːn/',          'mười tám',            'the number 18',                                     'She will be eighteen next month.',                21::SMALLINT),
    ('nineteen',  '/ˌnaɪnˈtiːn/',        'mười chín',           'the number 19',                                     'Nineteen people came to the party.',              22::SMALLINT),
    ('twenty',    '/ˈtwenti/',           'hai mươi',            'the number 20',                                     'Can you count to twenty in English?',             23::SMALLINT),
    ('thirty',    '/ˈθɜːrti/',           'ba mươi',             'the number 30',                                     'The class has thirty students.',                  24::SMALLINT),
    ('forty',     '/ˈfɔːrti/',           'bốn mươi',            'the number 40',                                     'He runs forty kilometers every week.',            25::SMALLINT),
    ('fifty',     '/ˈfɪfti/',            'năm mươi',            'the number 50',                                     'Fifty percent of the class passed the test.',     26::SMALLINT),
    ('sixty',     '/ˈsɪksti/',           'sáu mươi',            'the number 60',                                     'There are sixty seconds in a minute.',            27::SMALLINT),
    ('seventy',   '/ˈsevənti/',          'bảy mươi',            'the number 70',                                     'My grandmother is seventy years old.',            28::SMALLINT),
    ('eighty',    '/ˈeɪti/',             'tám mươi',            'the number 80',                                     'The speed limit is eighty kilometers per hour.',29::SMALLINT),
    ('ninety',    '/ˈnaɪnti/',           'chín mươi',           'the number 90',                                     'Ninety people attended the event.',               30::SMALLINT),
    ('thousand',  '/ˈθaʊzənd/',          'nghìn',               'the number 1,000',                                  'One thousand people came to the concert.',        31::SMALLINT),
    ('million',   '/ˈmɪljən/',           'triệu',               'the number 1,000,000',                              'The video got a million views.',                  32::SMALLINT),
    ('first',     '/fɜːrst/',            'thứ nhất / đầu tiên','coming before all others in order',                  'This is my first English lesson.',                33::SMALLINT),
    ('second',    '/ˈsekənd/',           'thứ hai',             'coming after the first in order',                   'Wait a second, please.',                          34::SMALLINT),
    ('third',     '/θɜːrd/',             'thứ ba',              'coming after the second in order',                  'She finished third in the race.',                 35::SMALLINT),
    ('fourth',    '/fɔːrθ/',             'thứ tư',              'coming after the third in order',                   'Today is the fourth of July.',                    36::SMALLINT),
    ('fifth',     '/fɪfθ/',              'thứ năm',             'coming after the fourth in order',                  'He lives on the fifth floor.',                    37::SMALLINT),
    ('sixth',     '/sɪksθ/',             'thứ sáu',             'coming after the fifth in order',                   'This is the sixth time I called you.',            38::SMALLINT),
    ('seventh',   '/ˈsevənθ/',           'thứ bảy',             'coming after the sixth in order',                   'Sunday is the seventh day of the week.',          39::SMALLINT),
    ('eighth',    '/eɪtθ/',              'thứ tám',             'coming after the seventh in order',                 'She is in the eighth grade.',                     40::SMALLINT),
    ('ninth',     '/naɪnθ/',             'thứ chín',            'coming after the eighth in order',                  'September is the ninth month.',                   41::SMALLINT),
    ('tenth',     '/tenθ/',              'thứ mười',            'coming after the ninth in order',                   'This is the tenth question on the test.',         42::SMALLINT),
    ('number',    '/ˈnʌmbər/',           'con số / số',         'a word or symbol that represents an amount',        'What is your phone number?',                      43::SMALLINT),
    ('plus',      '/plʌs/',              'cộng / dấu cộng',     'added to; the sign +',                              'Two plus two equals four.',                       44::SMALLINT),
    ('minus',     '/ˈmaɪnəs/',           'trừ / dấu trừ',       'reduced by; the sign -',                            'Ten minus three equals seven.',                   45::SMALLINT),
    ('equal',     '/ˈiːkwəl/',           'bằng / bình đẳng',    'the same in amount, size, or value',                'All people are equal.',                           46::SMALLINT),
    ('add',       '/æd/',                'cộng / thêm vào',     'to put numbers together to get a total',            'Add five and three to get eight.',                47::SMALLINT),
    ('subtract',  '/səbˈtrækt/',         'trừ / lấy đi',        'to take one number away from another',            'Subtract four from ten to get six.',              48::SMALLINT),
    ('total',     '/ˈtoʊtəl/',           'tổng / toàn bộ',      'the complete amount when numbers are added',        'The total cost is fifty dollars.',                49::SMALLINT),
    ('half',      '/hæf/',               'một nửa',             'one of two equal parts of something',             'I ate half of the pizza.',                        50::SMALLINT),
    ('double',    '/ˈdʌbəl/',            'gấp đôi',             'twice as much or as many',                         'The price doubled last year.',                    51::SMALLINT),
    ('dozen',     '/ˈdʌzən/',            'một tá (12)',         'a group of twelve things',                          'She bought a dozen eggs.',                        52::SMALLINT),
    ('pair',      '/per/',               'cặp / đôi',           'two things of the same kind used together',         'I need a pair of shoes.',                         53::SMALLINT),
    ('many',      '/ˈmeni/',             'nhiều',               'a large number of people or things',              'How many books do you have?',                     54::SMALLINT),
    ('few',       '/fjuː/',              'ít / vài',            'a small number of people or things',              'Only a few students came today.',                 55::SMALLINT)
) AS v (word, phonetic, meaning_vi, meaning_en, example_sentence, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word
    WHERE topic_id = (SELECT id FROM topic WHERE slug = 'numbers-counting')
      AND word = v.word
);

-- ─── Gắn tag cho 50 từ mới ───────────────────────────────────────────────────
-- noun: cardinal numbers, number, total, dozen, pair, plus, minus
-- adjective: ordinals, equal, half, double, many, few
-- verb: add, subtract
INSERT INTO topic_word_tag (topic_word_id, tag_id)
SELECT tw.id, tg.id
FROM (VALUES
    ('zero',      'noun'),
    ('three',     'noun'),
    ('four',      'noun'),
    ('five',      'noun'),
    ('six',       'noun'),
    ('seven',     'noun'),
    ('eight',     'noun'),
    ('nine',      'noun'),
    ('eleven',    'noun'),
    ('twelve',    'noun'),
    ('thirteen',  'noun'),
    ('fourteen',  'noun'),
    ('fifteen',   'noun'),
    ('sixteen',   'noun'),
    ('seventeen', 'noun'),
    ('eighteen',  'noun'),
    ('nineteen',  'noun'),
    ('twenty',    'noun'),
    ('thirty',    'noun'),
    ('forty',     'noun'),
    ('fifty',     'noun'),
    ('sixty',     'noun'),
    ('seventy',   'noun'),
    ('eighty',    'noun'),
    ('ninety',    'noun'),
    ('thousand',  'noun'),
    ('million',   'noun'),
    ('number',    'noun'),
    ('total',     'noun'),
    ('dozen',     'noun'),
    ('pair',      'noun'),
    ('plus',      'noun'),
    ('minus',     'noun'),
    ('first',     'adjective'),
    ('second',    'adjective'),
    ('third',     'adjective'),
    ('fourth',    'adjective'),
    ('fifth',     'adjective'),
    ('sixth',     'adjective'),
    ('seventh',   'adjective'),
    ('eighth',    'adjective'),
    ('ninth',     'adjective'),
    ('tenth',     'adjective'),
    ('equal',     'adjective'),
    ('half',      'adjective'),
    ('double',    'adjective'),
    ('many',      'adjective'),
    ('few',       'adjective'),
    ('add',       'verb'),
    ('subtract',  'verb'),
    ('zero',      'everyday'),
    ('three',     'everyday'),
    ('four',      'everyday'),
    ('five',      'everyday'),
    ('six',       'everyday'),
    ('seven',     'everyday'),
    ('eight',     'everyday'),
    ('nine',      'everyday'),
    ('twenty',    'everyday'),
    ('number',    'everyday'),
    ('many',      'everyday'),
    ('few',       'everyday'),
    ('half',      'everyday'),
    ('pair',      'everyday'),
    ('one',       'everyday'),
    ('two',       'everyday'),
    ('ten',       'everyday'),
    ('hundred',   'everyday'),
    ('count',     'everyday'),
    ('count',     'verb')
) AS v (word, tag_slug)
JOIN topic_word tw ON tw.word = v.word
    AND tw.topic_id = (SELECT id FROM topic WHERE slug = 'numbers-counting')
JOIN tag tg ON tg.slug = v.tag_slug
WHERE NOT EXISTS (
    SELECT 1 FROM topic_word_tag
    WHERE topic_word_id = tw.id AND tag_id = tg.id
);
