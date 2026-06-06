import { useState, useEffect } from "react";
import { COLORS, FONTS, GOOGLE_FONTS_URL } from "../../shared/constants/theme";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../../shared/services/authService";
import { useAuth } from "../../shared/auth/AuthContext";
// ═══════════════════════════════════════════════════════════════════
// COMPONENT 1 — WavePanel  (sound wave animation + microphone button)
// ═══════════════════════════════════════════════════════════════════
const keyframesCSS = `
@keyframes wave-bar {
  0%, 100% { transform: scaleY(1); opacity: 0.6; }
  50%       { transform: scaleY(1.7); opacity: 1; }
}
@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(15,169,104,.5); }
  60%       { box-shadow: 0 0 0 20px rgba(15,169,104,0); }
}
`;

function injectKeyframes() {
  if (!document.getElementById("sb-keyframes")) {
    const style = document.createElement("style");
    style.id = "sb-keyframes";
    style.textContent = keyframesCSS;
    document.head.appendChild(style);
  }
}
injectKeyframes();

const BAR_DELAYS = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 0.2, 0.35, 0.5, 0.65];
const BAR_HEIGHTS = [20, 36, 52, 40, 28, 44, 32, 18, 38, 50, 26, 42];

function WavePanel() {
  const [active, setActive] = useState(false);

  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${COLORS.navyMid} 0%, ${COLORS.navy} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2rem",
        position: "relative",
        overflow: "hidden",
        flex: 1,
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(15,169,104,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Brand mark */}
      <div
        style={{
          position: "absolute",
          top: "2rem",
          left: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: COLORS.emerald,
          }}
        />

          <a href="/" style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: COLORS.cream,
            fontSize: "1.05rem",
          }}>
