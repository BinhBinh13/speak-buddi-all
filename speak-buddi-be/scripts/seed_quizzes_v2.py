"""
seed_quizzes_v2.py
  1. Xóa toàn bộ quiz cũ (quiz_answer → quiz_question → vocabulary_test)
  2. Tạo mới với 3 loại câu hỏi / từ:
       multiple_choice  — chọn nghĩa tiếng Việt đúng (4 options)
       fill_blank       — điền từ tiếng Anh (gợi ý: nghĩa tiếng Việt)
       grammar_mapping  — sắp xếp câu đơn giản chứa từ (4–6 từ)

Chạy: python scripts/seed_quizzes_v2.py
"""

import asyncio
import asyncpg
import random
import sys
import uuid

REMOTE = "postgresql://postgres:sa123@103.146.23.106:5432/speakbuddi"
BATCH  = 300

random.seed(42)


def log(msg: str):
    sys.stdout.buffer.write((msg + "\n").encode("utf-8"))
    sys.stdout.flush()


# ── Tạo câu đơn giản cho grammar_mapping ─────────────────────────────────────
# Template ngắn 4–6 từ; {w} = từ cần học
TEMPLATES = [
    "I always use {w} correctly.",
    "Please learn the word {w}.",
    "The word {w} is very useful.",
    "You should practice {w} daily.",
    "She knows the meaning of {w}.",
    "We often say {w} in English.",
    "Can you spell {w} correctly?",
    "He studied the word {w} today.",
    "Try to remember the word {w}.",
    "Learning {w} will help you speak.",
]


def make_grammar_sentence(word: str, idx: int) -> tuple[str, str]:
    """
    Trả về (scrambled_text, correct_sentence).
    scrambled_text: các từ ngẫu nhiên, cách nhau " / "
    correct_sentence: câu đúng
    """
    template = TEMPLATES[idx % len(TEMPLATES)]
    sentence = template.replace("{w}", word)

    # Tách thành token (giữ dấu câu gắn liền từ cuối)
    words = sentence.split()
    shuffled = words[:]
    # Đảm bảo thứ tự khác câu gốc
    attempts = 0
    while shuffled == words and attempts < 20:
        random.shuffle(shuffled)
        attempts += 1

    scrambled = " / ".join(shuffled)
    return scrambled, sentence


# ── Main ───────────────────────────────────────────────────────────────────────

