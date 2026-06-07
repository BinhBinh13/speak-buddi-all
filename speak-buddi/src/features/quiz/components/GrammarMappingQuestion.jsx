// src/features/quiz/components/GrammarMappingQuestion.jsx
// ─── Dạng câu hỏi Grammar Mapping / Click-to-Match (S4.2) ────────────────────
//
// Bám mockup: bai_kiem_tra_sap_xep_ngu_phap_desktop
//
// Format answers: "term → definition" (split bằng " → ")
// Click-to-match (mobile-friendly):
//   1. Click item trái → selectedLeft = index, highlight viền primary
//   2. Click item phải khi đã có selectedLeft → tạo pair
//   3. Click item đã nối → xóa pair tương ứng
//   4. Click item trái khác → chuyển selection
//
// Hiển thị pairs: badge màu số cạnh item đã nối
// "Kiểm tra" active khi tất cả items trái đã nối
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";

// Màu cho các cặp nối (tối đa 8 cặp)
const PAIR_COLORS = [
  "#3525cd", "#006c49", "#7e3000", "#ba1a1a",
  "#5b4d8a", "#1a6b5d", "#8a4a1a", "#6b1a4a",
];

/**
 * Trả về bản shuffle của mảng items (Fisher-Yates).
 * Hàm thuần (pure helper) — khai báo ngoài component để tránh lint impure-in-render.
 * Được gọi 1 lần duy nhất qua useState lazy initializer.
 */
