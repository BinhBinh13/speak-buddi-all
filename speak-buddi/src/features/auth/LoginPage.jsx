// src/features/auth/LoginPage.jsx
// Trang đăng nhập — S1.5
// Layout: 1 card căn giữa, nền surface + 2 decorative blob.
// Bám mockup login_page_desktop (speak-buddi-docs/ui/login_page_desktop/).
// Màu palette: indigo primary #3525cd (DESIGN.md).
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../../shared/services/authService";
import { useAuth } from "../../shared/auth/AuthContext";

// ─── Design tokens — DESIGN.md ───────────────────────────────────────────────
const C = {
  primary:                 "#3525cd",
  onPrimary:               "#ffffff",
  surface:                 "#fcf8ff",
  surfaceContainerLowest:  "#ffffff",
  surfaceContainerHighest: "#e4e1ee",
  surfaceVariant:          "#e4e1ee",
  onSurface:               "#1b1b24",
  onSurfaceVariant:        "#464555",
  outline:                 "#777587",
  outlineVariant:          "#c7c4d8",
  primaryContainer:        "#4f46e5",
  secondaryContainer:      "#6cf8bb",
  error:                   "#ba1a1a",
  errorContainer:          "#ffdad6",
  onErrorContainer:        "#93000a",
};

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

// ─── Shared styles ────────────────────────────────────────────────────────────
const labelStyle = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  color: C.onSurfaceVariant,
  marginBottom: 6,
  fontFamily: FONT,
  lineHeight: 1.4,
};

const iconLeftStyle = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  color: C.outline,
};

function getInputStyle(name, focusedField, loading) {
  const focused = focusedField === name;
  return {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.75rem",
    border: `1px solid ${focused ? C.primary : C.outlineVariant}`,
    borderRadius: 8,
    background: C.surface,
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: 400,
    color: C.onSurface,
    outline: "none",
    boxShadow: focused ? `0 0 0 2px rgba(53,37,205,0.12)` : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    opacity: loading ? 0.7 : 1,
  };
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconMail() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={C.outline}>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={C.outline}>
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  );
}

function IconEye({ visible }) {
  return visible ? (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ) : (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
    </svg>
  );
}

