// speak-buddi/src/features/admin/components/AdminTopbar.jsx
// ─── Top bar cho khu vực Admin (S11.1) ──────────────────────────────────────
// UI tham chiếu: dashboard_quan_tri_desktop/code.html (TopNavBar — sticky + blur)

import { LuBell, LuSettings } from "react-icons/lu";
import { COLORS, FONTS } from "../../../shared/constants/theme";

/**
 * @param {{ title?: string, adminName?: string }} props
 */
export default function AdminTopbar({ title = "Dashboard", adminName = "Admin" }) {
  return (
    <>
      <style>{TOPBAR_CSS}</style>
      <header className="admin-topbar">
        <div className="admin-topbar-title">{title}</div>
        <div className="admin-topbar-right">
          <button className="admin-topbar-icon-btn" aria-label="Thông báo">
            <LuBell size={18} strokeWidth={1.8} />
          </button>
          <button className="admin-topbar-icon-btn" aria-label="Cài đặt">
            <LuSettings size={18} strokeWidth={1.8} />
          </button>
          <div className="admin-topbar-avatar" aria-label="Tài khoản admin">
            {adminName?.[0]?.toUpperCase() ?? "A"}
          </div>
        </div>
      </header>
    </>
  );
}

const TOPBAR_CSS = `
  .admin-topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    background: rgba(252, 248, 255, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-bottom: 1px solid ${COLORS.outlineVariant};
    box-sizing: border-box;
  }
  .admin-topbar-title {
    font-family: ${FONTS.display};
    font-size: 20px;
    font-weight: 700;
    color: ${COLORS.primary};
  }
  .admin-topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .admin-topbar-icon-btn {
    width: 40px;
    height: 40px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 999px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: ${COLORS.onSurfaceVariant};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }
  .admin-topbar-icon-btn:hover {
    background: ${COLORS.surfaceContainerHigh};
    color: ${COLORS.primary};
  }
  .admin-topbar-avatar {
    width: 36px;
    height: 36px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryContainer});
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${FONTS.display};
    font-size: 14px;
    font-weight: 700;
  }

  /* Focus visible (NFR §4.8-5) */
  .admin-topbar button:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-radius: 999px;
  }

  @media (max-width: 768px) {
    .admin-topbar { padding: 12px 16px; }
    .admin-topbar-title { font-size: 18px; }
  }
`;
