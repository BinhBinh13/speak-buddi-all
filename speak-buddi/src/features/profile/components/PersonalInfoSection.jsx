// src/features/profile/components/PersonalInfoSection.jsx
// Thông tin cá nhân — cập nhật tên (mockup: ho_so_cai_dat_desktop)

import { useEffect, useState } from "react";
import { useAuth } from "../../../shared/auth/AuthContext";
import { updateName } from "../services/profileService";

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";
const PRIMARY = "#3525cd";
const ON_SURFACE = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const SURFACE_BORDER = "#c7c4d8";
const SURFACE = "#fcf8ff";

const inputStyle = {
  width: "100%",
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

export default function PersonalInfoSection({ onSuccess, onError, showAdminRole = false }) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const trimmed = name.trim();
  const hasChanged = trimmed !== (user?.name ?? "").trim();
  const canSave = hasChanged && trimmed.length > 0 && trimmed.length <= 80;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;

    setSubmitting(true);
    try {
      const data = await updateName(trimmed);
      updateUser({ name: data.name });
      onSuccess?.("Đã cập nhật tên thành công!");
    } catch (err) {
      onError?.(err.message || "Cập nhật tên thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="personal-info" style={{ scrollMarginTop: 90 }}>
      <div style={sectionHeader}>
        <div>
          <h2 style={h2}>Thông tin cá nhân</h2>
          <p style={sectionDesc}>Cập nhật tên hiển thị trên tài khoản của bạn.</p>
        </div>
      </div>

      <div style={sectionCard}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="profile-name" style={labelStyle}>Họ và tên</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn"
              maxLength={80}
              style={inputStyle}
              autoComplete="name"
            />
          </div>

          {showAdminRole && (
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="profile-role" style={labelStyle}>Vai trò</label>
              <input
                id="profile-role"
                type="text"
                value="Quản trị hệ thống"
                readOnly
                style={{ ...inputStyle, background: "#f5f2ff", color: ON_SURFACE_VARIANT, cursor: "not-allowed" }}
              />
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <label htmlFor="profile-email" style={labelStyle}>Email</label>
            <input
              id="profile-email"
              type="email"
              value={user?.email ?? ""}
              readOnly
              style={{ ...inputStyle, background: "#f5f2ff", color: ON_SURFACE_VARIANT, cursor: "not-allowed" }}
            />
            <p style={{ fontFamily: FONT, fontSize: 13, color: ON_SURFACE_VARIANT, margin: "8px 0 0" }}>
              Email không thể thay đổi tại đây.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={!canSave || submitting}
              style={{
                background: !canSave || submitting ? "#c7c4d8" : PRIMARY,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 32px",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: FONT,
                cursor: !canSave || submitting ? "not-allowed" : "pointer",
                minHeight: 44,
                minWidth: 140,
              }}
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
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
