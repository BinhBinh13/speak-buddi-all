// src/features/onboarding/OnboardingPage.jsx
// ─── Wizard onboarding 4 bước bắt buộc sau khi đăng ký (S2.1 revised v2) ─────
// Mockup tham chiếu:
//   - onboarding_chon_trinh_do_desktop (layout + progress + level cards)
//   - onboarding_chon_muc_tieu_desktop (card option pattern)
//   - onboarding_chon_so_thich_desktop (GoalStep — 3 radio card cố định)
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../shared/auth/AuthContext";
import { setUser } from "../../shared/auth/authService";
import { submitOnboarding } from "./services/onboardingService";

import OnboardingProgress from "./components/OnboardingProgress";
import OnboardingNav      from "./components/OnboardingNav";
import LevelStep          from "./components/LevelStep";
import GoalStep           from "./components/GoalStep";
import WordsStep          from "./components/WordsStep";

// Design tokens
const PRIMARY            = "#3525cd";
const SURFACE            = "#fcf8ff";
const SURFACE_CARD       = "#ffffff";
const ON_SURFACE_VARIANT = "#464555";
const ERROR_BG           = "#ffdad6";
const ERROR_TEXT         = "#93000a";
const FONT               = "'Be Vietnam Pro', system-ui, sans-serif";

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [step,  setStep]  = useState(1);
  const [level, setLevel] = useState("");
  const [goal,  setGoal]  = useState("");   // slug: "travel"|"work"|"communication"
  const [words, setWords] = useState(null); // 0 = không học từ mới (speaking only)

  // ── UI state ────────────────────────────────────────────────────────────────
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError,   setSubmitError]   = useState("");

  // ── Validation: nút Tiếp tục có được bấm không ──────────────────────────────
  function canContinue() {
    if (step === 1) return level !== "";
    if (step === 2) return goal !== "";
    if (step === 3) return words !== null;
    return false;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  async function handleContinue() {
    if (!canContinue()) return;

    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }

    // Bước 4: submit
    setSubmitLoading(true);
    setSubmitError("");
    try {
      const result = await submitOnboarding({
        level,
        learning_goal:     goal,
        words_per_session: words,
      });

      // Cập nhật user object trong localStorage + AuthContext
      if (result && result.onboarding_completed) {
        const updatedUser = {
          ...(user || {}),
          level:                level,
          learning_goal:        goal,
          onboarding_completed: true,
          words_per_session:    result.words_per_session,
        };
        setUser(updatedUser);
        // Re-login để AuthContext nhận user mới (không cần gọi lại /me)
        const access_token  = localStorage.getItem("token");
        const refresh_token = localStorage.getItem("refresh_token");
        login({ access_token, refresh_token, user: updatedUser });
      }

      // words=0 (speaking-only) → thẳng vào /speaking; còn lại → /roadmap
      const dest = words === 0 ? "/speaking" : "/roadmap";
      navigate(dest, { replace: true });
    } catch (err) {
      setSubmitError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     SURFACE,
        fontFamily:     FONT,
        display:        "flex",
        flexDirection:  "column",
      }}
    >
      {/* Header minimal */}
      <header
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          padding:        "16px 24px",
          maxWidth:       1280,
          margin:         "0 auto",
          width:          "100%",
          boxSizing:      "border-box",
        }}
      >
        <span
          style={{
            fontSize:      22,
            fontWeight:    700,
            color:         PRIMARY,
            letterSpacing: "-0.02em",
          }}
        >
          SpeakBuddi
        </span>
        <span
          style={{
            fontSize: 13,
            color:    ON_SURFACE_VARIANT,
          }}
        >
          Thiết lập tài khoản
        </span>
      </header>

      {/* Main scroll area */}
      <main
        style={{
          flex:           1,
          overflowY:      "auto",
          padding:        "24px 16px 120px",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
        }}
      >
        {/* Progress bar */}
        <div style={{ width: "100%", maxWidth: 672, marginBottom: 32 }}>
          <OnboardingProgress step={step} />
        </div>

        {/* Step content card */}
        <div
          style={{
            width:      "100%",
            maxWidth:   672,
            background: SURFACE_CARD,
            borderRadius: 16,
            boxShadow:  "0 4px 24px rgba(53,37,205,0.06)",
            padding:    "28px 24px",
            boxSizing:  "border-box",
          }}
        >
          {step === 1 && (
            <LevelStep value={level} onChange={setLevel} />
          )}
          {step === 2 && (
            <GoalStep value={goal} onChange={setGoal} />
          )}
          {step === 3 && (
            <WordsStep value={words} onChange={setWords} />
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div
            role="alert"
            style={{
              width:      "100%",
              maxWidth:   672,
              marginTop:  16,
              background: ERROR_BG,
              borderRadius: 8,
              padding:    "10px 16px",
              color:      ERROR_TEXT,
              fontSize:   14,
              fontWeight: 500,
              boxSizing:  "border-box",
            }}
          >
            {submitError}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <OnboardingNav
        step={step}
        totalSteps={TOTAL_STEPS}
        canContinue={canContinue()}
        onBack={handleBack}
        onContinue={handleContinue}
        loading={submitLoading}
      />
    </div>
  );
}
