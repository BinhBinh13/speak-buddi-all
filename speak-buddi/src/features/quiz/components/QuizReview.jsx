// src/features/quiz/components/QuizReview.jsx
// ─── Màn Review: kiểm tra lại đáp án trước khi nộp bài (S4.3) ───────────────
//
// Hiển thị danh sách tất cả câu hỏi + trạng thái đã/chưa trả lời.
// Highlight đỏ câu trong unansweredIds.
// Chặn nộp nếu còn câu chưa trả lời (AC-06-02).
// Click câu chưa trả lời → onGoToQuestion(index) quay lại câu đó.
//
// Màu: primary #3525cd, error #ba1a1a, success #006c49, bg #fcf8ff
// Font: Be Vietnam Pro, touch target >= 44px
// ─────────────────────────────────────────────────────────────────────────────

import QuizHeader from "./QuizHeader";

// Nhãn loại câu hỏi theo tiếng Việt
const TYPE_LABEL = {
  flashcard: "Thẻ ghi nhớ",
  multiple_choice: "Trắc nghiệm",
  fill_blank: "Điền từ",
  grammar_mapping: "Nối cặp",
};

/**
 * @param {object} props
 * @param {object}   props.test            — VocabularyTestOut
 * @param {object[]} props.questions        — danh sách câu hỏi
 * @param {object}   props.userAnswers      — { [questionId]: AnswerRecord }
 * @param {Set}      props.unansweredIds    — Set<questionId> câu bị chặn nộp
 * @param {string|null} props.submitError   — lỗi từ handleSubmit
 * @param {boolean}  props.submitting       — đang gọi API submit
 * @param {string|null} props.attemptId     — UUID attempt (null nếu startAttempt lỗi)
 * @param {function} props.onSubmit         — gọi khi bấm "Nộp bài"
 * @param {function} props.onRetry          — gọi khi bấm "Làm lại"
 * @param {function} props.onGoToQuestion   — onGoToQuestion(index: number)
 * @param {function} props.onBack           — navigate(-1)
 */
export default function QuizReview({
  test,
  questions,
  userAnswers,
  unansweredIds,
  submitError,
  submitting,
  attemptId,
  onSubmit,
  onRetry,
  onGoToQuestion,
  onBack,
}) {
  // Toast: hiển thị khi submitError có giá trị — dismiss bằng nút ✕

  const totalQ = questions.length;
  const answeredCount = questions.filter(
    (q) => userAnswers[q.id] && !userAnswers[q.id].skipped
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fcf8ff",
        position: "relative",
      }}
    >
      {/* Background blobs (giữ nhất quán với QuizPage) */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "-10%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background: "#e2dfff",
          opacity: 0.4,
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          right: "-10%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background: "#ffdbcc",
          opacity: 0.3,
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header — progress 100% */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <QuizHeader
          topicLabel={test?.title ?? "Bài kiểm tra"}
          current={totalQ}
          total={totalQ}
          onBack={onBack}
        />
      </div>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 16px 120px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ width: "100%", maxWidth: 640 }}>

          {/* Section title */}
          <div style={{ marginBottom: 20, textAlign: "center" }}>
            <h2
              style={{
                fontSize: "clamp(20px, 4vw, 26px)",
                fontWeight: 700,
                color: "#1b1b24",
                margin: "0 0 6px",
              }}
            >
              Kiểm tra lại đáp án
            </h2>
            <p style={{ fontSize: 14, color: "#777587", margin: 0 }}>
              Đã trả lời{" "}
              <strong style={{ color: answeredCount === totalQ ? "#006c49" : "#ba1a1a" }}>
                {answeredCount}
              </strong>
              /{totalQ} câu
            </p>
          </div>

          {/* Question list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map((q, index) => {
              const ans = userAnswers[q.id];
              const isUnanswered = !ans || ans.skipped || unansweredIds.has(q.id);
              const isHighlighted = unansweredIds.has(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => isUnanswered ? onGoToQuestion(index) : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: `2px solid ${isHighlighted ? "#ba1a1a" : isUnanswered ? "#e4e1ee" : "#e4e1ee"}`,
                    background: isHighlighted ? "#fff5f5" : "#ffffff",
                    cursor: isUnanswered ? "pointer" : "default",
                    textAlign: "left",
                    width: "100%",
                    transition: "border-color 0.2s, background 0.2s",
                    boxShadow: isHighlighted
                      ? "0 2px 8px rgba(186,26,26,0.1)"
                      : "0 1px 4px rgba(0,0,0,0.04)",
                    minHeight: 60,
                  }}
                  aria-label={
                    isUnanswered
                      ? `Câu ${index + 1} chưa trả lời — bấm để quay lại`
                      : `Câu ${index + 1} đã trả lời`
                  }
                >
                  {/* Question number badge */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: isHighlighted
                        ? "#ba1a1a"
                        : isUnanswered
                        ? "#e4e1ee"
                        : "#006c49",
                      color: isUnanswered && !isHighlighted ? "#777587" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Question info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1b1b24",
                        margin: "0 0 2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {q.question_text}
                    </p>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#777587",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {TYPE_LABEL[q.question_type] ?? q.question_type}
                    </span>
                  </div>

                  {/* Status indicator */}
                  <div style={{ flexShrink: 0 }}>
                    {isUnanswered ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#ba1a1a",
                          background: "#fde9e9",
                          borderRadius: 999,
                          padding: "4px 10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✗ Chưa trả lời
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#006c49",
                          background: "#e6f4ef",
                          borderRadius: 999,
                          padding: "4px 10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✓ Đã trả lời
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Toast error — submitError (AC-06-02) */}
      {submitError && (
        <div
          role="alert"
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ba1a1a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(186,26,26,0.3)",
            zIndex: 100,
            maxWidth: "90vw",
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
        >
          {submitError}
        </div>
      )}

      {/* Footer action buttons */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(252,248,255,0.95)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #e4e1ee",
          padding: "16px 16px max(16px, env(safe-area-inset-bottom))",
          display: "flex",
          gap: 12,
          justifyContent: "center",
          zIndex: 20,
        }}
      >
        {/* Nút Làm lại */}
        <button
          onClick={onRetry}
          disabled={submitting}
          style={{
            padding: "14px 28px",
            borderRadius: 12,
            border: "1px solid #c7c4d8",
            background: "#ffffff",
            color: "#464555",
            fontSize: 15,
            fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer",
            minHeight: 52,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          Làm lại
        </button>

        {/* Nút Nộp bài */}
        <button
          onClick={onSubmit}
          disabled={submitting || !attemptId}
          style={{
            padding: "14px 40px",
            borderRadius: 12,
            border: "none",
            background: submitting || !attemptId ? "#a8a4c0" : "#3525cd",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 600,
            cursor: submitting || !attemptId ? "not-allowed" : "pointer",
            minHeight: 52,
            boxShadow:
              submitting || !attemptId
                ? "none"
                : "0 4px 12px rgba(53,37,205,0.3)",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          {submitting ? "Đang nộp..." : "Nộp bài"}
        </button>
      </div>
    </div>
  );
}
