// src/features/onboarding/components/OnboardingNav.jsx
// ─── Nút điều hướng onboarding: Back + Tiếp tục / Hoàn tất (S2.1) ────────────

// Design tokens
const PRIMARY          = "#3525cd";
const PRIMARY_HOVER    = "#2a1ea8";
const ON_PRIMARY       = "#ffffff";
const SURFACE          = "#fcf8ff";
const SURFACE_BORDER   = "#c7c4d8";
const FONT             = "'Be Vietnam Pro', system-ui, sans-serif";

export default function OnboardingNav({ step, totalSteps, canContinue, onBack, onContinue, loading }) {
  const isLast = step === totalSteps;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: SURFACE,
        borderTop: `1px solid ${SURFACE_BORDER}`,
        boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 672,
          margin: "0 auto",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
        }}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1 || loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flex: "0 0 auto",
            width: "33%",
            minHeight: 44,
            padding: "10px 16px",
            background: "transparent",
            border: `2px solid ${step === 1 ? SURFACE_BORDER : PRIMARY}`,
            borderRadius: 12,
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 500,
            color: step === 1 ? SURFACE_BORDER : PRIMARY,
            cursor: step === 1 || loading ? "not-allowed" : "pointer",
            opacity: step === 1 ? 0.5 : 1,
            transition: "border-color 0.2s, color 0.2s",
          }}
        >
          ← Quay lại
        </button>

        {/* Continue / Finish button */}
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue || loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flex: 1,
            minHeight: 44,
            padding: "10px 24px",
            background: !canContinue || loading ? `${PRIMARY}55` : PRIMARY,
            border: "none",
            borderRadius: 12,
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 500,
            color: ON_PRIMARY,
            cursor: !canContinue || loading ? "not-allowed" : "pointer",
            boxShadow: canContinue && !loading ? "0 4px 12px rgba(53,37,205,0.18)" : "none",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!canContinue || loading) return;
            e.currentTarget.style.background = PRIMARY_HOVER;
          }}
          onMouseLeave={(e) => {
            if (!canContinue || loading) return;
            e.currentTarget.style.background = PRIMARY;
          }}
        >
          {loading
            ? "Đang lưu..."
            : isLast
            ? "Hoàn tất & Bắt đầu học →"
            : "Tiếp tục →"}
        </button>
      </div>
    </div>
  );
}
