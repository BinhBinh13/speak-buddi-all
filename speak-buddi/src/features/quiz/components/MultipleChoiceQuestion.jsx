// src/features/quiz/components/MultipleChoiceQuestion.jsx
// ─── Dạng câu hỏi Multiple Choice (S4.2) ─────────────────────────────────────
//
// Bám mockup: bai_kiem_tra_desktop
// - Câu hỏi dạng text + 4 lựa chọn (grid 2 cột desktop, 1 cột mobile)
// - Selected state: border-primary, bg primary/10, icon radio_button_checked
// - Button "Tiếp theo" disabled khi chưa chọn, active khi đã chọn
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

/**
 * @param {object}   props
 * @param {object}   props.question   — QuizQuestionOut
 * @param {Function} props.onAnswer   — callback({ answerId })
 */
export default function MultipleChoiceQuestion({ question, onAnswer }) {
  const [selectedId, setSelectedId] = useState(null);

  const answers = question.answers ?? [];

  function handleSelect(answerId) {
    setSelectedId(answerId);
  }

  function handleNext() {
    if (!selectedId) return;
    onAnswer({ selectedAnswerId: selectedId });
    setSelectedId(null);
  }

  return (
    <div style={{ width: "100%", maxWidth: 672, margin: "0 auto" }}>
      {/* Question card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 32,
          boxShadow: "0 8px 24px rgba(53,37,205,0.06)",
          border: "1px solid #e4e1ee",
          padding: "32px 32px 28px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        {/* Decorative blur */}
        <div
          style={{
            position: "absolute",
            top: -48,
            right: -48,
            width: 192,
            height: 192,
            background: "#e2dfff",
            borderRadius: "50%",
            filter: "blur(48px)",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
        <span style={{ fontSize: 32, display: "block", marginBottom: 16 }}>❓</span>
        <h2
          style={{
            fontSize: "clamp(17px, 3vw, 22px)",
            fontWeight: 600,
            color: "#1b1b24",
            lineHeight: 1.4,
            margin: 0,
          }}
          dangerouslySetInnerHTML={{
            __html: question.question_text
              ? question.question_text.replace(
                  /'([^']+)'/g,
                  (_, w) => `'<strong style="color:#3525cd">${w}</strong>'`
                )
              : "",
          }}
        />
      </div>

      {/* Answer options grid: 2 col desktop, 1 col mobile */}
      {answers.length === 0 ? (
        <p style={{ color: "#777587", textAlign: "center", fontSize: 14 }}>
          Câu hỏi này không có đáp án.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {answers.map((answer) => {
            const isSelected = selectedId === answer.id;
            return (
              <button
                key={answer.id}
                onClick={() => handleSelect(answer.id)}
                style={{
                  width: "100%",
                  padding: "20px 20px",
                  borderRadius: 12,
                  border: `2px solid ${isSelected ? "#3525cd" : "#c7c4d8"}`,
                  background: isSelected ? "rgba(53,37,205,0.06)" : "#ffffff",
                  color: "#1b1b24",
                  fontSize: 16,
                  lineHeight: 1.6,
                  fontWeight: 400,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  minHeight: 64,
                  transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                  boxShadow: isSelected ? "none" : "0 2px 8px rgba(0,0,0,0.02)",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "rgba(53,37,205,0.5)";
                    e.currentTarget.style.background = "#f5f2ff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "#c7c4d8";
                    e.currentTarget.style.background = "#ffffff";
                  }
                }}
              >
                <span style={{ flex: 1 }}>{answer.answer_text}</span>
                {/* Radio icon */}
                <span
                  style={{
                    fontSize: 20,
                    color: isSelected ? "#3525cd" : "#c7c4d8",
                    flexShrink: 0,
                  }}
                >
                  {isSelected ? "●" : "○"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Next button */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #e4e1ee" }}>
        <button
          onClick={handleNext}
          disabled={!selectedId}
          style={{
            padding: "14px 40px",
            borderRadius: 12,
            border: "none",
            background: selectedId ? "#3525cd" : "#e4e1ee",
            color: selectedId ? "#ffffff" : "#777587",
            fontSize: 18,
            fontWeight: 600,
            cursor: selectedId ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 52,
            boxShadow: selectedId ? "0 4px 12px rgba(53,37,205,0.3)" : "none",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}