SpeakBuddi
</a>
      </div>

      {/* Wave bars */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          height: 60,
          marginBottom: "2rem",
        }}
      >
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: h,
              borderRadius: 3,
              background: active ? COLORS.emeraldLight : COLORS.emerald,
              animation: "wave-bar 1.2s ease-in-out infinite",
              animationDelay: `${BAR_DELAYS[i]}s`,
              opacity: 0.8,
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* Mic button */}
      <button
        onClick={() => setActive((v) => !v)}
        aria-label={active ? "Stop" : "Press to speak"}
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: active ? COLORS.emeraldDark : COLORS.emerald,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "mic-pulse 2.4s ease-in-out infinite",
          transition: "background 0.2s, transform 0.15s",
          marginBottom: "2rem",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.07)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {/* Microphone SVG */}
        <svg
          width={36}
          height={36}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="9" y1="22" x2="15" y2="22" />
        </svg>
      </button>

      {/* Label */}
      <p
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          color: COLORS.cream,
          fontSize: "1.5rem",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.3,
          marginBottom: "0.5rem",
        }}
      >
        Practice English
        <br />
        with your voice
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT 2 — LoginPanel  (Google + Email login)
// ═══════════════════════════════════════════════════════════════════
 function LoginPanel() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // ── Helpers ──────────────────────────────────────────────
  /** Validate ?next= để tránh open-redirect — chỉ chấp nhận same-origin path */
  function getSafeNext() {
    const raw = searchParams.get("next");
    if (!raw) return "/dashboard";
    try {
      const decoded = decodeURIComponent(raw);
      // Chỉ chấp nhận path bắt đầu bằng "/" và không chứa "://" (tránh http://evil.com)
      if (decoded.startsWith("/") && !decoded.includes("://")) {
        return decoded;
      }
    } catch {
      // decodeURIComponent thất bại → fallback
    }
    return "/dashboard";
  }

  // ── Handlers ────────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await loginWithEmail(email, password);
      login(data.token);
      navigate(getSafeNext(), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  const handleGoogleLogin = () => {
    setError("");
    loginWithGoogle();
  };
 
  // ── Styles ───────────────────────────────────────────────
  const fieldStyle = (name) => ({
    width: "100%",
    padding: "0.75rem 1rem",
    border: `1.5px solid ${focusedField === name ? COLORS.emerald : COLORS.stoneLight}`,
    borderRadius: 10,
    background: COLORS.white,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: "0.95rem",
    color: COLORS.navy,
    outline: "none",
    boxShadow: focusedField === name ? `0 0 0 3px rgba(15,169,104,0.12)` : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });
 
  // ── Render ───────────────────────────────────────────────
  return (
    <div
      style={{
        background: COLORS.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2.5rem",
        flex: 1,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
 
        {/* Heading */}
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: COLORS.navy,
            fontSize: "2rem",
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: "0.5rem",
          }}
        >
          Welcome back{" "}
          <span style={{ color: COLORS.emerald }}>✦</span>
        </h1>
        <p
          style={{
            color: COLORS.stone,
            fontSize: "0.95rem",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          Sign in to continue your speaking journey.
        </p>
 
        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            border: `1.5px solid ${COLORS.stoneLight}`,
            borderRadius: 12,
            background: COLORS.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "0.95rem",
            fontWeight: 500,
            color: COLORS.navy,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "1.2rem",
            transition: "border-color 0.2s, box-shadow 0.2s",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            e.currentTarget.style.borderColor = COLORS.emerald;
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15,169,104,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.stoneLight;
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
 
        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.2rem",
          }}
        >
          <div style={{ flex: 1, height: 1, background: COLORS.stoneLight }} />
          <span style={{ color: COLORS.stone, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
            or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, background: COLORS.stoneLight }} />
        </div>
 
        {/* Email field */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="sb-email"
            style={{
              display: "block",
              fontSize: "0.82rem",
              fontWeight: 500,
              color: COLORS.navyMid,
              marginBottom: "0.4rem",
            }}
          >
            Email
          </label>
          <input
            id="sb-email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
            autoComplete="email"
            disabled={loading}
            style={fieldStyle("email")}
          />
        </div>
 
        {/* Password field */}
        <div style={{ marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <label
              htmlFor="sb-password"
              style={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: COLORS.navyMid,
              }}
            >
              Password
            </label>
            <a
              href="/forgot-password"
              style={{
                fontSize: "0.8rem",
                color: COLORS.emerald,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Forgot password?
            </a>
          </div>
          <input
            id="sb-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
            autoComplete="current-password"
            disabled={loading}
            style={fieldStyle("password")}
          />
        </div>
 
        {/* Error message */}
        {error && (
          <p
            style={{
              color: COLORS.coral,
              fontSize: "0.83rem",
              marginTop: "0.6rem",
              padding: "0.5rem 0.75rem",
              background: "#FEF0EC",
              borderRadius: 8,
              border: `1px solid ${COLORS.coral}30`,
            }}
          >
            ⚠ {error}
          </p>
        )}
 
        {/* Sign In button */}
        <button
          onClick={handleEmailLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.9rem 1rem",
            background: COLORS.emerald,
            border: "none",
            borderRadius: 12,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: COLORS.white,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "0.8rem",
            opacity: loading ? 0.7 : 1,
            transition: "background 0.2s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            e.currentTarget.style.background = COLORS.emeraldDark;
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.emerald)}
          onMouseDown={(e) => {
            if (loading) return;
            e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
 
        {/* Footer */}
        <p
          style={{
            marginTop: "1.6rem",
            textAlign: "center",
            fontSize: "0.83rem",
            color: COLORS.stone,
            lineHeight: 2,
          }}
        >
          Don't have an account?{" "}
          <a
            href="/register"
            style={{ color: COLORS.emerald, fontWeight: 500, textDecoration: "none" }}
          >
            Sign up for free
          </a>
        </p>
 
      </div>
    </div>
  );
}
 

// ═══════════════════════════════════════════════════════════════════
// ROOT — LoginPage  (responsive grid: 2 cols → 1 col on mobile)
// ═══════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  // Listen to resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <WavePanel />
      <LoginPanel />
    </div>
  );
}