import { useState } from "react";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import house from "../../../assets/icons/house.svg";
import mic from "../../../assets/icons/microphone.svg";
import vocab from "../../../assets/icons/vocab.svg";
const NAV_ITEMS = [
  { label: "Home", icon: house, path: "/dashboard" },
  { label: "Speaking",   icon: mic, path: "/speaking" },
  { label: "New words",   icon: vocab, path: "/vocabulary" },
];


export default function DashSidebar({
  activePath = "/dashboard",
  user = { name: "Minh", level: "B2", goal: "IELTS 7.0", streak: 12 },
}) {
  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      <aside className="dash-sidebar">

        {/* ── Logo ── */}
        <a href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="8"  cy="12" r="2" fill="white" />
              <circle cx="12" cy="9"  r="2" fill="white" />
              <circle cx="16" cy="12" r="2" fill="white" />
            </svg>
          </div>
          <span className="sidebar-logo-text">SpeakBuddi</span>
        </a>

        {/* ── Nav ── */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.label}
              item={item}
              isActive={activePath.startsWith(item.path)}
            />
          ))}
        </nav>

        {/* ── Bottom section ── */}
        <div className="sidebar-bottom">
          {/* Upgrade card */}
          <div className="sidebar-upgrade">
            <div className="sidebar-upgrade-icon">⚡</div>
            <div>
              <div className="sidebar-upgrade-title">Upgrade to Pro</div>
              <div className="sidebar-upgrade-sub">Unlimited Speaking</div>
            </div>
          </div>

          {/* Course info */}
          <SidebarInfo label="COURSE" icon="🇬🇧" value="English" />

          {/* Profile */}
          <SidebarProfile user={user} />
        </div>
      </aside>
    </>
  );
}

function SidebarNavItem({ item, isActive }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={item.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`sidebar-nav-item ${
        isActive ? "active" : ""
      } ${hovered && !isActive ? "hovered" : ""}`}
    >
      <span className="sidebar-nav-icon">
        <img
          src={item.icon}
          alt={item.label}
          className="sidebar-nav-icon-img"
        />
      </span>

      <span className="sidebar-nav-label">
        {item.label}
      </span>

      {isActive && <div className="sidebar-nav-dot" />}
    </a>
  );
}

function SidebarInfo({ label, icon, value }) {
  return (
    <a href="#" className="sidebar-info-row">
      <div className="sidebar-info-icon">{icon}</div>
      <div>
        <div className="sidebar-info-label">{label}</div>
        <div className="sidebar-info-value">{value}</div>
      </div>
      <span className="sidebar-info-arrow">›</span>
    </a>
  );
}

function SidebarProfile({ user }) {
  return (
    <a href="/profile" className="sidebar-info-row">
      <div className="sidebar-avatar">{user.name[0]}</div>
      <div>
        <div className="sidebar-info-label">PROFILE</div>
        <div className="sidebar-info-value">{user.name}</div>
      </div>
      <span className="sidebar-info-arrow">›</span>
    </a>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────
const SIDEBAR_CSS = `
.sidebar-nav-icon {
  width: 24px;
  height: 24px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;
}

.sidebar-nav-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
  .dash-sidebar {
    width: 240px;
    min-width: 240px;
    height: 100vh;
    position: sticky;
    top: 0;
    background: white;
    border-right: 1px solid ${COLORS.creamDark};
    display: flex;
    flex-direction: column;
    padding: 20px 16px;
    box-sizing: border-box;
    overflow-y: auto;
  }

  /* Logo */
  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    padding: 6px 8px;
    margin-bottom: 28px;
  }
  .sidebar-logo-icon {
    width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
    background: linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.emeraldLight});
    display: flex; align-items: center; justify-content: center;
  }
  .sidebar-logo-text {
    font-family: ${FONTS.display};
    font-size: 19px; font-weight: 700;
    color: ${COLORS.navy}; letter-spacing: -0.3px;
  }

  /* Nav */
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }
  /* Touch target ≥ 44px (NFR §4.8-3): padding 10px giúp item ≥ 44px total */
  .sidebar-nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 12px; border-radius: 12px;
    text-decoration: none; position: relative;
    font-family: ${FONTS.body}; font-size: 14.5px; font-weight: 400;
    color: ${COLORS.stone};
    transition: all 0.15s;
    min-height: 44px;
  }
  .sidebar-nav-item.active {
    background: ${COLORS.emeraldBg};
    color: ${COLORS.emeraldDark};
    font-weight: 600;
  }
  .sidebar-nav-item.hovered {
    background: ${COLORS.creamDark};
    color: ${COLORS.navy};
  }
  .sidebar-nav-icon { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
  .sidebar-nav-label { flex: 1; }
  .sidebar-nav-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: ${COLORS.emerald};
  }

  /* Bottom section */
  .sidebar-bottom {
    display: flex; flex-direction: column; gap: 6px;
    padding-top: 16px;
    border-top: 1px solid ${COLORS.creamDark};
    margin-top: 16px;
  }

  /* Upgrade card */
  .sidebar-upgrade {
    display: flex; align-items: center; gap: 10px;
    background: ${COLORS.emeraldBg};
    border-radius: 12px; padding: 11px 12px;
    cursor: pointer; margin-bottom: 4px;
    transition: background 0.15s;
  }
  .sidebar-upgrade:hover { background: ${COLORS.emeraldBg2}; }
  .sidebar-upgrade-icon {
    width: 32px; height: 32px; border-radius: 9px;
    background: ${COLORS.emerald};
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .sidebar-upgrade-title {
    font-family: ${FONTS.body}; font-size: 13px;
    font-weight: 700; color: ${COLORS.emeraldDark};
  }
  .sidebar-upgrade-sub {
    font-family: ${FONTS.body}; font-size: 11px;
    color: ${COLORS.emerald};
  }

  /* Info rows */
  .sidebar-info-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 12px;
    text-decoration: none; cursor: pointer;
    transition: background 0.15s;
  }
  .sidebar-info-row:hover { background: ${COLORS.creamDark}; }
  .sidebar-info-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: ${COLORS.creamDark};
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .sidebar-info-label {
    font-family: ${FONTS.body}; font-size: 10px;
    font-weight: 700; color: ${COLORS.stoneLight};
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .sidebar-info-value {
    font-family: ${FONTS.body}; font-size: 13.5px;
    font-weight: 600; color: ${COLORS.navy};
  }
  .sidebar-info-arrow {
    margin-left: auto; font-size: 18px;
    color: ${COLORS.stoneLight};
  }

  /* Avatar */
  .sidebar-avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, ${COLORS.emerald}30, ${COLORS.sky}30);
    border: 2px solid ${COLORS.emeraldBg2};
    display: flex; align-items: center; justify-content: center;
    font-family: ${FONTS.body}; font-size: 14px;
    font-weight: 700; color: ${COLORS.emeraldDark}; flex-shrink: 0;
  }

  /* Mobile: hide sidebar, show bottom nav instead */
  @media (max-width: 768px) {
    .dash-sidebar { display: none; }
  }
`;
