import { useState } from "react";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import LogoutButton from "../../../shared/components/LogoutButton";
import { useAuth } from "../../../shared/auth/AuthContext";
import {
  LuMap,
  LuBookOpen,
  LuClipboardList,
  LuMic,
  LuChartBar,
  LuLanguages,
} from "react-icons/lu";

const ALL_NAV_ITEMS = [
  { label: "Roadmap",    Icon: LuMap,             path: "/roadmap",    vocabOnly: true  },
  { label: "Vocabulary", Icon: LuBookOpen,        path: "/vocabulary", vocabOnly: true  },
  { label: "Quiz",       Icon: LuClipboardList,   path: "/quiz",       vocabOnly: true  },
  { label: "Dịch thuật", Icon: LuLanguages,       path: "/translate",  vocabOnly: false },
  { label: "Speaking",   Icon: LuMic,             path: "/speaking",   vocabOnly: false },
  { label: "Analytics",  Icon: LuChartBar,        path: "/analytics",  vocabOnly: false },
];

export default function DashSidebar({
  activePath = "/roadmap",
}) {
  const { isPaid, user } = useAuth();
  const isSpeakingOnly = user?.words_per_session === 0;
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(
    (item) => !isSpeakingOnly || !item.vocabOnly
  );

  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      <aside className="dash-sidebar">

        {/* ── Logo ── */}
        <a href="/roadmap" className="sidebar-logo">
          <div className="sidebar-logo-badge">
            <span className="sidebar-logo-initials">SB</span>
          </div>
          <div className="sidebar-logo-text-group">
            <span className="sidebar-logo-name">SpeakBuddi</span>
            <span className="sidebar-logo-sub">English Learning</span>
          </div>
        </a>

        {/* ── Nav ── */}
        <nav className="sidebar-nav" aria-label="Điều hướng học tập">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.label}
              item={item}
              isActive={activePath === item.path || activePath.startsWith(item.path + "/")}
            />
          ))}
        </nav>

        {/* ── Bottom ── */}
        <div className="sidebar-bottom">
          {!isPaid && (
            <a href="/payment/checkout" className="sidebar-upgrade-btn">
              Upgrade to Pro
            </a>
          )}
          <div className="sidebar-bottom-divider" aria-hidden="true" />
          <LogoutButton variant="sidebar-user" />
        </div>
      </aside>
    </>
  );
}

function SidebarNavItem({ item, isActive }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = item;

  return (
    <a
      href={item.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={isActive ? "page" : undefined}
      className={`sidebar-nav-item${isActive ? " active" : ""}${hovered && !isActive ? " hovered" : ""}`}
    >
      <span className="sidebar-nav-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
      </span>
      <span className="sidebar-nav-label">{item.label}</span>
    </a>
  );
}

const SIDEBAR_CSS = `
  .dash-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    width: 240px;
    height: 100vh;
    background: ${COLORS.surfaceLow};
    border-right: 1px solid ${COLORS.outlineVariant};
    display: flex;
    flex-direction: column;
    padding: 24px 16px 20px;
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ── Logo ── */
  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    padding: 4px 8px;
    margin-bottom: 32px;
    border-radius: 10px;
    transition: background 0.15s;
  }
  .sidebar-logo:hover {
    background: ${COLORS.surfaceContainerHigh};
  }
  .sidebar-logo-badge {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
    background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryContainer});
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sidebar-logo-initials {
    font-family: ${FONTS.display};
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
  }
  .sidebar-logo-text-group {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .sidebar-logo-name {
    font-family: ${FONTS.display};
    font-size: 15px;
    font-weight: 700;
    color: ${COLORS.onSurface};
    letter-spacing: -0.2px;
    line-height: 1.2;
  }
  .sidebar-logo-sub {
    font-family: ${FONTS.body};
    font-size: 11px;
    font-weight: 400;
    color: ${COLORS.onSurfaceVariant};
    line-height: 1.2;
  }

  /* ── Nav ── */
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .sidebar-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 12px;
    text-decoration: none;
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    transition: background 0.15s, color 0.15s;
    min-height: 44px;
  }
  .sidebar-nav-item.active {
    background: ${COLORS.primary};
    color: #ffffff;
  }
  .sidebar-nav-item.hovered {
    background: ${COLORS.surfaceContainerHigh};
    color: ${COLORS.onSurface};
  }
  .sidebar-nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sidebar-nav-label {
    flex: 1;
  }

  /* ── Bottom ── */
  .sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 20px;
    border-top: 1px solid ${COLORS.outlineVariant};
    margin-top: 16px;
  }
  .sidebar-upgrade-btn {
    display: block;
    width: 100%;
    padding: 12px 16px;
    background: ${COLORS.primary};
    color: #ffffff;
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    border-radius: 12px;
    text-decoration: none;
    transition: background 0.15s, transform 0.1s;
    box-sizing: border-box;
    min-height: 44px;
    line-height: 20px;
  }
  .sidebar-upgrade-btn:hover {
    background: ${COLORS.primaryContainer};
    color: #ffffff;
    transform: translateY(-1px);
  }
  .sidebar-bottom-divider {
    height: 1px;
    width: 100%;
    background: ${COLORS.outlineVariant};
    margin: 4px 0;
  }

  /* Focus visible (NFR §4.8-5) */
  .dash-sidebar a:focus-visible,
  .dash-sidebar button:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-radius: 10px;
  }

  /* Mobile: ẩn sidebar */
  @media (max-width: 768px) {
    .dash-sidebar { display: none; }
  }
`;
