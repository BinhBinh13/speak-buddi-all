# speak-buddi-be/services/quiz_service.py
# ─── Service layer cho nhóm Quiz/Test ─────────────────────────────────────────
#
# Phạm vi S4.1: logic thuần — không gọi DB trực tiếp, gọi repository
# Pattern: bám sát services/ai_service.py (logic thuần, không phụ thuộc FastAPI)
#
# Dùng ở:
#   S4.3 — check_fill_blank_answer() khi user submit fill_blank
#   S4.4 — calculate_score() khi nộp bài (BR08)
#   S4.2 — generate_questions_from_topic_words() (placeholder, implement ở S4.2)
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

import logging

log = logging.getLogger("speakbuddi.quiz")


# ─── Chấm điểm ────────────────────────────────────────────────────────────────

def calculate_score(correct: int, total: int) -> float:
    """
    Tính điểm phần trăm theo BR08: correct / total × 100, làm tròn 2 chữ số.
    Trả về 0.0 nếu total = 0 (tránh chia 0).

    Ví dụ:
        calculate_score(3, 5) → 60.0
        calculate_score(0, 5) → 0.0
        calculate_score(5, 5) → 100.0
    """
    if total <= 0:
        log.warning("calculate_score: total_questions = %d, trả về 0.0", total)
        return 0.0
    return round(correct / total * 100, 2)


# ─── Chấm fill_blank ──────────────────────────────────────────────────────────

def check_fill_blank_answer(user_text: str, correct_text: str) -> bool:
    """
    So khớp câu trả lời fill_blank theo kiểu flexible:
    - Bỏ qua khoảng trắng đầu/cuối (strip)
    - Không phân biệt hoa/thường (casefold)
    - Bỏ qua dấu chấm câu cuối câu (strip '.,!?;')

    Ví dụ:
        check_fill_blank_answer("Meet ", "meet") → True
        check_fill_blank_answer("MEET", "meet")  → True
        check_fill_blank_answer("hello.", "hello") → True
        check_fill_blank_answer("hi", "hello")    → False
    """
    def normalize(s: str) -> str:
        return s.strip().casefold().strip(".,!?;")

    return normalize(user_text) == normalize(correct_text)


# ─── Auto-generate câu hỏi từ topic_words ────────────────────────────────────

def generate_questions_from_topic_words(topic_words: list[dict]) -> list[dict]:
    """
    Tự động tạo danh sách câu hỏi từ danh sách từ vựng của topic (S4.2).

    Input:
        topic_words: list[dict] — mỗi dict gồm {id, word, meaning_vi, meaning_en,
                                                  example_sentence, phonetic}
    Output:
        list[dict] — câu hỏi chưa lưu DB, structure:
            {question_text, question_type, topic_word_id, display_order,
             answers: [{answer_text, is_correct, display_order}]}

    Logic:
    - Mỗi từ → 1 flashcard question (luôn tạo)
    - N >= 4 từ → tạo multiple_choice cho mỗi từ (distractor = 3 từ random khác)
    - N >= 4 từ → tạo 1 grammar_mapping question gộp 4 từ đầu
    - fill_blank: chỉ tạo khi từ có example_sentence chứa chính từ đó (thay bằng ___)

    Guard: nếu < 4 từ → chỉ tạo flashcard (skip multiple_choice + grammar_mapping).
    """
    import random

    n = len(topic_words)
    if n == 0:
        log.warning("generate_questions_from_topic_words: topic_words rỗng")
        return []

    questions: list[dict] = []
    order = 0

    # ── Flashcard: 1 câu mỗi từ (luôn tạo) ──────────────────────────────────
    for word in topic_words:
        questions.append({
            "question_text": word.get("word", ""),
            "question_type": "flashcard",
            "topic_word_id": word.get("id"),
            "display_order": order,
            "answers": [],  # flashcard không có answers — user tự chấm
        })
        order += 1

    # ── Multiple Choice: tạo khi >= 4 từ ────────────────────────────────────
    if n >= 4:
        for i, word in enumerate(topic_words):
            correct_meaning = word.get("meaning_vi") or word.get("meaning_en") or ""
            if not correct_meaning:
                continue  # bỏ từ thiếu nghĩa

            # Chọn 3 distractor từ các từ khác (random, không trùng)
            others = [w for j, w in enumerate(topic_words) if j != i]
            distractors = random.sample(others, min(3, len(others)))

            answers: list[dict] = [
                {"answer_text": correct_meaning, "is_correct": True, "display_order": 0}
            ]
            for k, d in enumerate(distractors):
                d_meaning = d.get("meaning_vi") or d.get("meaning_en") or ""
                if d_meaning and d_meaning != correct_meaning:
                    answers.append({
                        "answer_text": d_meaning,
                        "is_correct": False,
                        "display_order": k + 1,
                    })

            if len(answers) < 2:
                continue  # không đủ lựa chọn → bỏ qua câu này

            # Shuffle thứ tự options
            random.shuffle(answers)
            for idx, a in enumerate(answers):
                a["display_order"] = idx

            questions.append({
                "question_text": f"What is the Vietnamese meaning of '{word.get('word', '')}'?",
                "question_type": "multiple_choice",
                "topic_word_id": word.get("id"),
                "display_order": order,
                "answers": answers,
            })
            order += 1

    # ── Grammar Mapping: 1 câu gộp 4 từ đầu (nếu >= 4 từ) ──────────────────
    if n >= 4:
        mapping_words = topic_words[:4]
        mapping_answers: list[dict] = []
        for idx, word in enumerate(mapping_words):
            term = word.get("word", "")
            definition = word.get("meaning_vi") or word.get("meaning_en") or ""
            if term and definition:
                # Format: "term → definition" cho GrammarMappingQuestion parse
                mapping_answers.append({
                    "answer_text": f"{term} → {definition}",
                    "is_correct": True,
                    "display_order": idx,
                })

        if len(mapping_answers) >= 2:
            questions.append({
                "question_text": "Nối từ với nghĩa tương ứng",
                "question_type": "grammar_mapping",
                "topic_word_id": None,
                "display_order": order,
                "answers": mapping_answers,
            })
            order += 1

    # ── Fill Blank: chỉ khi example_sentence chứa chính từ đó ───────────────
    for word in topic_words:
        word_text = word.get("word", "").strip()
        example = word.get("example_sentence", "") or ""
        if not word_text or not example:
            continue

        # Kiểm tra từ xuất hiện trong câu (case-insensitive)
        import re
        pattern = re.compile(re.escape(word_text), re.IGNORECASE)
        if not pattern.search(example):
            continue

        # Thay từ đầu tiên trong câu bằng ___
        sentence_with_blank = pattern.sub("___", example, count=1)

        # Answers: từ đúng + các từ khác làm distractor (dùng word text)
        answers: list[dict] = [
            {"answer_text": word_text, "is_correct": True, "display_order": 0}
        ]
        distractors = [
            w.get("word", "") for w in topic_words
            if w.get("id") != word.get("id") and w.get("word")
        ]
        random.shuffle(distractors)
        for k, d in enumerate(distractors[:3]):
            answers.append({"answer_text": d, "is_correct": False, "display_order": k + 1})

        questions.append({
            "question_text": sentence_with_blank,
            "question_type": "fill_blank",
            "topic_word_id": word.get("id"),
            "display_order": order,
            "answers": answers,
        })
        order += 1

    log.info(
        "generate_questions_from_topic_words: %d từ → %d câu hỏi",
        n, len(questions),
    )
    return questions
