// src/features/quiz/components/QuizHeader.jsx
// ─── Header cho trang làm bài kiểm tra (S4.2) ────────────────────────────────
//
// Bám mockup: bai_kiem_tra_flashcard_desktop — task-focused header (suppressed global nav)
// Layout: [back button] [topic label + progress bar + X/N counter] [spacer]
// ─────────────────────────────────────────────────────────────────────────────

import { BsArrowLeft } from "react-icons/bs";

/**
 * @param {object} props
 * @param {string}   props.topicLabel    — tên chủ đề hiển thị
 * @param {number}   props.current       — chỉ số câu hiện tại (0-based)
 * @param {number}   props.total         — tổng số câu
 * @param {Function} props.onBack        — handler nút quay lại
 */
export default function QuizHeader({ topicLabel, current, total, onBack }) {
  const progressPct = total > 0 ? Math.round((current / total) * 100) : 0;
  const displayNum = Math.min(current + 1, total);

  return (
    <header
      style={{
        width: "100%",
        padding: "16px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        background: "rgba(252,248,255,0.9)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e4e1ee",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        aria-label="Quay lại"
        style={{
          width: 40,
          height: 40,
          minWidth: 40,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#464555",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#e4e1ee"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <BsArrowLeft size={20} />
      </button>

      {/* Center: label + progress + counter */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          padding: "0 8px",
          minWidth: 0,
        }}
      >
        {topicLabel && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#777587",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {topicLabel}
          </span>
        )}

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            maxWidth: 200,
            height: 6,
            borderRadius: 999,
            background: "#e4e1ee",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "#3525cd",
              borderRadius: 999,
              transition: "width 0.5s ease-out",
            }}
          />
        </div>

        {/* X / N counter */}
        {total > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#464555",
              letterSpacing: "0.03em",
            }}
          >
            {displayNum} / {total}
          </span>
        )}
      </div>

      {/* Spacer to balance back button */}
      <div style={{ width: 40, flexShrink: 0 }} />
    </header>
  );
}