function IconError() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill={C.error} style={{ flexShrink: 0 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LoginPage
// ═══════════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError]               = useState(() => {
    const msg = sessionStorage.getItem("auth_msg");
    if (msg) { sessionStorage.removeItem("auth_msg"); return msg; }
    return "";
  });
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  function getSafeNext() {
    const raw = searchParams.get("next");
    if (!raw) return "/dashboard";
    try {
      const decoded = decodeURIComponent(raw);
      if (decoded.startsWith("/") && !decoded.includes("://")) return decoded;
    } catch { /* fallback */ }
    return "/dashboard";
  }

  const handleEmailLogin = async () => {
    if (!email || !password) { setError("Vui lòng điền đầy đủ thông tin."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await loginWithEmail(email, password);
      login({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
      navigate(getSafeNext(), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const data = await loginWithGoogle();
      login({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
      navigate(getSafeNext(), { replace: true });
    } catch (err) {
      setError(err.message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem 1.5rem",
        position: "relative",
        overflow: "hidden",
        fontFamily: FONT,
      }}
    >
      {/* Decorative ambient blobs */}
      <div style={{
        position: "absolute", top: "-10%", left: "-10%",
        width: "40%", height: "40%",
        background: C.primaryContainer,
        borderRadius: "50%", filter: "blur(120px)", opacity: 0.3,
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-10%",
        width: "30%", height: "30%",
        background: C.secondaryContainer,
        borderRadius: "50%", filter: "blur(100px)", opacity: 0.2,
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Card */}
      <main style={{
        width: "100%",
        maxWidth: 440,
        background: C.surfaceContainerLowest,
        borderRadius: 24,
        boxShadow: "0 8px 24px rgba(53,37,205,0.06)",
        padding: "2.5rem",
        position: "relative",
        zIndex: 10,
        border: `1px solid ${C.surfaceContainerHighest}80`,
        boxSizing: "border-box",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            fontFamily: FONT,
            fontSize: 32,
            fontWeight: 700,
            color: C.primary,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            marginBottom: 8,
          }}>
            SpeakBuddi
          </div>
          <h1 style={{
            fontFamily: FONT,
            fontSize: 20,
            fontWeight: 600,
            color: C.onSurface,
            margin: 0,
            lineHeight: 1.4,
          }}>
            Đăng nhập
          </h1>
        </div>

        {/* Error box */}
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: C.errorContainer,
              border: `1px solid ${C.error}1a`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: "1.5rem",
            }}
          >
            <IconError />
            <p style={{
              margin: 0,
              color: C.error,
              fontSize: 14,
              fontWeight: 500,
              fontFamily: FONT,
              lineHeight: 1.4,
            }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleEmailLogin(); }}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Email */}
          <div>
            <label htmlFor="sb-email" style={labelStyle}>Email</label>
            <div style={{ position: "relative" }}>
              <span style={iconLeftStyle}><IconMail /></span>
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
                style={getInputStyle("email", focusedField, loading)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}>
              <label htmlFor="sb-password" style={{ ...labelStyle, marginBottom: 0 }}>
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.primary,
                  textDecoration: "none",
                  letterSpacing: "0.05em",
                  fontFamily: FONT,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <span style={iconLeftStyle}><IconLock /></span>
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
                  ...getInputStyle("password", focusedField, loading),
                  paddingRight: "3rem",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                style={{
                  position: "absolute", top: 0, bottom: 0, right: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  paddingRight: 12,
                  background: "none", border: "none",
                  cursor: "pointer", color: C.outline,
                  minWidth: 44, minHeight: 44,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.outline)}
              >
                <IconEye visible={showPassword} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              marginTop: 8,
              background: C.primary,
              border: "none",
              borderRadius: 16,
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 500,
              color: C.onPrimary,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 12px rgba(53,37,205,0.2)",
              transition: "background 0.2s, box-shadow 0.2s, transform 0.1s",
              minHeight: 44,
            }}
            onMouseEnter={(e) => {
              if (loading) return;
              e.currentTarget.style.background = "#3323cc";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(53,37,205,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.primary;
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(53,37,205,0.2)";
            }}
            onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          margin: "2rem 0",
        }}>
          <div style={{ flex: 1, height: 1, background: C.outlineVariant }} />
          <span style={{
            color: C.outline, fontSize: 12, fontWeight: 600,
            letterSpacing: "0.05em", textTransform: "uppercase",
            fontFamily: FONT,
          }}>
            hoặc
          </span>
          <div style={{ flex: 1, height: 1, background: C.outlineVariant }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            border: `2px solid ${C.outlineVariant}`,
            borderRadius: 16,
            background: C.surfaceContainerLowest,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 500,
            color: C.onSurface,
            cursor: (loading || googleLoading) ? "not-allowed" : "pointer",
            opacity: (loading || googleLoading) ? 0.7 : 1,
            transition: "background 0.2s, border-color 0.2s, transform 0.1s",
            minHeight: 44,
          }}
          onMouseEnter={(e) => {
            if (loading || googleLoading) return;
            e.currentTarget.style.background = C.surfaceVariant;
            e.currentTarget.style.borderColor = C.outline;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = C.surfaceContainerLowest;
            e.currentTarget.style.borderColor = C.outlineVariant;
          }}
          onMouseDown={(e) => { if (!loading && !googleLoading) e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <GoogleIcon />
          {googleLoading ? "Đang xử lý..." : "Tiếp tục với Google"}
        </button>

        {/* Sign up */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p style={{
            fontSize: 14,
            color: C.onSurfaceVariant,
            margin: 0,
            lineHeight: 1.6,
            fontFamily: FONT,
          }}>
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Đăng ký
            </Link>
          </p>
        </div>

      </main>
    </div>
  );
}
