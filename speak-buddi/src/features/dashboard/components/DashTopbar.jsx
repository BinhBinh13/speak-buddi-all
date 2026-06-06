import { useState } from "react";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import house from "../../../assets/icons/house.svg";


export default function DashTopbar({
  title = "Home",
  icon = house,
  user = { name: "Minh", streak: 12, level: "B2" },
}) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <style>{TOPBAR_CSS}</style>
      <header className="dash-topbar">
        {/* Left: page title */}
        <div className="topbar-title">
          <span className="topbar-title-icon">{icon}</span>
          <span className="topbar-title-text">{title}</span>
        </div>

        {/* Right: streak + level + notif + avatar */}
        <div className="topbar-right">
          {/* Streak */}
          <div className="topbar-streak">
            🔥 <strong>{user.streak}</strong>
          </div>

          {/* Level */}
          <div className="topbar-level">{user.level}</div>

          {/* Notification — aria-label cho icon-only button (NFR §4.8-6) */}
          <button
            className={`topbar-notif ${notifOpen ? "open" : ""}`}
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={notifOpen ? "Đóng thông báo" : "Xem thông báo"}
            aria-expanded={notifOpen}
          >
            🔔
            <span className="topbar-notif-dot" aria-hidden="true" />
          </button>

          {/* Avatar */}
          <div className="topbar-avatar">{user.name[0]}</div>
        </div>
      </header>
    </>
  );
}

const TOPBAR_CSS = `
  .dash-topbar {
    height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 clamp(20px, 3vw, 40px);
    background: white;
    border-bottom: 1px solid ${COLORS.creamDark};
    position: sticky; top: 0; z-index: 40;
  }

  /* Title */
  .topbar-title {
    display: flex; align-items: center; gap: 10px;
  }
  .topbar-title-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: ${COLORS.emeraldBg};
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  .topbar-title-text {
    font-family: ${FONTS.display}; font-size: 20px;
    font-weight: 700; color: ${COLORS.navy}; letter-spacing: -0.3px;
  }

  /* Right group */
  .topbar-right {
    display: flex; align-items: center; gap: 10px;
  }
  .topbar-streak {
    display: flex; align-items: center; gap: 5px;
    background: #FEF3DC; border-radius: 99px;
    padding: 5px 13px;
    font-family: ${FONTS.body}; font-size: 13px; color: #854F0B;
  }
  .topbar-level {
    background: ${COLORS.emeraldBg}; border-radius: 99px;
    padding: 5px 12px;
    font-family: ${FONTS.body}; font-size: 12px;
    font-weight: 700; color: ${COLORS.emeraldDark};
  }
  /* Touch target ≥ 44px (NFR §4.8-3): đặt min-width/height 44px,
     padding bù cho visual size 36px */
  .topbar-notif {
    width: 36px; height: 36px; border-radius: 10px;
    background: transparent;
    border: 1px solid ${COLORS.creamDark};
    cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    position: relative; transition: all 0.2s;
    min-width: 44px; min-height: 44px;
  }
  .topbar-notif.open { background: ${COLORS.emeraldBg}; border-color: ${COLORS.emeraldBg2}; }
  .topbar-notif-dot {
    position: absolute; top: 7px; right: 7px;
    width: 7px; height: 7px; border-radius: 50%;
    background: ${COLORS.coral}; border: 1.5px solid white;
  }
  .topbar-avatar {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, ${COLORS.emerald}30, ${COLORS.sky}30);
    border: 2px solid ${COLORS.emeraldBg2};
    display: flex; align-items: center; justify-content: center;
    font-family: ${FONTS.body}; font-size: 13px;
    font-weight: 700; color: ${COLORS.emeraldDark}; cursor: pointer;
  }

  /* Mobile: hide streak/level to save space */
  @media (max-width: 768px) {
    .topbar-streak, .topbar-level { display: none; }
  }

  /* Focus visible — keyboard nav (NFR §4.8-5) */
  .dash-topbar button:focus-visible,
  .dash-topbar a:focus-visible {
    outline: 3px solid #3525cd;
    outline-offset: 2px;
    border-radius: 6px;
  }
`;
