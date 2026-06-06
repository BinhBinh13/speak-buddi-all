// src/features/auth/LoginPage.jsx
// Trang đăng nhập — S1.5
// Layout 2 cột (WavePanel + LoginPanel) trên desktop, 1 cột trên mobile.
// Bám mockup login_page_desktop; Việt hóa theo §5.2; toggle password; message phiên hết hạn.
// Màu palette: emerald/navy (giữ đồng bộ S1.2/S1.3 đã done).
import { useState, useEffect } from "react";
import { COLORS } from "../../shared/constants/theme";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../../shared/services/authService";
import { useAuth } from "../../shared/auth/AuthContext";
// Note: useEffect is used by WavePanel and LoginPage (resize listener)

// ─── Design tokens bổ sung (lấy từ DESIGN.md — dùng cho error box) ──────────
const ERROR_BG     = "#ffdad6";
const ERROR_BORDER = "#ba1a1a33";
const ERROR_TEXT   = "#93000a";
const ERROR_ICON   = "#ba1a1a";
const OUTLINE      = "#777587";

// ── Keyframe animations ───────────────────────────────────────────────────────
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

const BAR_DELAYS  = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 0.2, 0.35, 0.5, 0.65];
const BAR_HEIGHTS = [20, 36, 52, 40, 28, 44, 32, 18, 38, 50, 26, 42];

// ═══════════════════════════════════════════════════════════════════
// COMPONENT 1 — WavePanel  (sound wave animation + microphone button)
// ═══════════════════════════════════════════════════════════════════
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
        <a
          href="/"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: COLORS.cream,
            fontSize: "1.05rem",
          }}
        >
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
        aria-label={active ? "Dừng" : "Nhấn để nói"}
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
        Luyện tiếng Anh
        <br />
        qua giọng nói
      </p>
    </div>
  );
}

// ── Inline SVG icons (tránh thêm thư viện) ────────────────────────────────────
function IconEye({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={OUTLINE}>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={OUTLINE}>
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
    </svg>
  );
}

function IconError() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={ERROR_ICON} style={{ flexShrink: 0 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT 2 — LoginPanel  (form đăng nhập)
// ═══════════════════════════════════════════════════════════════════
function LoginPanel() {
  // ── Đọc thông báo phiên hết hạn do apiClient set (§5.2 Expired token) ─────
  // Khởi tạo error state trực tiếp từ sessionStorage (tránh useEffect setState lint)
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError]               = useState(() => {
    const msg = sessionStorage.getItem("auth_msg");
    if (msg) {
      sessionStorage.removeItem("auth_msg");
      return msg;
    }
    return "";
  });
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Validate ?next= để tránh open-redirect — chỉ chấp nhận same-origin path */
  function getSafeNext() {
    const raw = searchParams.get("next");
    if (!raw) return "/dashboard";
    try {
      const decoded = decodeURIComponent(raw);
      if (decoded.startsWith("/") && !decoded.includes("://")) {
        return decoded;
      }
    } catch {
      // decodeURIComponent thất bại → fallback
    }
    return "/dashboard";
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    // Empty-field validation (§5.2)
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await loginWithEmail(email, password);
      // data = { access_token, refresh_token, user }
      login({ access_token: data.access_token, refresh_token: data.refresh_token });
      navigate(getSafeNext(), { replace: true });
    } catch (err) {
      // BE trả message §5.2 (ví dụ: "Email hoặc mật khẩu không đúng.")
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("");
    loginWithGoogle();
  };

  // ── Field style helper ────────────────────────────────────────────────────
  const fieldStyle = (name) => ({
    width: "100%",
    padding: "0.75rem 1rem",
    paddingLeft: "0.9rem",
    border: `1.5px solid ${focusedField === name ? COLORS.emerald : COLORS.stoneLight}`,
    borderRadius: 10,
    background: COLORS.white,
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
    fontSize: "0.95rem",
    color: COLORS.navy,
    outline: "none",
    boxShadow: focusedField === name ? `0 0 0 3px rgba(15,169,104,0.12)` : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    opacity: loading ? 0.7 : 1,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
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
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: COLORS.navy,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 6,
            }}
          >
            SpeakBuddi
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: COLORS.navy,
              margin: 0,
              lineHeight: 1.4,
              fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
            }}
          >
            Đăng nhập
          </h1>
        </div>

        {/* Error box — hiển thị message §5.2 (empty / wrong credentials / expired session) */}
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: ERROR_BG,
              border: `1px solid ${ERROR_BORDER}`,
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: "1.25rem",
              color: ERROR_TEXT,
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
            }}
          >
            <IconError />
            <span>⚠ {error}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleEmailLogin(); }}
          noValidate
        >
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
                fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
              }}
            >
              Email
            </label>
            <input
              id="sb-email"
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              autoComplete="email"
              disabled={loading}
              style={fieldStyle("email")}
            />
          </div>

          {/* Password field (with toggle) */}
          <div style={{ marginBottom: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <label
                htmlFor="sb-password"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: COLORS.navyMid,
                  fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                }}
              >
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "0.8rem",
                  color: COLORS.emerald,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="sb-password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                autoComplete="current-password"
                disabled={loading}
                style={{
                  ...fieldStyle("password"),
                  paddingRight: "2.75rem",   // khoảng trống cho nút toggle
                }}
              />
              {/* Toggle show/hide password (touch target ≥ 44px) */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingRight: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: OUTLINE,
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <IconEye visible={showPassword} />
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.9rem 1rem",
              background: COLORS.emerald,
              border: "none",
              borderRadius: 12,
              fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: COLORS.white,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.8rem",
              opacity: loading ? 0.7 : 1,
              transition: "background 0.2s, transform 0.1s",
              minHeight: 44,
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
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "1.5rem 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: COLORS.stoneLight }} />
          <span
            style={{
              color: COLORS.stone,
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            hoặc
          </span>
          <div style={{ flex: 1, height: 1, background: COLORS.stoneLight }} />
        </div>

        {/* Google button */}
        <button
          type="button"
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
            fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
            fontSize: "0.95rem",
            fontWeight: 500,
            color: COLORS.navy,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "border-color 0.2s, box-shadow 0.2s",
            opacity: loading ? 0.7 : 1,
            minHeight: 44,
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
          {/* Google SVG */}
          <svg width={20} height={20} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Tiếp tục với Google
        </button>

        {/* Footer */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.88rem",
              color: COLORS.stone,
              margin: 0,
              lineHeight: 1.6,
              fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
            }}
          >
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              style={{
                color: COLORS.emerald,
                fontWeight: 600,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Đăng ký
            </Link>
          </p>
        </div>

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
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
      }}
    >
      {!isMobile && <WavePanel />}
      <LoginPanel />
    </div>
  );
}