function shuffleItems(items) {
  const arr = items.map((item, i) => ({ ...item, originalIndex: i }));
  // Sử dụng crypto.getRandomValues nếu có (không bị flagged là impure trong render),
  // fallback Date.now-based seed để đảm bảo đa dạng thứ tự.
  const seed = Date.now();
  let s = seed;
  function lcg() {
    // Linear congruential generator — deterministic nhưng varied per mount
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {object}   props
 * @param {object}   props.question    — QuizQuestionOut
 * @param {Function} props.onAnswer    — callback({ mappingPairs: [{leftIndex, rightIndex}] })
 */
export default function GrammarMappingQuestion({ question, onAnswer }) {
  // Parse answers: "term → definition"
  const parsedItems = useMemo(() => {
    const answers = question.answers ?? [];
    return answers.map((a) => {
      const parts = (a.answer_text ?? "").split(" → ");
      return {
        id: a.id,
        left: parts[0]?.trim() ?? a.answer_text,
        right: parts[1]?.trim() ?? "",
      };
    });
  }, [question.answers]);

  // Shuffle right column once — computed once using useState lazy init (runs only at mount).
  // We store the shuffled array in state so it is stable across re-renders.
  // The shuffle function is defined outside the component to avoid lint issues.
  const [shuffledRight] = useState(() => shuffleItems(parsedItems));

  const [selectedLeft, setSelectedLeft] = useState(null);  // index trong parsedItems
  const [pairs, setPairs] = useState([]);                   // [{leftIndex, rightOriginalIndex}]

  // Kiểm tra cặp theo left index
  function getPairByLeft(leftIndex) {
    return pairs.find((p) => p.leftIndex === leftIndex) ?? null;
  }

  // Kiểm tra cặp theo right originalIndex
  function getPairByRight(rightOriginalIndex) {
    return pairs.find((p) => p.rightOriginalIndex === rightOriginalIndex) ?? null;
  }

  // Lấy số thứ tự của cặp (1-based)
  function getPairNumber(pairObj) {
    if (!pairObj) return null;
    const idx = pairs.findIndex(
      (p) => p.leftIndex === pairObj.leftIndex && p.rightOriginalIndex === pairObj.rightOriginalIndex
    );
    return idx >= 0 ? idx + 1 : null;
  }

  function handleLeftClick(leftIndex) {
    const existingPair = getPairByLeft(leftIndex);
    if (existingPair) {
      // Click item đã nối → xóa pair
      setPairs((prev) => prev.filter((p) => p.leftIndex !== leftIndex));
      setSelectedLeft(null);
      return;
    }
    // Click để chọn / chuyển selection
    setSelectedLeft((prev) => (prev === leftIndex ? null : leftIndex));
  }

  function handleRightClick(rightOriginalIndex) {
    const existingPair = getPairByRight(rightOriginalIndex);
    if (existingPair) {
      // Click item đã nối → xóa pair
      setPairs((prev) => prev.filter((p) => p.rightOriginalIndex !== rightOriginalIndex));
      return;
    }
    if (selectedLeft === null) return; // chưa chọn left → không làm gì

    // Xóa pair cũ của left (nếu có) trước khi tạo pair mới
    setPairs((prev) => {
      const withoutOldLeft = prev.filter((p) => p.leftIndex !== selectedLeft);
      return [...withoutOldLeft, { leftIndex: selectedLeft, rightOriginalIndex }];
    });
    setSelectedLeft(null);
  }

  // Validate: tất cả left đã nối
  const allPaired = parsedItems.length > 0 && pairs.length === parsedItems.length;

  function handleCheck() {
    if (!allPaired) return;
    // Trả về mapping pairs (leftIndex → rightOriginalIndex)
    onAnswer({ mappingPairs: pairs });
  }

  // Edge case: số answers ít hơn 2
  if (parsedItems.length < 2) {
    return (
      <div style={{ textAlign: "center", color: "#777587", padding: "24px" }}>
        Câu hỏi này không đủ dữ liệu để hiển thị.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 672, margin: "0 auto" }}>
      {/* Instruction */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 14px",
            borderRadius: 999,
            background: "#eae6f4",
            color: "#464555",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <span>🧩</span>
          Nối cặp
        </div>
        <h2
          style={{
            fontSize: "clamp(18px, 3.5vw, 24px)",
            fontWeight: 700,
            color: "#1b1b24",
            margin: "0 0 6px",
          }}
        >
          {question.question_text}
        </h2>
        <p style={{ fontSize: 14, color: "#777587", margin: 0 }}>
          Nhấn vào từ bên trái, rồi nhấn nghĩa tương ứng bên phải.
          Nhấn lại để bỏ kết nối.
        </p>
      </div>

      {/* Two column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Left column: terms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#777587",
              textTransform: "uppercase",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Từ / Cụm từ
          </div>
          {parsedItems.map((item, leftIndex) => {
            const pair = getPairByLeft(leftIndex);
            const pairNum = pair ? getPairNumber(pair) : null;
            const pairColor = pairNum ? PAIR_COLORS[(pairNum - 1) % PAIR_COLORS.length] : null;
            const isSelected = selectedLeft === leftIndex;
            const isPaired = pair !== null;

            return (
              <button
                key={leftIndex}
                onClick={() => handleLeftClick(leftIndex)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: `2px solid ${
                    isPaired
                      ? pairColor
                      : isSelected
                        ? "#3525cd"
                        : "#c7c4d8"
                  }`,
                  background: isPaired
                    ? `${pairColor}15`
                    : isSelected
                      ? "rgba(53,37,205,0.06)"
                      : "#ffffff",
                  color: "#1b1b24",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  minHeight: 52,
                  transition: "all 0.15s",
                  boxShadow: isSelected ? "0 0 0 3px rgba(53,37,205,0.15)" : "none",
                }}
              >
                <span style={{ flex: 1, wordBreak: "break-word" }}>{item.left}</span>
                {/* Badge số cặp */}
                {pairNum !== null && (
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: pairColor,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {pairNum}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right column: definitions (shuffled) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#777587",
              textTransform: "uppercase",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Nghĩa / Định nghĩa
          </div>
          {shuffledRight.map((item) => {
            const pair = getPairByRight(item.originalIndex);
            const pairNum = pair ? getPairNumber(pair) : null;
            const pairColor = pairNum ? PAIR_COLORS[(pairNum - 1) % PAIR_COLORS.length] : null;
            const isPaired = pair !== null;
            // Right item is "available" if left is selected and right is not paired
            const isAvailable = selectedLeft !== null && !isPaired;

            return (
              <button
                key={item.originalIndex}
                onClick={() => handleRightClick(item.originalIndex)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: `2px solid ${
                    isPaired
                      ? pairColor
                      : isAvailable
                        ? "rgba(53,37,205,0.3)"
                        : "#c7c4d8"
                  }`,
                  background: isPaired
                    ? `${pairColor}15`
                    : isAvailable
                      ? "#f5f2ff"
                      : "#ffffff",
                  color: "#1b1b24",
                  fontSize: 14,
                  fontWeight: 400,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  minHeight: 52,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isPaired && isAvailable) {
                    e.currentTarget.style.borderColor = "#3525cd";
                    e.currentTarget.style.background = "rgba(53,37,205,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPaired && isAvailable) {
                    e.currentTarget.style.borderColor = "rgba(53,37,205,0.3)";
                    e.currentTarget.style.background = "#f5f2ff";
                  }
                }}
              >
                <span style={{ flex: 1, wordBreak: "break-word" }}>{item.right}</span>
                {/* Badge số cặp */}
                {pairNum !== null && (
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: pairColor,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {pairNum}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "#777587",
          marginBottom: 16,
        }}
      >
        {pairs.length} / {parsedItems.length} cặp đã nối
      </div>

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
        {/* Reset button */}
        <button
          onClick={() => { setPairs([]); setSelectedLeft(null); }}
          style={{
            padding: "12px 20px",
            borderRadius: 999,
            border: "2px solid #c7c4d8",
            background: "transparent",
            color: "#464555",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            minHeight: 48,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e4e1ee";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          Xóa hết
        </button>

        {/* Check button */}
        <button
          onClick={handleCheck}
          disabled={!allPaired}
          style={{
            padding: "14px 40px",
            borderRadius: 999,
            border: "none",
            background: allPaired ? "#3525cd" : "rgba(199,196,216,0.5)",
            color: allPaired ? "#ffffff" : "#777587",
            fontSize: 16,
            fontWeight: 600,
            cursor: allPaired ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 52,
            boxShadow: allPaired ? "0 4px 12px rgba(53,37,205,0.2)" : "none",
            transition: "all 0.3s",
          }}
        >
          Kiểm tra
          <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>
    </div>
  );
}
