// src/features/profile/components/ConfirmDeleteAccountModal.jsx
// Modal xác nhận xóa tài khoản & dữ liệu cá nhân — S12.2
// Mockup tham chiếu: speak-buddi-docs/ui/ho_so_cai_dat_desktop (Danger Zone confirm flow)

import { Modal } from "react-bootstrap";

const FONT   = "'Be Vietnam Pro', system-ui, sans-serif";
const ERROR  = "#ba1a1a";
const ON_SURFACE = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const SURFACE_BORDER = "#c7c4d8";

const MODAL_CSS = `
  .profile-delete-modal {
    border-radius: 14px !important;
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  }
`;

export default function ConfirmDeleteAccountModal({
  show,
  onHide,
  confirmText,
  onConfirmTextChange,
  password,
  onPasswordChange,
  requiresPassword,
  submitting,
  error,
  onSubmit,
}) {
  const canSubmit =
    confirmText.trim() === "XOA" &&
    (!requiresPassword || (password && password.length > 0)) &&
    !submitting;

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="profile-delete-modal">
      <style>{MODAL_CSS}</style>
      <Modal.Header closeButton style={{ borderBottom: `1px solid ${SURFACE_BORDER}` }}>
        <Modal.Title style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, color: ON_SURFACE }}>
          Xác nhận xóa tài khoản
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ paddingTop: 20 }}>
        <p style={{ fontFamily: FONT, fontSize: 15, color: ON_SURFACE, lineHeight: 1.6, margin: "0 0 16px" }}>
          Hành động này <strong>không thể hoàn tác</strong>. Các dữ liệu sau sẽ bị xóa vĩnh viễn:
        </p>
        <ul
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: ON_SURFACE_VARIANT,
            lineHeight: 1.6,
            margin: "0 0 20px",
            paddingLeft: 20,
          }}
        >
          <li>Hồ sơ cá nhân (tên, trình độ, mục tiêu, sở thích)</li>
          <li>Tiến độ học từ vựng và kết quả bài kiểm tra</li>
          <li>Lịch sử dịch thuật</li>
          <li>Liên kết đăng nhập Google (OAuth)</li>
          <li>Tùy chọn giọng đọc (nếu có)</li>
        </ul>

        <label
          htmlFor="delete-confirm-text"
          style={{ display: "block", fontFamily: FONT, fontSize: 14, fontWeight: 600, color: ON_SURFACE, marginBottom: 8 }}
        >
          Nhập <strong>XOA</strong> để xác nhận
        </label>
        <input
          id="delete-confirm-text"
          type="text"
          value={confirmText}
          onChange={(e) => onConfirmTextChange(e.target.value)}
          placeholder="Nhập XOA để xác nhận"
          autoComplete="off"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${SURFACE_BORDER}`,
            fontFamily: FONT,
            fontSize: 15,
            marginBottom: requiresPassword ? 16 : 0,
            minHeight: 44,
          }}
        />

        {requiresPassword && (
          <>
            <label
              htmlFor="delete-confirm-password"
              style={{
                display: "block",
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: ON_SURFACE,
                marginBottom: 8,
                marginTop: 16,
              }}
            >
              Mật khẩu hiện tại
            </label>
            <input
              id="delete-confirm-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${SURFACE_BORDER}`,
                fontFamily: FONT,
                fontSize: 15,
                minHeight: 44,
              }}
            />
          </>
        )}

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: FONT,
              fontSize: 14,
              color: ERROR,
              margin: "16px 0 0",
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: `1px solid ${SURFACE_BORDER}`, gap: 12 }}>
        <button
          type="button"
          onClick={onHide}
          disabled={submitting}
          style={{
            background: "transparent",
            border: `1px solid ${SURFACE_BORDER}`,
            borderRadius: 8,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            color: ON_SURFACE_VARIANT,
            cursor: submitting ? "not-allowed" : "pointer",
            fontFamily: FONT,
            minHeight: 44,
          }}
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          style={{
            background: canSubmit ? ERROR : "#c7c4d8",
            border: "none",
            borderRadius: 8,
            padding: "10px 28px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontFamily: FONT,
            minHeight: 44,
          }}
        >
          {submitting ? "Đang xóa..." : "Xóa vĩnh viễn"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
