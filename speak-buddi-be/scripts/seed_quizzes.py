"""
seed_quizzes.py — Tạo vocabulary_test + quiz_question + quiz_answer cho từng topic.

Logic:
  - 1 vocabulary_test / topic
  - Mỗi từ → 1 quiz_question kiểu:
      • multiple_choice  : nếu topic có ≥ 4 từ
                           (1 đáp án đúng + 3 sai lấy từ cùng topic)
      • flashcard        : nếu topic < 4 từ
  - Nếu từ có example_sentence → thêm 1 câu fill_blank

Chạy: python scripts/seed_quizzes.py
"""

import asyncio
import asyncpg
import random
import sys
import uuid

REMOTE = "postgresql://postgres:sa123@103.146.23.106:5432/speakbuddi"
BATCH  = 300   # rows per executemany


def log(msg: str):
    sys.stdout.buffer.write((msg + "\n").encode("utf-8"))
    sys.stdout.flush()


async def main():
    random.seed(42)

    # ── 1. Fetch all data ─────────────────────────────────────────────────────
    conn = await asyncpg.connect(REMOTE)

    log("Fetching topics and words...")
    topics = await conn.fetch(
        "SELECT id, level_id, name FROM topic WHERE is_active = true ORDER BY name"
    )

    words = await conn.fetch(
        """SELECT id, topic_id, level_id, word, meaning_vi, meaning_en,
                  example_sentence
           FROM topic_word
           WHERE is_active = true
           ORDER BY topic_id, display_order"""
    )
    await conn.close()

    log(f"  Topics: {len(topics)} | Words: {len(words)}")

    # Index words by topic
    words_by_topic: dict[str, list] = {}
    for w in words:
        tid = str(w["topic_id"])
        words_by_topic.setdefault(tid, []).append(w)

    # ── 2. Build rows to insert ────────────────────────────────────────────────
    tests_rows    = []   # (id, topic_id, level_id, title)
    question_rows = []   # (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
    answer_rows   = []   # (id, quiz_question_id, answer_text, is_correct, display_order)

    for topic in topics:
        tid  = str(topic["id"])
        lvl  = topic["level_id"]
        name = topic["name"]
        ws   = words_by_topic.get(tid, [])

        if not ws:
            continue

        # vocabulary_test
        test_id = uuid.uuid4()
        tests_rows.append((
            test_id,
            topic["id"],
            lvl,
            f"Quiz: {name}",
        ))

        use_mc = len(ws) >= 4  # multiple_choice khi đủ từ
        wrong_pool = [w for w in ws]  # pool chọn đáp án sai

        for order, w in enumerate(ws, start=1):
            word_id      = w["id"]
            word_text    = w["word"]
            meaning_vi   = w["meaning_vi"] or ""
            meaning_en   = w["meaning_en"] or ""
            example_sent = w["example_sentence"] or ""

            # ── multiple_choice / flashcard ────────────────────────────────────
            if use_mc:
                q_type = "multiple_choice"
                q_text = f"'{word_text}' có nghĩa là gì?"
            else:
                q_type = "flashcard"
                q_text = word_text

            q_id = uuid.uuid4()
            question_rows.append((
                q_id,
                test_id,
                word_id,
                q_text,
                q_type,
                order,
            ))

            if use_mc:
                # Correct answer
                answer_rows.append((uuid.uuid4(), q_id, meaning_vi, True, 1))

                # 3 wrong answers (different meaning_vi from same topic)
                wrong_opts = [
                    x["meaning_vi"] for x in wrong_pool
                    if x["id"] != word_id and x["meaning_vi"] and x["meaning_vi"] != meaning_vi
                ]
                random.shuffle(wrong_opts)
                for i, wrong in enumerate(wrong_opts[:3], start=2):
                    answer_rows.append((uuid.uuid4(), q_id, wrong, False, i))
            else:
                # flashcard — chỉ 1 "answer" là nghĩa tiếng Việt
                answer_rows.append((uuid.uuid4(), q_id, meaning_vi, True, 1))

            # ── fill_blank (nếu có example_sentence) ──────────────────────────
            if example_sent and word_text.lower() in example_sent.lower():
                blanked = example_sent.replace(word_text, "___", 1)
                fq_id  = uuid.uuid4()
                question_rows.append((
                    fq_id,
                    test_id,
                    word_id,
                    blanked,
                    "fill_blank",
                    order + 1000,   # sau các câu MC/flashcard
                ))
                answer_rows.append((uuid.uuid4(), fq_id, word_text, True, 1))

    log(f"\nRows prepared:")
    log(f"  vocabulary_test : {len(tests_rows)}")
    log(f"  quiz_question   : {len(question_rows)}")
    log(f"  quiz_answer     : {len(answer_rows)}")

    # ── 3. Insert ──────────────────────────────────────────────────────────────
    async def insert_batches(conn, sql, rows, label):
        total = 0
        for i in range(0, len(rows), BATCH):
            batch = rows[i:i + BATCH]
            await conn.executemany(sql, batch)
            total += len(batch)
            log(f"  {label}: {total}/{len(rows)}")

    # vocabulary_test
    log("\nInserting vocabulary_test...")
    conn = await asyncpg.connect(REMOTE)
    await insert_batches(conn,
        """INSERT INTO vocabulary_test (id, topic_id, level_id, title, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT DO NOTHING""",
        tests_rows, "vocabulary_test"
    )
    await conn.close()

    # quiz_question
    log("\nInserting quiz_question...")
    conn = await asyncpg.connect(REMOTE)
    await insert_batches(conn,
        """INSERT INTO quiz_question
           (id, vocabulary_test_id, topic_word_id, question_text, question_type, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING""",
        question_rows, "quiz_question"
    )
    await conn.close()

    # quiz_answer (largest batch — reconnect per batch)
    log("\nInserting quiz_answer...")
    total_ans = 0
    batch_n   = 0
    for i in range(0, len(answer_rows), BATCH):
        batch  = answer_rows[i:i + BATCH]
        batch_n += 1
        conn   = await asyncpg.connect(REMOTE)
        await conn.executemany(
            """INSERT INTO quiz_answer (id, quiz_question_id, answer_text, is_correct, display_order)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT DO NOTHING""",
            batch,
        )
        await conn.close()
        total_ans += len(batch)
        log(f"  quiz_answer: {total_ans}/{len(answer_rows)}")

    # ── 4. Final summary ───────────────────────────────────────────────────────
    conn = await asyncpg.connect(REMOTE)
    t_cnt  = await conn.fetchval("SELECT COUNT(*) FROM vocabulary_test")
    q_cnt  = await conn.fetchval("SELECT COUNT(*) FROM quiz_question")
    a_cnt  = await conn.fetchval("SELECT COUNT(*) FROM quiz_answer")
    mc_cnt = await conn.fetchval("SELECT COUNT(*) FROM quiz_question WHERE question_type = 'multiple_choice'")
    fc_cnt = await conn.fetchval("SELECT COUNT(*) FROM quiz_question WHERE question_type = 'flashcard'")
    fb_cnt = await conn.fetchval("SELECT COUNT(*) FROM quiz_question WHERE question_type = 'fill_blank'")
    await conn.close()

    log("\n══════════════════════════════════════")
    log("DONE — Remote DB quiz summary")
    log("══════════════════════════════════════")
    log(f"  vocabulary_test  : {t_cnt}")
    log(f"  quiz_question    : {q_cnt}")
    log(f"    multiple_choice: {mc_cnt}")
    log(f"    flashcard      : {fc_cnt}")
    log(f"    fill_blank     : {fb_cnt}")
    log(f"  quiz_answer      : {a_cnt}")


if __name__ == "__main__":
    asyncio.run(main())
