// src/features/profile/components/DeleteAccountSection.jsx
// Vùng nguy hiểm — xóa tài khoản & dữ liệu cá nhân — S12.2
// Mockup: speak-buddi-docs/ui/ho_so_cai_dat_desktop/code.html (Danger Zone, ~412–423)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { deleteAccount } from "../services/profileService";
import ConfirmDeleteAccountModal from "./ConfirmDeleteAccountModal";

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";
const ERROR = "#ba1a1a";
const ERROR_BG = "rgba(186, 26, 26, 0.08)";
const ON_SURFACE_VARIANT = "#464555";

export default function DeleteAccountSection({ onSuccess }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // has_password từ /api/auth/me (S12.2); session cũ thiếu field → yêu cầu password để an toàn
  const requiresPassword = user?.has_password !== false;

  function openModal() {
    setConfirmText("");
    setPassword("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) return;
    setShowModal(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await deleteAccount({
        confirm_text: confirmText.trim(),
        password: requiresPassword ? password : undefined,
      });
      setShowModal(false);
      logout();
      sessionStorage.setItem("auth_msg", "Tài khoản và dữ liệu cá nhân của bạn đã được xóa.");
      onSuccess?.("Tài khoản và dữ liệu cá nhân của bạn đã được xóa.");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Không thể xóa tài khoản. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="danger-zone" style={{ scrollMarginTop: 90, paddingTop: 8 }}>
      <div
        style={{
          background: ERROR_BG,
          border: `1px solid rgba(186, 26, 26, 0.2)`,
          borderRadius: 12,
          padding: "24px clamp(20px, 4vw, 28px)",
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <h2
            style={{
              fontFamily: FONT,
              fontSize: 20,
              fontWeight: 600,
              color: ERROR,
              margin: "0 0 8px",
            }}
          >
            Xóa tài khoản &amp; dữ liệu cá nhân
          </h2>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 15,
              color: ON_SURFACE_VARIANT,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Xóa vĩnh viễn dữ liệu cá nhân, tiến độ học tập, kết quả kiểm tra và lịch sử dịch của bạn.
            Hành động này không thể hoàn tác.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          style={{
            flexShrink: 0,
            background: "transparent",
            border: `1px solid ${ERROR}`,
            color: ERROR,
            borderRadius: 10,
            padding: "12px 24px",
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            minHeight: 44,
            minWidth: 140,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(186, 26, 26, 0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          Xóa tài khoản
        </button>
      </div>

      <ConfirmDeleteAccountModal
        show={showModal}
        onHide={closeModal}
        confirmText={confirmText}
        onConfirmTextChange={setConfirmText}
        password={password}
        onPasswordChange={setPassword}
        requiresPassword={requiresPassword}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
