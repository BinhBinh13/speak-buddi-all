import { useState } from "react";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import { LuGlobe, LuBell } from "react-icons/lu";

export default function DashTopbar({
  user = { name: "Minh" },
}) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <style>{TOPBAR_CSS}</style>
      <header className="dash-topbar">
        {/* Left: brand name */}
        <a href="/dashboard" className="topbar-brand">
          SpeakBuddi
        </a>

        {/* Right: globe + bell + avatar */}
        <div className="topbar-right">
          {/* Language / Globe */}
          <button className="topbar-icon-btn" aria-label="Chọn ngôn ngữ">
            <LuGlobe size={18} strokeWidth={1.8} />
          </button>

          {/* Notifications */}
          <button
            className={`topbar-icon-btn${notifOpen ? " active" : ""}`}
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={notifOpen ? "Đóng thông báo" : "Xem thông báo"}
            aria-expanded={notifOpen}
          >
            <LuBell size={18} strokeWidth={1.8} />
            <span className="topbar-notif-dot" aria-hidden="true" />
          </button>

          {/* Avatar */}
          <button className="topbar-avatar" aria-label="Tài khoản của tôi">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </button>
        </div>
      </header>
    </>
  );
}

const TOPBAR_CSS = `
  .dash-topbar {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: ${COLORS.white};
    border-bottom: 1px solid ${COLORS.outlineVariant};
    box-sizing: border-box;
  }

  /* Brand */
  .topbar-brand {
    font-family: ${FONTS.display};
    font-size: 16px;
    font-weight: 700;
    color: ${COLORS.onSurface};
    text-decoration: none;
    letter-spacing: -0.2px;
    transition: color 0.15s;
  }
  .topbar-brand:hover {
    color: ${COLORS.primary};
  }

  /* Right group */
  .topbar-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Icon buttons */
  .topbar-icon-btn {
    width: 36px;
    height: 36px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: ${COLORS.onSurfaceVariant};
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: background 0.15s, color 0.15s;
  }
  .topbar-icon-btn:hover {
    background: ${COLORS.surfaceContainer};
    color: ${COLORS.onSurface};
  }
  .topbar-icon-btn.active {
    background: ${COLORS.primaryBg};
    color: ${COLORS.primary};
  }

  /* Notification dot */
  .topbar-notif-dot {
    position: absolute;
    top: 9px;
    right: 9px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${COLORS.coral};
    border: 1.5px solid ${COLORS.white};
  }

  /* Avatar button */
  .topbar-avatar {
    width: 34px;
    height: 34px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 50%;
    background: ${COLORS.onSurface};
    border: none;
    cursor: pointer;
    font-family: ${FONTS.body};
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;
  }
  .topbar-avatar:hover {
    opacity: 0.85;
  }

  /* Focus visible (NFR §4.8-5) */
  .dash-topbar button:focus-visible,
  .dash-topbar a:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-radius: 8px;
  }
`;
