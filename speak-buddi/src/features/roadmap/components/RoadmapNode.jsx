// src/features/roadmap/components/RoadmapNode.jsx
// ─── Một node tròn trong snake roadmap (S2.4) ────────────────────────────────
// Mockup: lo_trinh_hoc_tap_snake_style (node circles)
// Design system: DESIGN.md

// ── Design tokens ─────────────────────────────────────────────────────────────
const SECONDARY        = "#006c49";
const SURFACE          = "#fcf8ff";
const SURFACE_VARIANT  = "#e4e1ee";
const FONT             = "'Be Vietnam Pro', system-ui, sans-serif";

// ── Palette màu sáng — dùng cho node is_interest=true hoặc completed ──────────
const BRIGHT_COLORS = ["#4f46e5", "#0ea5e9", "#8b5cf6", "#06b6d4", "#3525cd", "#7c3aed"];

// ── Màu nhạt — dùng cho node chưa được chọn và chưa hoàn thành ─────────────────
const MUTED_BG    = "#e4e1ee";   // surface-variant
const MUTED_FG    = "#777587";   // on-surface-variant nhạt
const MUTED_BORDER = "#c7c4d8";  // outline-variant

/**
 * Quy tắc màu roadmap:
 *   1. completed              → màu sáng (palette xoay vòng) — đã học xong
 *   2. is_interest = true     → màu sáng (palette xoay vòng) — user đã chọn
 *   3. is_interest = false
 *      && not completed       → màu nhạt (muted)             — chưa chọn / chưa học
 *
 * Trường hợp 1+2 dùng chung BRIGHT_COLORS; 3 dùng MUTED.
 */
function getNodeStyle(status, isInterest, index) {
  const isBright = isInterest || status === "completed" || status === "in_progress";

  if (status === "in_progress") {
    return {
      background: "#f59e0b",
      color: "#ffffff",
      boxShadow: "0 0 0 6px #fcf8ff, 0 0 0 10px rgba(245,158,11,0.3)",
      opacity: 1,
      filter: "none",
    };
  }

  if (status === "locked") {
    return {
      background: MUTED_BG,
      color: MUTED_FG,
      border: `4px solid ${MUTED_BORDER}`,
      opacity: 0.55,
      filter: "grayscale(0.5)",
    };
  }

  if (isBright) {
    return {
      background: BRIGHT_COLORS[index % BRIGHT_COLORS.length],
      color: "#ffffff",
      opacity: 1,
      filter: "none",
    };
  }

  // Muted — chưa chọn, chưa học
  return {
    background: MUTED_BG,
    color: MUTED_FG,
    border: `2px solid ${MUTED_BORDER}`,
    opacity: 0.85,
    filter: "none",
  };
}

// ── Icon topic (fallback đơn giản — dùng react-icons không có trong mockup) ──
// react-icons/bs đã cài trong project; chọn icon gần nghĩa nhất
function NodeIcon({ status }) {
  // SVG inline đơn giản để tránh import phức tạp trong component nhỏ
  if (status === "completed") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
    );
  }
  if (status === "locked") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
    );
  }
  // available / in_progress — book icon
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
    </svg>
  );
}

/**
 * RoadmapNode — Một node tròn trong snake path
 *
 * Props:
 *   node       RoadmapNode  — data từ API
 *   index      number       — vị trí trong danh sách (dùng chọn màu + side)
 *   isLast     boolean      — node cuối cùng (không vẽ connector)
 */
/**
 * RoadmapNode — chỉ render vòng tròn node (label được render bên ngoài bởi RoadmapPath)
 *
 * Props:
 *   node     — roadmap node data
 *   index    — vị trí trong list (chọn màu)
 *   onClick  — callback khi click node không bị locked
 */
export default function RoadmapNode({ node, index, onClick }) {
  const nodeStyle = getNodeStyle(node.status, node.is_interest, index);
  const isCompleted   = node.status === "completed";
  const isInProgress  = node.status === "in_progress";
  const isLocked      = node.status === "locked";
  const isInterest    = node.is_interest;

  return (
    <div
      style={{
        display: "inline-flex",
        fontFamily: FONT,
        cursor: isLocked ? "default" : "pointer",
        userSelect: "none",
        position: "relative",
      }}
      aria-label={`${node.name} — ${node.status}`}
    >
      {/* Node tròn */}
      <div
        role={isLocked ? undefined : "button"}
        tabIndex={isLocked ? undefined : 0}
        onClick={isLocked ? undefined : onClick}
        onKeyDown={isLocked ? undefined : (e) => {
          if (e.key === "Enter" || e.key === " ") onClick?.();
        }}
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "transform 0.2s, box-shadow 0.2s",
          flexShrink: 0,
          // Touch target ≥ 44px — node 96px đã đảm bảo
          ...nodeStyle,
          boxShadow: nodeStyle.boxShadow || "0 4px 16px rgba(0,0,0,0.15)",
        }}
        onMouseEnter={(e) => {
          if (!isLocked) e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {/* Icon topic */}
        <NodeIcon status={node.status} />

        {/* Badge trạng thái (completed → check, locked → lock) */}
        {isCompleted && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: SECONDARY,
              border: `3px solid ${SURFACE}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-hidden="true"
          >
            {/* Check mark */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        )}

        {isLocked && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: SURFACE_VARIANT,
              border: `3px solid ${SURFACE}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-hidden="true"
          >
            {/* Lock icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#777587">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
        )}

        {/* Badge sao — đánh dấu topic user đã chọn (chỉ hiện khi node màu nhạt để phân biệt) */}
        {isInProgress && !isCompleted && !isLocked && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#f59e0b",
              border: `3px solid ${SURFACE}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Đang học chủ đề này"
            aria-hidden="true"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )}

        {isInterest && !isCompleted && !isInProgress && !isLocked && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#f59e0b",
              border: `3px solid ${SURFACE}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Bạn đã chọn chủ đề này"
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </div>
        )}
      </div>

    </div>
  );
}
