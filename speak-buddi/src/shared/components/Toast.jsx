import { useEffect } from "react";
import { COLORS, FONTS } from "../constants/theme";

export const TOAST_DURATION_MS = 10000;

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = TOAST_DURATION_MS,
}) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bg = type === "success" ? COLORS.emeraldDark : "#ba1a1a";

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 80,
        right: 24,
        zIndex: 9999,
        background: bg,
        color: COLORS.onPrimary,
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
        maxWidth: "min(420px, calc(100vw - 48px))",
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
          color: COLORS.onPrimary,
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          minWidth: 44,
          minHeight: 44,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
