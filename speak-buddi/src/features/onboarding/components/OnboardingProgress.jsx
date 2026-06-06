// src/features/onboarding/components/OnboardingProgress.jsx
// ─── Progress bar + bước hiện tại (S2.1) ─────────────────────────────────────

// Design tokens
const PRIMARY            = "#3525cd";
const SURFACE_VARIANT    = "#e4e1ee";
const ON_SURFACE_VARIANT = "#464555";
const FONT               = "'Be Vietnam Pro', system-ui, sans-serif";

const STEP_LABELS = ["Trình độ", "Chủ đề", "Phút/ngày", "Từ/buổi"];
const TOTAL_STEPS = 4;

export default function OnboardingProgress({ step }) {
  const percent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
      {/* Step label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          fontFamily: FONT,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: ON_SURFACE_VARIANT,
          }}
        >
          Bước {step} / {TOTAL_STEPS}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: PRIMARY,
          }}
        >
          {STEP_LABELS[step - 1]}
        </span>
      </div>

      {/* Track */}
      <div
        style={{
          width: "100%",
          height: 8,
          background: SURFACE_VARIANT,
          borderRadius: 9999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: PRIMARY,
            borderRadius: 9999,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
