// src/features/quiz/components/FillBlankQuestion.jsx
// ─── Dạng câu hỏi Fill in the Blank (S4.2) ───────────────────────────────────
//
// Bám mockup: bai_kiem_tra_dien_tu_vao_cho_trong_desktop
// - Tách question_text theo "___" marker: prefix + blank input + suffix
// - Word bank: chips click để điền nhanh vào input
// - "Kiểm tra" disabled khi input rỗng
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";

/**
 * @param {object}   props
 * @param {object}   props.question   — QuizQuestionOut
 * @param {Function} props.onAnswer   — callback({ textAnswer })
 */
export default function FillBlankQuestion({ question, onAnswer }) {
  const [inputValue, setInputValue] = useState("");
  const [selectedChip, setSelectedChip] = useState(null);
  const inputRef = useRef(null);

  // Tách question_text theo "___"
  const text = question.question_text ?? "";
  const hasBlankMarker = text.includes("___");
  const parts = hasBlankMarker ? text.split("___") : [text, ""];
  const prefix = parts[0] ?? "";
  const suffix = parts.slice(1).join("___"); // giữ phần còn lại nếu có nhiều ___

  // Lấy tất cả answer_text làm word bank
  const wordBankWords = (question.answers ?? []).map((a) => a.answer_text).filter(Boolean);

  function handleChipClick(word) {
    setInputValue(word);
    setSelectedChip(word);
    inputRef.current?.focus();
  }

  function handleInputChange(e) {
    setInputValue(e.target.value);
    // Reset chip selection nếu user gõ tay
    if (e.target.value !== selectedChip) {
      setSelectedChip(null);
    }
  }

  function handleCheck() {
    if (!inputValue.trim()) return;
    onAnswer({ textAnswer: inputValue.trim() });
    setInputValue("");
    setSelectedChip(null);
  }

  const isActive = inputValue.trim().length > 0;

  return (
    <div style={{ width: "100%", maxWidth: 672, margin: "0 auto" }}>
      {/* Instruction */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#464555",
            margin: "0 0 6px",
          }}
        >
          Điền từ còn thiếu
        </h2>
        <p style={{ fontSize: 14, color: "#777587", margin: 0 }}>
          Gõ từ hoặc chọn từ gợi ý bên dưới.
        </p>
      </div>

      {/* Sentence card with blank */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 24,
          boxShadow: "0 4px 12px rgba(53,37,205,0.04)",
          border: "1px solid rgba(199,196,216,0.5)",
          padding: "32px 28px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px 12px",
          textAlign: "center",
        }}
      >
        {/* Prefix */}
        {prefix && (
          <span
            style={{
              fontSize: "clamp(20px, 4vw, 28px)",
              fontWeight: 700,
              color: "#1b1b24",
              lineHeight: 1.4,
            }}
          >
            {prefix.trim()}
          </span>
        )}

        {/* Blank input */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="______"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            style={{
              fontSize: "clamp(20px, 4vw, 28px)",
              fontWeight: 700,
              color: "#3525cd",
              textAlign: "center",
              background: "transparent",
              border: "none",
              borderBottom: `3px solid ${inputValue ? "#3525cd" : "#c7c4d8"}`,
              outline: "none",
              width: Math.max(140, inputValue.length * 18 + 40) + "px",
              maxWidth: "60vw",
              minWidth: 120,
              paddingBottom: 4,
              transition: "border-color 0.2s, width 0.1s",
              caretColor: "#3525cd",
            }}
            onFocus={(e) => {
              if (!inputValue) e.currentTarget.style.borderBottomColor = "#3525cd";
            }}
            onBlur={(e) => {
              if (!inputValue) e.currentTarget.style.borderBottomColor = "#c7c4d8";
            }}
          />
        </div>

        {/* Suffix */}
        {suffix && (
          <span
            style={{
              fontSize: "clamp(20px, 4vw, 28px)",
              fontWeight: 700,
              color: "#1b1b24",
              lineHeight: 1.4,
            }}
          >
            {suffix.trim()}
          </span>
        )}
      </div>

      {/* Word bank */}
      {wordBankWords.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {wordBankWords.map((word, idx) => {
            const isChipSelected = selectedChip === word;
            return (
              <button
                key={idx}
                onClick={() => handleChipClick(word)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 12,
                  border: `2px solid ${isChipSelected ? "#3525cd" : "rgba(199,196,216,0.6)"}`,
                  background: isChipSelected ? "rgba(53,37,205,0.08)" : "#f0ecf9",
                  color: "#1b1b24",
                  fontSize: "clamp(16px, 3vw, 22px)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  outline: isChipSelected ? "2px solid #3525cd" : "none",
                  outlineOffset: 2,
                  minHeight: 48,
                }}
                onMouseEnter={(e) => {
                  if (!isChipSelected) {
                    e.currentTarget.style.borderColor = "#c3c0ff";
                    e.currentTarget.style.background = "rgba(53,37,205,0.08)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(53,37,205,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isChipSelected) {
                    e.currentTarget.style.borderColor = "rgba(199,196,216,0.6)";
                    e.currentTarget.style.background = "#f0ecf9";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                  }
                }}
              >
                {word}
              </button>
            );
          })}
        </div>
      )}

      {/* Action row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 16,
          borderTop: "1px solid rgba(199,196,216,0.3)",
          gap: 12,
        }}
      >
        {/* Empty left spacer for layout balance */}
        <div />

        {/* Check button */}
        <button
          onClick={handleCheck}
          disabled={!isActive}
          style={{
            padding: "14px 48px",
            borderRadius: 999,
            border: "none",
            background: isActive ? "#3525cd" : "rgba(199,196,216,0.5)",
            color: isActive ? "#ffffff" : "#777587",
            fontSize: 18,
            fontWeight: 600,
            cursor: isActive ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 52,
            boxShadow: isActive ? "0 4px 12px rgba(53,37,205,0.2)" : "none",
            transition: "all 0.3s",
          }}
        >
          Kiểm tra →
        </button>
      </div>
    </div>
  );
}
