// src/features/auth/pages/RegisterPage.jsx
// Trang đăng ký — S1.4
// Layout: card đơn căn giữa trang (theo mockup register_page_desktop).
// Bám design system: màu primary #3525cd, font Be Vietnam Pro, spacing 4px.
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, loginWithGoogle } from "../../../shared/auth/authService";
import { useAuth } from "../../../shared/auth/AuthContext";

// ─── Design tokens (theo DESIGN.md) ──────────────────────────────────────────
const PRIMARY        = "#3525cd";
const PRIMARY_HOVER  = "#2a1ea8";
const ON_PRIMARY     = "#ffffff";
const SURFACE        = "#fcf8ff";
const SURFACE_LOW    = "#f5f2ff";
const SURFACE_CARD   = "#ffffff";
const SURFACE_BORDER = "#c7c4d8";          // outline-variant
const ON_SURFACE     = "#1b1b24";
const ON_SURFACE_VAR = "#464555";
const OUTLINE        = "#777587";
const ERROR_BG       = "#ffdad6";
const ERROR_BORDER   = "#ba1a1a33";
const ERROR_TEXT     = "#93000a";
const ERROR_ICON     = "#ba1a1a";
const SECONDARY_DIM  = "#4edea3";          // secondary-fixed-dim (strength bar medium)
const SECONDARY      = "#006c49";          // strong
const STRENGTH_EMPTY = "#e4e1ee";          // surface-variant

// ─── Password strength calculator ────────────────────────────────────────────
/**
 * Trả về { level: 0|1|2|3, label: string, color: string }
 * 0 = trống, 1 = yếu, 2 = trung bình, 3 = mạnh
 */
function calcStrength(pw) {
  if (!pw) return { level: 0, label: "", color: STRENGTH_EMPTY };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;  // special char

  if (score === 1) return { level: 1, label: "Yếu",        color: ERROR_ICON };
  if (score === 2) return { level: 2, label: "Trung bình", color: SECONDARY_DIM };
  if (score >= 3)  return { level: 3, label: "Mạnh",       color: SECONDARY };
  return { level: 0, label: "", color: STRENGTH_EMPTY };
}

// ─── Inline SVG icons (tránh thêm thư viện, giữ nhẹ) ────────────────────────
function IconPerson({ color = OUTLINE }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>
  );
}

function IconMail({ color = OUTLINE }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

function IconLock({ color = OUTLINE }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  );
}

function IconLockReset({ color = OUTLINE }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      <path d="M12.5 14.5v1.8c.6-.3 1-.9 1-1.6 0-1-.8-1.7-1.7-1.7-.2 0-.4 0-.5.1l.7 1.2c.3.1.5.1.5.2z" opacity="0"/>
    </svg>
  );
}

