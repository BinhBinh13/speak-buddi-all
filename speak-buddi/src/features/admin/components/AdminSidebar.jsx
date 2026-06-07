// speak-buddi/src/features/admin/components/AdminSidebar.jsx
// ─── Sidebar trái cho khu vực Admin (S11.1) ─────────────────────────────────
//
// UI tham chiếu: speak-buddi-docs/ui/dashboard_quan_tri_desktop/code.html (SideNavBar)
// + speak-buddi-docs/ui/speak_buddi/DESIGN.md
//
// S11.1 chỉ có trang Overview (/admin/dashboard) — các mục khác (Topics,
// Vocabulary, Tests, Analytics, Payments, Reports, Settings) là placeholder,
// trỏ tới route sẽ được S9.x/S10.x/S11.2-3 nối tiếp. Component này được viết
// để các story admin sau tái dùng (xem rủi ro "trùng lặp nhẹ" trong plan §6).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import LogoutButton from "../../../shared/components/LogoutButton";
import {
  LuLayoutDashboard,
  LuBookOpen,
  LuLibrary,
  LuClipboardList,
  LuChartColumn,
  LuCreditCard,
  LuFlag,
  LuGlobe,
} from "react-icons/lu";

const NAV_ITEMS = [
  { label: "Overview",   Icon: LuLayoutDashboard, path: "/admin/dashboard" },
  { label: "Topics",     Icon: LuBookOpen,        path: "/admin/topics" },
  { label: "Vocabulary", Icon: LuLibrary,         path: "/admin/vocabulary" },
  { label: "Tests",      Icon: LuClipboardList,   path: "/admin/tests" },
  { label: "Crawler",    Icon: LuGlobe,           path: "/admin/crawler" },
  { label: "Analytics",  Icon: LuChartColumn,     path: "/admin/dashboard" },
  { label: "Payments",   Icon: LuCreditCard,      path: "/admin/payments" },
  { label: "Reports",    Icon: LuFlag,            path: "/admin/reports" },
];

/**
 * AdminSidebar — sidebar cố định 256px, port từ mockup Tailwind sang
 * inline-style (bám DESIGN.md: primary indigo, surface tokens, Be Vietnam Pro).
 *
 * @param {{ activePath?: string, adminName?: string }} props
 */
export default function AdminSidebar({ activePath = "/admin/dashboard", adminName = "Admin" }) {
  const navigate = useNavigate();

  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      <aside className="admin-sidebar">
        {/* ── Brand + admin info ── */}
        <div className="admin-sidebar-header">
          <button
            type="button"
            className="admin-sidebar-account"
            onClick={() => navigate("/admin/profile")}
            aria-label="Xem hồ sơ quản trị"
          >
            <div className="admin-sidebar-avatar">{adminName?.[0]?.toUpperCase() ?? "A"}</div>
            <div>
              <div className="admin-sidebar-account-name">{adminName}</div>
              <div className="admin-sidebar-account-role">Quản trị hệ thống</div>
            </div>
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="admin-sidebar-nav" aria-label="Điều hướng quản trị">
          {NAV_ITEMS.map((item) => (
            <AdminNavItem
              key={item.label}
              item={item}
              isActive={
                activePath === item.path &&
                !(item.label === "Analytics" && activePath === "/admin/dashboard") &&
                !(item.label === "Overview" && activePath === "/admin/reports")
              }
              onNavigate={() => navigate(item.path)}
            />
          ))}
        </nav>

        {/* ── Bottom: đăng xuất ── */}
        <div className="admin-sidebar-bottom">
          <LogoutButton variant="sidebar-admin" />
        </div>
      </aside>
    </>
  );
}

function AdminNavItem({ item, isActive, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = item;

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`admin-nav-item${isActive ? " active" : ""}${hovered && !isActive ? " hovered" : ""}`}
    >
      <span className="admin-nav-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
      </span>
      <span className="admin-nav-label">{item.label}</span>
    </button>
  );
}

const SIDEBAR_CSS = `
  .admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    width: 256px;
    height: 100vh;
    background: linear-gradient(180deg, ${COLORS.surfaceLow} 0%, #f0ecff 100%);
    border-right: 1px solid ${COLORS.primary};
    box-shadow: 4px 0 24px rgba(53, 37, 205, 0.06);
    display: flex;
    flex-direction: column;
    padding: 16px 8px 20px;
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ── Header ── */
  .admin-sidebar-header {
    padding: 8px 12px 20px;
    margin-bottom: 16px;
    border-bottom: 1px solid ${COLORS.surfaceContainerHigh};
  }
  .admin-sidebar-account {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 4px 8px;
    margin: 0;
    border: none;
    border-radius: 10px;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
  }
  .admin-sidebar-account:hover {
    background: ${COLORS.surfaceContainerHigh};
  }
  .admin-sidebar-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryContainer});
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${FONTS.display};
    font-size: 15px;
    font-weight: 700;
  }
  .admin-sidebar-account-name {
    font-family: ${FONTS.display};
    font-size: 15px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    line-height: 1.3;
  }
  .admin-sidebar-account-role {
    font-family: ${FONTS.body};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${COLORS.onSurfaceVariant};
  }

  /* ── Nav ── */
  .admin-sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }
  .admin-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 8px;
    border: none;
    border-right: 4px solid transparent;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    min-height: 44px;
    width: 100%;
  }
  .admin-nav-item.active {
    color: ${COLORS.primary};
    font-weight: 700;
    background: ${COLORS.surfaceContainerHigh};
    border-right-color: ${COLORS.primary};
  }
  .admin-nav-item.hovered {
    background: ${COLORS.surfaceContainerHigh};
    color: ${COLORS.onSurface};
  }
  .admin-nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .admin-nav-label {
    flex: 1;
  }

  /* ── Bottom ── */
  .admin-sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 12px;
    border-top: 1px solid ${COLORS.surfaceContainerHigh};
    margin-top: 12px;
  }
  /* Focus visible (NFR §4.8-5) */
  .admin-sidebar button:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-radius: 8px;
  }

  /* Mobile/tablet: ẩn sidebar (giống DashSidebar) — chừa chỗ cho hamburger sau */
  @media (max-width: 1024px) {
    .admin-sidebar { display: none; }
  }
`;
