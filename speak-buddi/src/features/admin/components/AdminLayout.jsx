// speak-buddi/src/features/admin/components/AdminLayout.jsx
// ─── Shell layout cho khu vực Admin (S9.1) ──────────────────────────────────
// UI: quan_li_chu_de_admin + dashboard_quan_tri_desktop (sidebar/topbar)

import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { COLORS } from "../../../shared/constants/theme";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

const TITLE_MAP = [
  { match: /^\/admin\/dashboard$/, title: "Dashboard" },
  { match: /^\/admin\/topics$/, title: "Topics Library" },
  { match: /^\/admin\/vocabulary$/, title: "Vocabulary" },
  { match: /^\/admin\/tests$/, title: "Tests Repository" },
  { match: /^\/admin\/crawler$/, title: "Content Crawler Tool" },
  { match: /^\/admin\/payments$/, title: "Payment Plans" },
  { match: /^\/admin\/profile$/, title: "Hồ sơ & Cài đặt" },
  { match: /^\/admin\/reports$/, title: "Báo cáo & Xuất file" },
  { match: /^\/admin\/tests\//, title: "Edit Test Q&A" },
];

function resolveTitle(pathname) {
  const found = TITLE_MAP.find((t) => t.match.test(pathname));
  return found?.title ?? "Admin";
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const adminName = user?.name || user?.email?.split("@")[0] || "Admin";

  return (
    <>
      <style>{LAYOUT_CSS}</style>
      <div className="admin-layout">
        <div className="admin-sidebar-slot">
          <AdminSidebar activePath={pathname} adminName={adminName} />
        </div>
        <div className="admin-main">
          <AdminTopbar title={resolveTitle(pathname)} adminName={adminName} />
          <main className="admin-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

const LAYOUT_CSS = `
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: ${COLORS.surface};
  }
  .admin-sidebar-slot {
    width: 256px;
    min-width: 256px;
    flex-shrink: 0;
  }
  .admin-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding-top: 64px;
  }
  .admin-content {
    flex: 1;
    padding: 24px 32px 40px;
    box-sizing: border-box;
  }
  @media (max-width: 1024px) {
    .admin-sidebar-slot { display: none; }
    .admin-content { padding: 16px; }
  }
`;
