// src/features/auth/pages/ForgotPasswordPage.jsx
// Trang Quên mật khẩu — S1.7
// Layout: full-screen surface + 2 decorative blobs + card căn giữa max-width 440px.
// Bám mockup: speak-buddi-docs/ui/quen_mat_khau_desktop/
// Màu palette: indigo primary #3525cd (DESIGN.md).
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../shared/auth/authService";

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
  successContainer:        "#dcfce7",
  onSuccessContainer:      "#166534",
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

function getInputStyle(focused, loading) {
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

function IconError() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill={C.error} style={{ flexShrink: 0 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="#166534" style={{ flexShrink: 0 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );
}

function IconArrowBack() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ForgotPasswordPage
// ═══════════════════════════════════════════════════════════════════════════════
export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState("");
  const [focusedEmail, setFocus]  = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword(trimmedEmail);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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
            fontSize: 24,
            fontWeight: 600,
            color: C.onSurface,
            margin: "0 0 8px 0",
            lineHeight: 1.3,
          }}>
            Quên mật khẩu?
          </h1>
          <p style={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 400,
            color: C.onSurfaceVariant,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Đừng lo lắng, hãy nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
          </p>
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

        {/* Success state: ẩn form, hiển thị success box */}
        {success ? (
          <div>
            <div
              role="status"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: C.successContainer,
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "16px",
                marginBottom: "2rem",
              }}
            >
              <IconCheckCircle />
              <p style={{
                margin: 0,
                color: C.onSuccessContainer,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: FONT,
                lineHeight: 1.5,
              }}>
                Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.primary,
                  textDecoration: "none",
                  fontFamily: FONT,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                <IconArrowBack />
                Quay lại Đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Email field */}
            <div>
              <label htmlFor="fp-email" style={labelStyle}>Email</label>
              <div style={{ position: "relative" }}>
                <span style={iconLeftStyle}><IconMail /></span>
                <input
                  id="fp-email"
                  type="email"
                  placeholder="Nhập địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocus(true)}
                  onBlur={() => setFocus(false)}
                  autoComplete="email"
                  disabled={loading}
                  style={getInputStyle(focusedEmail, loading)}
                />
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
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
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>

            {/* Link back to login */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.primary,
                  textDecoration: "none",
                  fontFamily: FONT,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                <IconArrowBack />
                Quay lại Đăng nhập
              </Link>
            </div>
          </form>
        )}

      </main>
    </div>
  );
}
