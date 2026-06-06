// src/features/quiz/components/QuizRunner.jsx
// ─── Dispatcher điều phối 4 loại câu hỏi (S4.2) ──────────────────────────────
//
// Nhận question hiện tại và dispatch sang component đúng theo question_type.
// Khi user trả lời → ghi vào userAnswers → next question.
// Các loại không nhận dạng → bỏ qua (log warning) và next.
// ─────────────────────────────────────────────────────────────────────────────

import FlashcardQuestion from "./FlashcardQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import FillBlankQuestion from "./FillBlankQuestion";
import GrammarMappingQuestion from "./GrammarMappingQuestion";

/**
 * @param {object}   props
 * @param {object}   props.question       — QuizQuestionOut hiện tại
 * @param {Function} props.onAnswered     — callback(answerRecord) → QuizPage ghi + next
 */
export default function QuizRunner({ question, onAnswered }) {
  if (!question) return null;

  function handleAnswer(answerData) {
    // Ghi answerRecord và chuyển câu tiếp theo
    onAnswered({
      questionId: question.id,
      questionType: question.question_type,
      ...answerData,
    });
  }

  function handleSkip() {
    handleAnswer({ skipped: true });
  }

  const questionType = question.question_type;

  // Dispatch theo type
  let questionComponent;

  if (questionType === "flashcard") {
    questionComponent = (
      <FlashcardQuestion question={question} onAnswer={handleAnswer} />
    );
  } else if (questionType === "multiple_choice") {
    questionComponent = (
      <MultipleChoiceQuestion question={question} onAnswer={handleAnswer} />
    );
  } else if (questionType === "fill_blank") {
    questionComponent = (
      <FillBlankQuestion question={question} onAnswer={handleAnswer} />
    );
  } else if (questionType === "grammar_mapping") {
    questionComponent = (
      <GrammarMappingQuestion question={question} onAnswer={handleAnswer} />
    );
  } else {
    // Loại câu hỏi không nhận dạng → log warning và bỏ qua
    console.warn(`[QuizRunner] Loại câu hỏi không nhận dạng: "${questionType}" — bỏ qua`);
    questionComponent = (
      <div style={{ textAlign: "center", padding: "24px" }}>
        <p style={{ color: "#777587", fontSize: 14, marginBottom: 16 }}>
          Dạng câu hỏi &ldquo;{questionType}&rdquo; chưa được hỗ trợ.
        </p>
        <button
          onClick={handleSkip}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            border: "1px solid #c7c4d8",
            background: "#ffffff",
            color: "#464555",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Bỏ qua →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {questionComponent}
    </div>
  );
}
