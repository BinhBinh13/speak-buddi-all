// src/features/vocabulary/components/TopicCard.jsx
// ─── Card chọn topic trong màn hình Vocabulary (S3.2) ────────────────────────
//
// Bám mockup: hoc_tu_vung_desktop (layout + màu từ DESIGN.md)
// Props:
//   topic  — { id, name, level_id, slug, description, word_count, ... }
//   level  — { id, code, name } — level object để hiện badge
//   onClick — callback khi chọn topic
// ─────────────────────────────────────────────────────────────────────────────

import { BsArrowRight } from "react-icons/bs";

/**
 * Badge màu theo level CEFR (DESIGN.md — CEFR Levels badge).
 * Primary indigo #3525cd cho A1–B1; Secondary emerald cho B2–C2.
 */
function LevelBadge({ code }) {
  const colorMap = {
    A1: { bg: "#EEF2FF", color: "#3525cd" },
    A2: { bg: "#EEF2FF", color: "#3525cd" },
    B1: { bg: "#EEF2FF", color: "#3525cd" },
    B2: { bg: "#ECFDF5", color: "#006c49" },
    C1: { bg: "#ECFDF5", color: "#006c49" },
    C2: { bg: "#EDE9FE", color: "#4C1D95" },
  };
  const { bg, color } = colorMap[code] ?? { bg: "#EEF2FF", color: "#3525cd" };
  return (
    <span
      className="badge rounded-pill fw-semibold"
      style={{
        background: bg,
        color,
        fontSize: 11,
        letterSpacing: "0.05em",
        padding: "4px 10px",
      }}
    >
      {code}
    </span>
  );
}

export default function TopicCard({ topic, level, onClick }) {
  const levelCode = level?.code ?? "";

  return (
    <button
      className="d-flex align-items-center justify-content-between w-100 text-start"
      onClick={() => onClick(topic)}
      style={{
        background: "#ffffff",
        border: "1px solid #e4e1ee",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        cursor: "pointer",
        transition: "box-shadow 0.2s, border-color 0.2s",
        minHeight: 80,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(53,37,205,0.10)";
        e.currentTarget.style.borderColor = "#c3c0ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "#e4e1ee";
      }}
    >
      {/* Left: info */}
      <div className="d-flex flex-column gap-1" style={{ flex: 1, minWidth: 0 }}>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span
            className="fw-semibold text-truncate"
            style={{ fontSize: 16, color: "#1b1b24", lineHeight: 1.4 }}
          >
            {topic.name}
          </span>
          {levelCode && <LevelBadge code={levelCode} />}
        </div>
        {topic.description && (
          <span
            className="text-truncate"
            style={{ fontSize: 13, color: "#464555", lineHeight: 1.4 }}
          >
            {topic.description}
          </span>
        )}
        <span style={{ fontSize: 13, color: "#777587", marginTop: 2 }}>
          {topic.word_count ?? 0} từ
        </span>
      </div>

      {/* Right: arrow */}
      <BsArrowRight
        size={18}
        style={{ color: "#3525cd", flexShrink: 0, marginLeft: 12 }}
      />
    </button>
  );
}
