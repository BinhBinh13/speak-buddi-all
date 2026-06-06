// src/features/quiz/components/FlashcardQuestion.jsx
// ─── Dạng câu hỏi Flashcard (S4.2) ───────────────────────────────────────────
//
// Bám mockup: bai_kiem_tra_flashcard_desktop
// - Mặt trước: từ (display lớn) + phonetic + icon tap
// - Mặt sau: nghĩa tiếng Việt (primary) + ví dụ
// - 3D flip animation: CSS perspective + rotateY(180deg)
// - Sau flip: 2 nút "Không biết" + "Đã biết"
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

/**
 * @param {object}   props
 * @param {object}   props.question   — QuizQuestionOut (question_text + answers[])
 * @param {Function} props.onAnswer   — callback({ selfRating: 'known'|'unknown' })
 */
export default function FlashcardQuestion({ question, onAnswer }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Lấy nghĩa tiếng Việt từ answers (nếu có answer is_correct=true)
  // Hoặc parse từ question_text nếu không có answers
  const correctAnswer = question.answers?.find((a) => a.is_correct);
  const meaningVi = correctAnswer?.answer_text ?? null;

  // Tách question_text: "word|phonetic|meaning|example" nếu được encode như vậy
  // Thực tế question_text = từ tiếng Anh (word)
  const wordText = question.question_text;

  function handleFlip(e) {
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  }

  function handleAnswer(rating) {
    onAnswer({ selfRating: rating });
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
    >
      {/* ── Stacked card + 3D flip container ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          perspective: 1000,
          cursor: "pointer",
        }}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleFlip(e); }}
        aria-label={isFlipped ? "Ẩn nghĩa" : "Lật thẻ xem nghĩa"}
      >
        {/* Stack effect — card 2 (back) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#e4e1ee",
            borderRadius: 24,
            transform: "translateY(8px) scale(0.9)",
            zIndex: 0,
          }}
        />
        {/* Stack effect — card 1 (middle) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#eae6f4",
            borderRadius: 24,
            transform: "translateY(4px) scale(0.95)",
            zIndex: 1,
          }}
        />

        {/* ── The actual flashcard (3D flip) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            zIndex: 10,
          }}
        >
          {/* FRONT FACE */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "#ffffff",
              borderRadius: 24,
              boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
              border: "1px solid rgba(199,196,216,0.3)",
              display: "flex",
              flexDirection: "column",
              padding: "24px 28px",
            }}
          >
            {/* Top: grammar tag placeholder */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: "#464555",
                  background: "#e4e1ee",
                  borderRadius: 8,
                  padding: "3px 10px",
                }}
              >
                EN
              </span>
            </div>

            {/* Core: word + phonetic */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 12,
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(32px, 8vw, 52px)",
                  fontWeight: 700,
                  color: "#1b1b24",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                {wordText}
              </h2>
            </div>

            {/* Bottom: tap hint */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                color: "rgba(70,69,85,0.4)",
                fontSize: 13,
                gap: 6,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 18 }}>👆</span>
              <span>Nhấn để lật thẻ</span>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#ffffff",
              borderRadius: 24,
              boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
              border: "1px solid rgba(53,37,205,0.2)",
              display: "flex",
              flexDirection: "column",
              padding: "24px 28px",
              overflow: "hidden",
            }}
          >
            {/* Decorative element */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 28, color: "rgba(53,37,205,0.15)", userSelect: "none" }}>
                🌐
              </span>
            </div>

            {/* Core: meaning */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 16,
              }}
            >
              {meaningVi ? (
                <>
                  <h2
                    style={{
                      fontSize: "clamp(24px, 6vw, 36px)",
                      fontWeight: 700,
                      color: "#3525cd",
                      margin: 0,
                      lineHeight: 1.25,
                    }}
                  >
                    {meaningVi}
                  </h2>
                </>
              ) : (
                <p style={{ color: "#777587", fontSize: 15, margin: 0 }}>
                  Không có nghĩa tiếng Việt.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action buttons (hiện sau khi flip) ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          gap: 12,
          transition: "opacity 0.3s, transform 0.3s",
          opacity: isFlipped ? 1 : 0,
          transform: isFlipped ? "scale(1)" : "scale(0.95)",
          pointerEvents: isFlipped ? "auto" : "none",
        }}
      >
        {/* Không biết */}
        <button
          onClick={(e) => { e.stopPropagation(); handleAnswer("unknown"); }}
          style={{
            flex: 1,
            padding: "16px 12px",
            borderRadius: 16,
            border: "2px solid #c7c4d8",
            background: "#ffffff",
            color: "#464555",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 52,
            transition: "border-color 0.15s, background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#7e3000";
            e.currentTarget.style.background = "#fff8f5";
            e.currentTarget.style.color = "#7e3000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#c7c4d8";
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.color = "#464555";
          }}
        >
          <span style={{ fontSize: 16 }}>🔄</span>
          Cần ôn lại
        </button>

        {/* Đã biết */}
        <button
          onClick={(e) => { e.stopPropagation(); handleAnswer("known"); }}
          style={{
            flex: 1,
            padding: "16px 12px",
            borderRadius: 16,
            border: "none",
            background: "#3525cd",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 52,
            boxShadow: "0 4px 14px rgba(53,37,205,0.3)",
            transition: "background 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2a1fb0";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(53,37,205,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#3525cd";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(53,37,205,0.3)";
          }}
        >
          <span style={{ fontSize: 16 }}>✓</span>
          Đã biết
        </button>
      </div>

      {/* Flip hint khi chưa lật */}
      {!isFlipped && (
        <div
          style={{
            width: "100%",
          }}
        >
          <button
            onClick={handleFlip}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 16,
              border: "none",
              background: "#e4e1ee",
              color: "#464555",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 52,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#c7c4d8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#e4e1ee"; }}
          >
            <span style={{ fontSize: 16 }}>🔄</span>
            Nhấn để lật thẻ xem nghĩa
          </button>
        </div>
      )}
    </div>
  );
}
