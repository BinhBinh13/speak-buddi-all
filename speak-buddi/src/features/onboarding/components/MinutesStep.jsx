// src/features/onboarding/components/MinutesStep.jsx
// ─── Bước 3: Chọn số phút học mỗi ngày (S2.1) ────────────────────────────────
// Mockup tham chiếu: onboarding_chon_muc_tieu_desktop (card option pattern)

// Design tokens
const PRIMARY            = "#3525cd";
const SURFACE_CARD       = "#ffffff";
const SURFACE_LOW        = "#f5f2ff";
const SURFACE_BORDER     = "#c7c4d8";
const ON_SURFACE         = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const FONT               = "'Be Vietnam Pro', system-ui, sans-serif";

const OPTIONS = [
  { value: 5,  label: "5 phút / ngày",  desc: "Thường xuyên — phù hợp người bận rộn" },
  { value: 10, label: "10 phút / ngày", desc: "Đều đặn — tiến bộ ổn định mỗi ngày" },
  { value: 15, label: "15 phút / ngày", desc: "Nghiêm túc — kết quả nhanh hơn" },
  { value: 20, label: "20 phút / ngày", desc: "Tận tâm — đạt mục tiêu sớm nhất" },
];

function OptionCard({ option, selected, onSelect }) {
  const isSelected = selected === option.value;

  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      aria-pressed={isSelected}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
        minHeight: 72,
        fontFamily: FONT,
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Text block */}
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: isSelected ? PRIMARY : ON_SURFACE,
            marginBottom: 4,
          }}
        >
          {option.label}
        </div>
        <div
          style={{
            fontSize: 13,
            color: ON_SURFACE_VARIANT,
            lineHeight: 1.5,
          }}
        >
          {option.desc}
        </div>
      </div>

      {/* Checkmark */}
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
          marginLeft: 12,
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        {isSelected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )}
      </div>
    </button>
  );
}

export default function MinutesStep({ value, onChange }) {
  return (
    <div>
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
        Bạn muốn học bao nhiêu phút mỗi ngày?
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
        Tính nhất quán quan trọng hơn số lượng. Chọn mục tiêu thực tế của bạn.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            option={opt}
            selected={value}
            onSelect={onChange}
          />
        ))}
      </div>
    </div>
  );
}
