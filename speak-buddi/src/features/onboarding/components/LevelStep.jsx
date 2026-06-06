// src/features/onboarding/components/LevelStep.jsx
// ─── Bước 1: Chọn trình độ CEFR A1–C2 (S2.1) ─────────────────────────────────
// Mockup tham chiếu: onboarding_chon_trinh_do_desktop/code.html

// Design tokens
const PRIMARY            = "#3525cd";
const SURFACE_CARD       = "#ffffff";
const SURFACE_LOW        = "#f5f2ff";
const SURFACE_BORDER     = "#c7c4d8";
const ON_SURFACE         = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const FONT               = "'Be Vietnam Pro', system-ui, sans-serif";

// Badge màu theo CEFR
const BADGE_COLORS = {
  A1: { bg: "#e0f2fe", text: "#0284c7" },
  A2: { bg: "#dcfce7", text: "#166534" },
  B1: { bg: "#fef9c3", text: "#854d0e" },
  B2: { bg: "#fef9c3", text: "#a16207" },
  C1: { bg: "#f3e8ff", text: "#6b21a8" },
  C2: { bg: "#fce7f3", text: "#9d174d" },
};

const LEVELS = [
  { code: "A1", label: "Mới bắt đầu",  desc: "Chưa biết hoặc biết rất ít" },
  { code: "A2", label: "Cơ bản",        desc: "Biết một số từ, câu đơn giản" },
  { code: "B1", label: "Trung cấp",     desc: "Giao tiếp được trong tình huống thông thường" },
  { code: "B2", label: "Khá",           desc: "Tự tin nói chuyện, đọc hiểu tốt" },
  { code: "C1", label: "Nâng cao",      desc: "Diễn đạt linh hoạt, gần như thành thạo" },
  { code: "C2", label: "Thành thạo",    desc: "Sử dụng như người bản ngữ" },
];

function LevelCard({ item, selected, onSelect }) {
  const badge = BADGE_COLORS[item.code];
  const isSelected = selected === item.code;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.code)}
      aria-pressed={isSelected}
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        padding: "16px 20px",
        border: `2px solid ${isSelected ? PRIMARY : SURFACE_BORDER}`,
        borderRadius: 12,
        background: isSelected ? SURFACE_LOW : SURFACE_CARD,
        boxShadow: isSelected
          ? "0 8px 24px rgba(53,37,205,0.10)"
          : "0 4px 12px rgba(53,37,205,0.04)",
        cursor: "pointer",
        width: "100%",
        minHeight: 90,
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        fontFamily: FONT,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top row: badge + label + checkmark */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* CEFR badge */}
          <span
            style={{
              background: badge.bg,
              color: badge.text,
              padding: "2px 10px",
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {item.code}
          </span>
          {/* Friendly name */}
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: ON_SURFACE,
              lineHeight: 1.3,
            }}
          >
            {item.label}
          </span>
        </div>

        {/* Checkmark circle */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `2px solid ${isSelected ? PRIMARY : SURFACE_BORDER}`,
            background: isSelected ? PRIMARY : SURFACE_CARD,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "border-color 0.2s, background 0.2s",
          }}
        >
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: ON_SURFACE_VARIANT,
          lineHeight: 1.5,
        }}
      >
        {item.desc}
      </p>
    </button>
  );
}

export default function LevelStep({ value, onChange }) {
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
        Trình độ tiếng Anh hiện tại của bạn?
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
        Giúp chúng tôi tìm ra lộ trình học phù hợp nhất với bạn.
      </p>

      {/* Grid 2 cột trên tablet+, 1 cột trên mobile */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {LEVELS.map((item) => (
          <LevelCard
            key={item.code}
            item={item}
            selected={value}
            onSelect={onChange}
          />
        ))}
      </div>
    </div>
  );
}
