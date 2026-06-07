// speak-buddi/src/features/admin/components/AdminToast.jsx
// Toast nhỏ gọn cho khu vực Admin (S9.1) — pattern từ ProfilePage.

import { COLORS, FONTS } from "../../../shared/constants/theme";

export default function AdminToast({ message, type = "success", onClose }) {
  if (!message) return null;
  const bg = type === "success" ? COLORS.emeraldDark : "#ba1a1a";

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: bg,
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 10,
        fontFamily: FONTS.body,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 280,
        maxWidth: "90vw",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng thông báo"
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          minWidth: 44,
          minHeight: 44,
        }}
      >
        ×
      </button>
    </div>
  );
}
