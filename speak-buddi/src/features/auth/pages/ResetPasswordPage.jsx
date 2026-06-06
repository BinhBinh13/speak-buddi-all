// src/features/auth/pages/ResetPasswordPage.jsx
// Trang Thiết lập mật khẩu mới — S1.7
// Layout: full-screen surface + card căn giữa max-width 440px.
// Bám mockup: speak-buddi-docs/ui/thiet_lap_mat_khau_desktop/
// Đọc ?token= từ URL; nếu không có token → redirect /forgot-password.
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../../shared/auth/authService";

// ─── Design tokens — DESIGN.md ───────────────────────────────────────────────
const C = {
  primary:                 "#3525cd",
  onPrimary:               "#ffffff",
  surface:                 "#fcf8ff",
  surfaceContainerLowest:  "#ffffff",
  surfaceContainerLow:     "#f5f2ff",
  surfaceContainerHighest: "#e4e1ee",
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
  color: C.onSurface,
  marginBottom: 4,
  fontFamily: FONT,
  lineHeight: 1.4,
};

function getInputStyle(focused, loading) {
  return {
    width: "100%",
    padding: "0.75rem 3rem 0.75rem 1rem",
    border: `1px solid ${focused ? C.primary : C.outline}`,
    borderRadius: 8,
    background: C.surfaceContainerLowest,
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

function IconCheck({ met }) {
  return (
    <svg
      width={16} height={16} viewBox="0 0 24 24"
      fill={met ? "#166534" : C.outlineVariant}
      style={{ flexShrink: 0 }}
    >
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

// ─── Password hint checker ────────────────────────────────────────────────────
function PasswordHints({ password }) {
  const hasLength = password.length >= 8;
  const hasDigit  = /\d/.test(password);

  return (
    <div style={{
      background: C.surfaceContainerLow,
      borderRadius: 8,
      padding: "12px 14px",
      border: `1px solid ${C.outlineVariant}80`,
    }}>
      <p style={{
        margin: "0 0 8px 0",
        fontSize: 12,
        fontWeight: 600,
        color: C.onSurfaceVariant,
        fontFamily: FONT,
        lineHeight: 1.2,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}>
        Mật khẩu phải chứa ít nhất:
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconCheck met={hasLength} />
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: hasLength ? "#166534" : C.onSurfaceVariant,
            fontFamily: FONT,
          }}>
            Ít nhất 8 ký tự
          </span>
        </li>
        <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconCheck met={hasDigit} />
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: hasDigit ? "#166534" : C.onSurfaceVariant,
            fontFamily: FONT,
          }}>
            Ít nhất 1 chữ số (0–9)
          </span>
        </li>
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ResetPasswordPage
// ═══════════════════════════════════════════════════════════════════════════════
export default function ResetPasswordPage() {
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [focusedNew, setFocusedNew]             = useState(false);
  const [focusedConfirm, setFocusedConfirm]     = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");
  const [expiredError, setExpiredError]         = useState(false);

  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Nếu không có token khi mount → redirect /forgot-password
  useEffect(() => {
    if (!token) {
      navigate("/forgot-password", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExpiredError(false);

    // Client-side: kiểm tra 2 ô password khớp
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      // On success: đặt auth_msg và redirect về login
      sessionStorage.setItem("auth_msg", "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setError(msg);
      // Nếu token hết hạn → hiển thị link quay lại /forgot-password
      if (msg.includes("hết hạn")) {
        setExpiredError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Không render gì nếu chưa có token (đang redirect)
  if (!token) return null;

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
        overflow: "hidden",
      }}>
        {/* Subtle background accent (bám mockup thiet_lap_mat_khau) */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 128, height: 128,
          background: `${C.primary}0d`,
          borderRadius: "50%",
          filter: "blur(48px)",
          marginRight: -64, marginTop: -64,
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem", position: "relative" }}>
          <h1 style={{
            fontFamily: FONT,
            fontSize: 32,
            fontWeight: 700,
            color: C.onSurface,
            margin: "0 0 8px 0",
            lineHeight: 1.25,
          }}>
            Thiết lập mật khẩu mới
          </h1>
          <p style={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 400,
            color: C.onSurfaceVariant,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Mật khẩu mới của bạn phải khác với mật khẩu đã sử dụng trước đó.
          </p>
        </div>

        {/* Error box */}
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              background: C.errorContainer,
              border: `1px solid ${C.error}1a`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: "1.5rem",
            }}
          >
            <IconError />
            <div>
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
              {expiredError && (
                <Link
                  to="/forgot-password"
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.primary,
                    textDecoration: "underline",
                    fontFamily: FONT,
                  }}
                >
                  Gửi lại yêu cầu đặt lại mật khẩu
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Mật khẩu mới */}
          <div>
            <label htmlFor="rp-new-password" style={labelStyle}>Mật khẩu mới</label>
            <div style={{ position: "relative" }}>
              <input
                id="rp-new-password"
                type={showNew ? "text" : "password"}
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setFocusedNew(true)}
                onBlur={() => setFocusedNew(false)}
                autoComplete="new-password"
                disabled={loading}
                style={getInputStyle(focusedNew, loading)}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                style={{
                  position: "absolute", top: 0, bottom: 0, right: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  paddingRight: 12,
                  background: "none", border: "none",
                  cursor: "pointer", color: C.outlineVariant,
                  minWidth: 44, minHeight: 44,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.onSurfaceVariant)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.outlineVariant)}
              >
                <IconEye visible={showNew} />
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label htmlFor="rp-confirm-password" style={labelStyle}>Xác nhận mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                id="rp-confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedConfirm(true)}
                onBlur={() => setFocusedConfirm(false)}
                autoComplete="new-password"
                disabled={loading}
                style={getInputStyle(focusedConfirm, loading)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                style={{
                  position: "absolute", top: 0, bottom: 0, right: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  paddingRight: 12,
                  background: "none", border: "none",
                  cursor: "pointer", color: C.outlineVariant,
                  minWidth: 44, minHeight: 44,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.onSurfaceVariant)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.outlineVariant)}
              >
                <IconEye visible={showConfirm} />
              </button>
            </div>
          </div>

          {/* Password hints */}
          <PasswordHints password={newPassword} />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              background: C.primary,
              border: "none",
              borderRadius: 8,
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
            }}
            onMouseEnter={(e) => {
              if (loading) return;
              e.currentTarget.style.background = "#3323cc";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(53,37,205,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.primary;
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(53,37,205,0.2)";
            }}
            onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </form>

        {/* Link back to login */}
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: C.onSurfaceVariant,
              textDecoration: "none",
              fontFamily: FONT,
              letterSpacing: "0.05em",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.onSurfaceVariant)}
          >
            <IconArrowBack />
            Quay lại Đăng nhập
          </Link>
        </div>

      </main>
    </div>
  );
}