function IconEye({ visible, color = OUTLINE }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
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

// ─── Google SVG icon ──────────────────────────────────────────────────────────
function IconGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ─── Reusable input field component ──────────────────────────────────────────
function InputField({
  id, label, type, placeholder, value, onChange,
  icon, trailingBtn, hasError, disabled, autoComplete,
  onKeyDown,
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = hasError ? ERROR_ICON
                    : focused  ? PRIMARY
                    : SURFACE_BORDER;
  const shadowStyle = focused && !hasError
    ? `0 0 0 3px rgba(53,37,205,0.12)`
    : "none";

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 500,
          color: ON_SURFACE,
          marginBottom: 4,
          fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {/* Left icon */}
        <div
          style={{
            position: "absolute",
            top: 0, bottom: 0, left: 0,
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
            pointerEvents: "none",
          }}
        >
          {icon}
        </div>

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          autoComplete={autoComplete}
          disabled={disabled}
          style={{
            display: "block",
            width: "100%",
            paddingLeft: 40,
            paddingRight: trailingBtn ? 44 : 14,
            paddingTop: 10,
            paddingBottom: 10,
            border: `1.5px solid ${borderColor}`,
            borderRadius: 8,
            background: SURFACE_CARD,
            fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
            fontSize: 15,
            color: ON_SURFACE,
            outline: "none",
            boxShadow: shadowStyle,
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
            opacity: disabled ? 0.7 : 1,
          }}
        />

        {/* Trailing button (toggle visibility) */}
        {trailingBtn && (
          <div
            style={{
              position: "absolute",
              top: 0, bottom: 0, right: 0,
              display: "flex",
              alignItems: "center",
              paddingRight: 10,
            }}
          >
            {trailingBtn}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PasswordStrengthBar ──────────────────────────────────────────────────────
function PasswordStrengthBar({ password }) {
  const { level, label } = calcStrength(password);
  if (!password) return null;

  const segments = [1, 2, 3].map((seg) => {
    if (level === 0) return STRENGTH_EMPTY;
    if (level === 1 && seg === 1) return ERROR_ICON;
    if (level === 2 && seg <= 2) return SECONDARY_DIM;
    if (level === 3) return SECONDARY;
    return STRENGTH_EMPTY;
  });

  return (
    <div style={{ marginTop: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: ON_SURFACE_VAR,
          letterSpacing: "0.05em",
          fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        }}
      >
        Độ mạnh: {label}
      </span>
      <div
        style={{
          display: "flex",
          gap: 4,
          height: 6,
          borderRadius: 9999,
          overflow: "hidden",
          background: STRENGTH_EMPTY,
          marginTop: 4,
        }}
      >
        {segments.map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── RegisterPage ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [confirm,       setConfirm]       = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Client-side validation (SRS §5.2) ────────────────────────────────────
  function validateForm() {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      return "Vui lòng điền đầy đủ thông tin.";
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return "Email không hợp lệ.";
    }
    if (password.length < 8 || !/\d/.test(password)) {
      return "Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.";
    }
    if (password !== confirm) {
      return "Mật khẩu xác nhận không khớp.";
    }
    return null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = await register(name.trim(), email.trim().toLowerCase(), password);
      login({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
      // S2.1: redirect sang onboarding sau khi đăng ký
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await loginWithGoogle();
      login({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
      // S2.1: redirect sang onboarding; guard sẽ xử lý nếu đã onboard trước
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: SURFACE,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: SURFACE_CARD,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(53,37,205,0.04)",
          border: `1px solid ${SURFACE_LOW}`,
          padding: "2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient decoration (top-right corner, like mockup) */}
        <div
          style={{
            position: "absolute",
            top: 0, right: 0,
            width: 128, height: 128,
            background: "rgba(79,70,229,0.2)",  // primary-container @ 20%
            borderRadius: "0 0 0 100%",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Back button */}
          <div style={{ marginBottom: "0.75rem" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                padding: "6px 0",
                cursor: "pointer",
                color: ON_SURFACE_VAR,
                fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY)}
              onMouseLeave={(e) => (e.currentTarget.style.color = ON_SURFACE_VAR)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Quay lại
            </button>
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: PRIMARY,
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
                color: ON_SURFACE,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Tạo tài khoản
            </h1>
            <p
              style={{
                fontSize: 15,
                color: ON_SURFACE_VAR,
                marginTop: 8,
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              Bắt đầu hành trình học tiếng Anh của bạn.
            </p>
          </div>

          {/* Error box */}
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
                marginBottom: "1rem",
                color: ERROR_TEXT,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <IconError />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleRegister(); }}
            noValidate
          >
            {/* Họ và tên */}
            <InputField
              id="sb-name"
              label="Họ và tên"
              type="text"
              placeholder="Nhập họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<IconPerson />}
              disabled={loading}
              autoComplete="name"
              onKeyDown={handleKeyDown}
            />

            {/* Email */}
            <InputField
              id="sb-email"
              label="Email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<IconMail />}
              hasError={!!error && error.toLowerCase().includes("email")}
              disabled={loading}
              autoComplete="email"
              onKeyDown={handleKeyDown}
            />

            {/* Mật khẩu */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="sb-password"
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: ON_SURFACE,
                  marginBottom: 4,
                }}
              >
                Mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 0, bottom: 0, left: 0,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 12,
                    pointerEvents: "none",
                  }}
                >
                  <IconLock />
                </div>
                <input
                  id="sb-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tạo mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  onKeyDown={handleKeyDown}
                  style={{
                    display: "block",
                    width: "100%",
                    paddingLeft: 40,
                    paddingRight: 44,
                    paddingTop: 10,
                    paddingBottom: 10,
                    border: `1.5px solid ${SURFACE_BORDER}`,
                    borderRadius: 8,
                    background: SURFACE_CARD,
                    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                    fontSize: 15,
                    color: ON_SURFACE,
                    outline: "none",
                    boxSizing: "border-box",
                    opacity: loading ? 0.7 : 1,
                    transition: "border-color 0.2s",
                  }}
                />
                {/* Toggle visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  style={{
                    position: "absolute",
                    top: 0, bottom: 0, right: 0,
                    display: "flex",
                    alignItems: "center",
                    paddingRight: 10,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: OUTLINE,
                    minWidth: 44,
                    minHeight: 44,
                    justifyContent: "center",
                  }}
                >
                  <IconEye visible={showPassword} />
                </button>
              </div>
              {/* Strength bar */}
              <PasswordStrengthBar password={password} />
            </div>

            {/* Xác nhận mật khẩu */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="sb-confirm"
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: ON_SURFACE,
                  marginBottom: 4,
                }}
              >
                Xác nhận mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 0, bottom: 0, left: 0,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 12,
                    pointerEvents: "none",
                  }}
                >
                  <IconLockReset />
                </div>
                <input
                  id="sb-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  onKeyDown={handleKeyDown}
                  style={{
                    display: "block",
                    width: "100%",
                    paddingLeft: 40,
                    paddingRight: 44,
                    paddingTop: 10,
                    paddingBottom: 10,
                    border: `1.5px solid ${SURFACE_BORDER}`,
                    borderRadius: 8,
                    background: SURFACE_CARD,
                    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                    fontSize: 15,
                    color: ON_SURFACE,
                    outline: "none",
                    boxSizing: "border-box",
                    opacity: loading ? 0.7 : 1,
                    transition: "border-color 0.2s",
                  }}
                />
                {/* Toggle confirm visibility */}
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                  style={{
                    position: "absolute",
                    top: 0, bottom: 0, right: 0,
                    display: "flex",
                    alignItems: "center",
                    paddingRight: 10,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: OUTLINE,
                    minWidth: 44,
                    minHeight: 44,
                    justifyContent: "center",
                  }}
                >
                  <IconEye visible={showConfirm} />
                </button>
              </div>
            </div>

            {/* S12.1: thông báo chấp thuận điều khoản (§4.7 — informed consent) */}
            <p
              style={{
                fontSize: 13,
                color: ON_SURFACE_VAR,
                textAlign: "center",
                margin: "0 0 1rem",
                lineHeight: 1.6,
              }}
            >
              Bằng việc đăng ký, bạn đồng ý với{" "}
              <Link
                to="/terms"
                style={{ color: PRIMARY, fontWeight: 500, textDecoration: "underline" }}
              >
                Điều khoản dịch vụ
              </Link>{" "}
              và{" "}
              <Link
                to="/privacy"
                style={{ color: PRIMARY, fontWeight: 500, textDecoration: "underline" }}
              >
                Chính sách bảo mật
              </Link>{" "}
              của chúng tôi.
            </p>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: loading ? `${PRIMARY}99` : PRIMARY,
                border: "none",
                borderRadius: 9999,
                fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: ON_PRIMARY,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s, transform 0.1s",
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (loading) return;
                e.currentTarget.style.background = PRIMARY_HOVER;
              }}
              onMouseLeave={(e) => {
                if (loading) return;
                e.currentTarget.style.background = PRIMARY;
              }}
              onMouseDown={(e) => {
                if (loading) return;
                e.currentTarget.style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: SURFACE_BORDER }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: ON_SURFACE_VAR,
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              hoặc
            </span>
            <div style={{ flex: 1, height: 1, background: SURFACE_BORDER }} />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              background: SURFACE_CARD,
              border: `1px solid ${SURFACE_BORDER}`,
              borderRadius: 9999,
              fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: ON_SURFACE,
              cursor: loading ? "not-allowed" : "pointer",
              minHeight: 44,
              transition: "border-color 0.2s, box-shadow 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (loading) return;
              e.currentTarget.style.background = SURFACE_LOW;
            }}
            onMouseLeave={(e) => {
              if (loading) return;
              e.currentTarget.style.background = SURFACE_CARD;
            }}
          >
            <IconGoogle />
            Tiếp tục với Google
          </button>

          {/* Footer — login link */}
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <p
              style={{
                fontSize: 15,
                color: ON_SURFACE_VAR,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: PRIMARY,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.color = PRIMARY)}
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
