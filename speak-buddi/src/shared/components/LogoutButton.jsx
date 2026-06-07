// src/shared/components/LogoutButton.jsx — S1.9: nút Đăng xuất tái sử dụng (user + admin sidebar)
// UI tham chiếu: lo_trinh_hoc_tap_snake_style, luyen_phat_am_desktop, hoi_thoai_ai_desktop (footer Sign Out)
import { useState } from "react";
import { LuLogOut } from "react-icons/lu";
import { COLORS, FONTS } from "../constants/theme";
import { useLogout } from "../auth/useLogout";

const ERROR_CONTAINER = "#ffdad6";
const ON_ERROR_CONTAINER = "#93000a";

/**
 * @param {{ variant?: "sidebar-user" | "sidebar-admin", className?: string }} props
 */
export default function LogoutButton({ variant = "sidebar-user", className = "" }) {
  const handleLogout = useLogout();
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <style>{BUTTON_CSS}</style>
      <button
        type="button"
        className={`logout-btn logout-btn--${variant}${className ? ` ${className}` : ""}${hovered ? " hovered" : ""}`}
        onClick={handleLogout}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Đăng xuất"
      >
        <span className="logout-btn-icon" aria-hidden="true">
          <LuLogOut size={18} strokeWidth={1.8} />
        </span>
        <span className="logout-btn-label">Đăng xuất</span>
      </button>
    </>
  );
}

const BUTTON_CSS = `
  .logout-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 14px;
    border-radius: 12px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    min-height: 44px;
    box-sizing: border-box;
    transition: background 0.15s, color 0.15s;
  }
  .logout-btn--sidebar-user {
    border-radius: 12px;
  }
  .logout-btn--sidebar-admin {
    border-radius: 8px;
  }
  .logout-btn.hovered,
  .logout-btn:hover {
    background: ${ERROR_CONTAINER};
    color: ${ON_ERROR_CONTAINER};
  }
  .logout-btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .logout-btn-label {
    flex: 1;
  }
  .logout-btn:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
  }
`;
