// src/features/roadmap/components/RoadmapEmptyState.jsx
// ─── Empty state khi nodes=[] (AC-04-04) (S2.4) ──────────────────────────────
// Hiển thị khi level không có topic active — không xóa header level
// Design system: DESIGN.md

import { useNavigate } from "react-router-dom";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY          = "#3525cd";
const ON_SURFACE       = "#1b1b24";
const ON_SURFACE_VAR   = "#464555";
const FONT             = "'Be Vietnam Pro', system-ui, sans-serif";

/**
 * RoadmapEmptyState — khi không có topic nào (AC-04-04)
 *
 * Props:
 *   level  string  — vd "B1" (để hiển thị context trong message)
 */
export default function RoadmapEmptyState({ level }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "#e2dfff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        {/* Map icon */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill={PRIMARY}>
          <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
        </svg>
      </div>

      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: ON_SURFACE,
          marginBottom: 8,
        }}
      >
        Chưa có chủ đề nào
      </h2>

      <p
        style={{
          fontSize: 15,
          color: ON_SURFACE_VAR,
          lineHeight: 1.6,
          maxWidth: 360,
          margin: "0 0 28px",
        }}
      >
        Chưa có chủ đề nào được kích hoạt cho trình độ{" "}
        <strong>{level}</strong> của bạn. Bạn có thể thử cập nhật trình độ
        hoặc quay lại sau khi Admin cập nhật nội dung.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {/* CTA: cập nhật level / profile */}
        <button
          onClick={() => navigate("/profile")}
          style={{
            padding: "12px 28px",
            borderRadius: 12,
            border: "none",
            background: PRIMARY,
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 44,
            boxShadow: "0 4px 14px rgba(53,37,205,0.3)",
            transition: "background 0.15s",
            fontFamily: FONT,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#2a1eb0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = PRIMARY; }}
        >
          {/* Settings icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
          Cập nhật trình độ
        </button>
      </div>
    </div>
  );
}
