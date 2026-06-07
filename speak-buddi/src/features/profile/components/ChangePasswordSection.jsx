// src/features/profile/components/ChangePasswordSection.jsx
// Bảo mật tài khoản — đổi/đặt mật khẩu (mockup: ho_so_cai_dat_desktop)

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { changePassword } from "../services/profileService";

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";
const PRIMARY = "#3525cd";
const ON_SURFACE = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const SURFACE_BORDER = "#c7c4d8";
const SURFACE = "#fcf8ff";

const inputStyle = {
  width: "100%",
  maxWidth: 420,
  boxSizing: "border-box",
  background: SURFACE,
  border: `1px solid ${SURFACE_BORDER}`,
  borderRadius: 10,
  padding: "11px 16px",
  fontFamily: FONT,
  fontSize: 15,
  color: ON_SURFACE,
  minHeight: 44,
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 600,
  color: ON_SURFACE,
  marginBottom: 8,
};

function validateNewPassword(pw) {
  return pw.length >= 8 && /\d/.test(pw);
}

export default function ChangePasswordSection({ onSuccess, onError }) {
  const { user, updateUser } = useAuth();
  const hasPassword = user?.has_password !== false;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const newPasswordValid = validateNewPassword(newPassword);
  const canSubmit =
    newPasswordValid &&
    passwordsMatch &&
    confirmPassword.length > 0 &&
    (hasPassword ? currentPassword.length > 0 : true);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const data = await changePassword({
        current_password: hasPassword ? currentPassword : undefined,
        new_password: newPassword,
      });
      updateUser({ has_password: data.has_password });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.(data.message || "Mật khẩu đã được cập nhật thành công.");
    } catch (err) {
      onError?.(err.message || "Không thể cập nhật mật khẩu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="account-security" style={{ scrollMarginTop: 90 }}>
      <div style={sectionHeader}>
        <div>
          <h2 style={h2}>Bảo mật tài khoản</h2>
          <p style={sectionDesc}>Quản lý mật khẩu đăng nhập.</p>
        </div>
      </div>

      <div style={sectionCard}>
        <h3 style={h3}>{hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu"}</h3>

        {!hasPassword && (
          <p style={hint}>
            Bạn đăng nhập bằng Google. Đặt mật khẩu để có thể đăng nhập bằng email sau này.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 420 }}>
          {hasPassword && (
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="current-password" style={labelStyle}>Mật khẩu hiện tại</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={inputStyle}
                autoComplete="current-password"
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="new-password" style={labelStyle}>Mật khẩu mới</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
            {newPassword.length > 0 && !newPasswordValid && (
              <p style={fieldError}>Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.</p>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="confirm-password" style={labelStyle}>Xác nhận mật khẩu mới</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p style={fieldError}>Mật khẩu xác nhận không khớp.</p>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              style={{
                background: !canSubmit || submitting ? "#c7c4d8" : "#eae6f4",
                color: ON_SURFACE,
                border: `1px solid ${SURFACE_BORDER}`,
                borderRadius: 10,
                padding: "11px 24px",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: FONT,
                cursor: !canSubmit || submitting ? "not-allowed" : "pointer",
                minHeight: 44,
              }}
            >
              {submitting ? "Đang cập nhật..." : hasPassword ? "Cập nhật mật khẩu" : "Đặt mật khẩu"}
            </button>

            {hasPassword && (
              <Link
                to="/forgot-password"
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 500,
                  color: PRIMARY,
                  textDecoration: "none",
                }}
              >
                Quên mật khẩu?
              </Link>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

const sectionHeader = {
  borderBottom: `1px solid ${SURFACE_BORDER}`,
  paddingBottom: 16,
  marginBottom: 24,
};
const h2 = {
  fontFamily: FONT,
  fontSize: 22,
  fontWeight: 600,
  color: ON_SURFACE,
  margin: "0 0 6px",
};
const h3 = {
  fontFamily: FONT,
  fontSize: 18,
  fontWeight: 600,
  color: ON_SURFACE,
  margin: "0 0 16px",
};
const sectionDesc = {
  fontFamily: FONT,
  fontSize: 15,
  color: ON_SURFACE_VARIANT,
  margin: 0,
  lineHeight: 1.5,
};
const sectionCard = {
  background: "#ffffff",
  borderRadius: 12,
  border: `1px solid ${SURFACE_BORDER}`,
  padding: "28px 28px 24px",
  boxShadow: "0 4px 12px rgba(53,37,205,0.04)",
};
const hint = {
  fontFamily: FONT,
  fontSize: 14,
  color: ON_SURFACE_VARIANT,
  margin: "0 0 20px",
  lineHeight: 1.6,
  maxWidth: 520,
};
const fieldError = {
  fontFamily: FONT,
  fontSize: 13,
  color: "#ba1a1a",
  margin: "6px 0 0",
};
