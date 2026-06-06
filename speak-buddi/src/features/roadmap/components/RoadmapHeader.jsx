// src/features/roadmap/components/RoadmapHeader.jsx
// ─── Header màn hình Roadmap: level name + progress summary (S2.4) ────────────
// Mockup: lo_trinh_hoc_tap_snake_style (phần Page Header)
// Design system: DESIGN.md (primary #3525cd, secondary #006c49, font Be Vietnam Pro)

// ── Design tokens (bám DESIGN.md) ────────────────────────────────────────────
const PRIMARY          = "#3525cd";
const SECONDARY        = "#006c49";
const ON_SURFACE       = "#1b1b24";
const ON_SURFACE_VAR   = "#464555";
const OUTLINE_VARIANT  = "#c7c4d8";
const FONT             = "'Be Vietnam Pro', system-ui, sans-serif";

/**
 * RoadmapHeader — Tiêu đề + mô tả + chip level + progress bar selected/total
 *
 * Props:
 *   level        string   — vd "B1"
 *   level_name   string   — vd "Intermediate (B1)"
 *   total        number   — total_topics
 *   selected     number   — selected_topics (user đã chọn khi onboarding)
 */
export default function RoadmapHeader({ level, level_name, total, selected }) {
  const progressPct = total > 0 ? Math.round((selected / total) * 100) : 0;

  return (
    <div
      style={{
        marginBottom: 32,
        fontFamily: FONT,
      }}
    >
      {/* Tiêu đề chính — bám mockup "Lộ trình của bạn — {level_name}" */}
      <h1
        style={{
          fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 700,
          color: ON_SURFACE,
          marginBottom: 8,
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
        }}
      >
        Lộ trình của bạn —{" "}
        <span style={{ color: PRIMARY }}>{level_name || `Level ${level}`}</span>
      </h1>

      {/* Mô tả phụ */}
      <p
        style={{
          fontSize: "clamp(13px, 3.5vw, 16px)",
          lineHeight: 1.6,
          color: ON_SURFACE_VAR,
          margin: "0 0 20px",
          maxWidth: 640,
        }}
      >
        Tiếp tục hành trình chinh phục tiếng Anh. Hoàn thành các chủ đề dưới
        đây để nâng cấp kỹ năng giao tiếp thực tế của bạn.
      </p>

      {/* Chip level + progress summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Level badge */}
        <span
          style={{
            background: PRIMARY,
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            borderRadius: 999,
            padding: "4px 14px",
          }}
        >
          {level}
        </span>

        {/* Topic count */}
        <span
          style={{
            fontSize: 13,
            color: ON_SURFACE_VAR,
            fontWeight: 500,
          }}
        >
          {selected}/{total} chủ đề đã chọn
        </span>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ marginTop: 12, maxWidth: "min(400px, 100%)" }}>
          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 999,
              background: OUTLINE_VARIANT,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: SECONDARY,
                borderRadius: 999,
                transition: "width 0.5s ease-out",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 12,
              color: SECONDARY,
              fontWeight: 600,
              marginTop: 4,
              textAlign: "right",
              maxWidth: 400,
            }}
          >
            {progressPct}% đã chọn
          </div>
        </div>
      )}
    </div>
  );
}
