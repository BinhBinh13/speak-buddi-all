// src/features/onboarding/components/TopicStep.jsx
// ─── Bước 2: Chọn chủ đề học (multi-select chip) — load từ API (S2.1) ─────────
import { useState } from "react";

// Design tokens
const PRIMARY            = "#3525cd";
const SURFACE_CARD       = "#ffffff";
const SURFACE_LOW        = "#f5f2ff";
const SURFACE_BORDER     = "#c7c4d8";
const SURFACE_VARIANT    = "#e4e1ee";
const ON_SURFACE         = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const ERROR_TEXT         = "#93000a";
const FONT               = "'Be Vietnam Pro', system-ui, sans-serif";

// Skeleton chip component
const PULSE_STYLE = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
`;

function SkeletonChip() {
  return (
    <>
      <style>{PULSE_STYLE}</style>
      <div
        style={{
          height: 40,
          borderRadius: 9999,
          background: SURFACE_VARIANT,
          animation: "pulse 1.4s ease-in-out infinite",
          minWidth: 80,
        }}
      />
    </>
  );
}

export default function TopicStep({ topics, selected, onChange, loading, error, onRetry }) {
  const [hoverId, setHoverId] = useState(null);

  function toggleTopic(slug) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  return (
    <div>
      {/* Heading */}
      <h1
        style={{
          fontFamily: FONT,
          fontSize: "clamp(22px, 5vw, 30px)",
          fontWeight: 700,
          textAlign: "center",
          color: ON_SURFACE,
          marginBottom: 8,
        }}
      >
        Bạn muốn học chủ đề gì?
      </h1>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 16,
          color: ON_SURFACE_VARIANT,
          textAlign: "center",
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        Chọn ít nhất một chủ đề để cá nhân hóa nội dung học.
      </p>

      {/* Error state */}
      {error && (
        <div
          style={{
            textAlign: "center",
            color: ERROR_TEXT,
            fontFamily: FONT,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: "0 0 8px" }}>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: "none",
              border: `1px solid ${PRIMARY}`,
              borderRadius: 8,
              color: PRIMARY,
              padding: "6px 16px",
              fontFamily: FONT,
              fontSize: 13,
              cursor: "pointer",
              minHeight: 36,
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Chip grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <SkeletonChip key={i} />
            ))
          : topics.map((topic) => {
              const isSelected = selected.includes(topic.slug);
              const isHovered  = hoverId === topic.slug;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => toggleTopic(topic.slug)}
                  onMouseEnter={() => setHoverId(topic.slug)}
                  onMouseLeave={() => setHoverId(null)}
                  aria-pressed={isSelected}
                  style={{
                    padding: "8px 18px",
                    minHeight: 44,
                    borderRadius: 9999,
                    border: `2px solid ${isSelected ? PRIMARY : SURFACE_BORDER}`,
                    background: isSelected
                      ? SURFACE_LOW
                      : isHovered
                      ? "#f0ecf9"
                      : SURFACE_CARD,
                    color: isSelected ? PRIMARY : ON_SURFACE_VARIANT,
                    fontFamily: FONT,
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s, color 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={PRIMARY}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                  {topic.name}
                </button>
              );
            })}
      </div>

      {/* Empty state */}
      {!loading && !error && topics.length === 0 && (
        <p
          style={{
            textAlign: "center",
            color: ON_SURFACE_VARIANT,
            fontFamily: FONT,
            fontSize: 14,
            marginTop: 16,
          }}
        >
          Chưa có chủ đề nào cho level này.
        </p>
      )}

      {/* Selected count hint */}
      {selected.length > 0 && (
        <p
          style={{
            textAlign: "center",
            color: PRIMARY,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            marginTop: 16,
          }}
        >
          Đã chọn {selected.length} chủ đề
        </p>
      )}
    </div>
  );
}