async def main():

    # ── STEP 1: Xóa quiz cũ ───────────────────────────────────────────────────
    log("STEP 1 — Xóa quiz cũ...")
    conn = await asyncpg.connect(REMOTE)
    r1 = await conn.execute("DELETE FROM quiz_answer")
    r2 = await conn.execute("DELETE FROM quiz_attempt_answer")
    r3 = await conn.execute("DELETE FROM quiz_attempt")
    r4 = await conn.execute("DELETE FROM quiz_question")
    r5 = await conn.execute("DELETE FROM vocabulary_test")
    await conn.close()
    log(f"  Đã xóa: {r1}, {r2}, {r3}, {r4}, {r5}")

    # ── STEP 2: Fetch data ─────────────────────────────────────────────────────
    log("\nSTEP 2 — Fetch topics + words...")
    conn = await asyncpg.connect(REMOTE)
    topics = await conn.fetch(
        "SELECT id, level_id, name FROM topic WHERE is_active=true ORDER BY name"
    )
    words_all = await conn.fetch(
        """SELECT id, topic_id, level_id, word, meaning_vi, example_sentence
           FROM topic_word WHERE is_active=true
           ORDER BY topic_id, display_order"""
    )
    await conn.close()

    # Index by topic
    words_by_topic: dict[str, list] = {}
    for w in words_all:
        words_by_topic.setdefault(str(w["topic_id"]), []).append(w)

    log(f"  Topics: {len(topics)} | Words: {len(words_all)}")

    # ── STEP 3: Build rows ─────────────────────────────────────────────────────
    log("\nSTEP 3 — Sinh câu hỏi...")

    tests_rows    = []
    question_rows = []
    answer_rows   = []

    for topic in topics:
        tid  = str(topic["id"])
        ws   = words_by_topic.get(tid, [])
        if not ws:
            continue

        # 1 vocabulary_test / topic
        test_id = uuid.uuid4()
        tests_rows.append((test_id, topic["id"], topic["level_id"], f"Kiểm tra: {topic['name']}"))

        use_mc = len(ws) >= 4
        # Pool nghĩa sai (cùng topic)
        meaning_pool = [w["meaning_vi"] for w in ws if w["meaning_vi"]]

        for idx, w in enumerate(ws):
            word      = w["word"]
            mv        = w["meaning_vi"] or ""
            ex        = w["example_sentence"] or ""
            word_id   = w["id"]
            order_base = idx * 3  # 3 câu/từ, thứ tự tách biệt

            # ── A. multiple_choice ─────────────────────────────────────────────
            if use_mc:
                qid = uuid.uuid4()
                question_rows.append((
                    qid, test_id, word_id,
                    f"'{word}' có nghĩa là gì trong tiếng Việt?",
                    "multiple_choice",
                    order_base + 1,
                ))
                answer_rows.append((uuid.uuid4(), qid, mv, True, 1))
                wrongs = [m for m in meaning_pool if m != mv]
                random.shuffle(wrongs)
                for i, wm in enumerate(wrongs[:3], start=2):
                    answer_rows.append((uuid.uuid4(), qid, wm, False, i))

            # ── B. fill_blank ──────────────────────────────────────────────────
            if ex and word.lower() in ex.lower():
                # Dùng example_sentence thật
                blanked = ex.replace(word, "___", 1)
                fb_text = blanked
            else:
                # Template: điền từ tiếng Anh theo nghĩa tiếng Việt
                fb_text = f"Từ tiếng Anh có nghĩa là '{mv}' là: ___"

            fq_id = uuid.uuid4()
            question_rows.append((
                fq_id, test_id, word_id,
                fb_text,
                "fill_blank",
                order_base + 2,
            ))
            answer_rows.append((uuid.uuid4(), fq_id, word, True, 1))

            # ── C. grammar_mapping ─────────────────────────────────────────────
            scrambled, correct = make_grammar_sentence(word, idx)
            gq_id = uuid.uuid4()
            question_rows.append((
                gq_id, test_id, word_id,
                f"Sắp xếp các từ thành câu đúng: {scrambled}",
                "grammar_mapping",
                order_base + 3,
            ))
            answer_rows.append((uuid.uuid4(), gq_id, correct, True, 1))

    log(f"  vocabulary_test  : {len(tests_rows)}")
    log(f"  quiz_question    : {len(question_rows)}")
    log(f"    (MC+FB+GM = {len(tests_rows)} topics × 3 types)")
    log(f"  quiz_answer      : {len(answer_rows)}")

    # ── STEP 4: Insert ────────────────────────────────────────────────────────
    log("\nSTEP 4 — Insert vocabulary_test...")
    conn = await asyncpg.connect(REMOTE)
    await conn.executemany(
        """INSERT INTO vocabulary_test (id, topic_id, level_id, title, is_active)
           VALUES ($1,$2,$3,$4,true) ON CONFLICT DO NOTHING""",
        tests_rows,
    )
    await conn.close()
    log(f"  ✓ {len(tests_rows)} tests")

    log("\nSTEP 4 — Insert quiz_question...")
    conn = await asyncpg.connect(REMOTE)
    inserted_q = 0
    for i in range(0, len(question_rows), BATCH):
        batch = question_rows[i:i + BATCH]
        await conn.executemany(
            """INSERT INTO quiz_question
               (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
               VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING""",
            batch,
        )
        inserted_q += len(batch)
        log(f"  quiz_question: {inserted_q}/{len(question_rows)}")
    await conn.close()

    log("\nSTEP 4 — Insert quiz_answer (reconnect/batch)...")
    inserted_a = 0
    for i in range(0, len(answer_rows), BATCH):
        batch = answer_rows[i:i + BATCH]
        conn = await asyncpg.connect(REMOTE)
        await conn.executemany(
            """INSERT INTO quiz_answer (id, quiz_question_id, answer_text, is_correct, display_order)
               VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING""",
            batch,
        )
        await conn.close()
        inserted_a += len(batch)
        log(f"  quiz_answer: {inserted_a}/{len(answer_rows)}")

    # ── STEP 5: Final stats ────────────────────────────────────────────────────
    conn = await asyncpg.connect(REMOTE)
    t  = await conn.fetchval("SELECT COUNT(*) FROM vocabulary_test")
    q  = await conn.fetchval("SELECT COUNT(*) FROM quiz_question")
    mc = await conn.fetchval("SELECT COUNT(*) FROM quiz_question WHERE question_type='multiple_choice'")
    fb = await conn.fetchval("SELECT COUNT(*) FROM quiz_question WHERE question_type='fill_blank'")
    gm = await conn.fetchval("SELECT COUNT(*) FROM quiz_question WHERE question_type='grammar_mapping'")
    a  = await conn.fetchval("SELECT COUNT(*) FROM quiz_answer")
    await conn.close()

    log("\n══════════════════════════════════════")
    log("DONE — Remote DB quiz summary")
    log("══════════════════════════════════════")
    log(f"  vocabulary_test  : {t}")
    log(f"  quiz_question    : {q}")
    log(f"    multiple_choice: {mc}")
    log(f"    fill_blank     : {fb}")
    log(f"    grammar_mapping: {gm}")
    log(f"  quiz_answer      : {a}")


if __name__ == "__main__":
    asyncio.run(main())
