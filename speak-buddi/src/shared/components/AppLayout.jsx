// speak-buddi/src/shared/components/AppLayout.jsx
// S1.1: harden 4 breakpoints (375/768/1024/1440px) + touch target ≥ 44px +
//       max-width 1280px container (DESIGN.md Fixed-Fluid Hybrid).
import { useLocation } from "react-router-dom";
import { COLORS, FONTS } from "../constants/theme";
import { MAX_WIDTH } from "../constants/breakpoints";
import DashSidebar     from "../../features/dashboard/components/DashSidebar";
import DashTopbar      from "../../features/dashboard/components/DashTopbar";
import MobileBottomNav from "../../features/dashboard/components/MobileBottomNav";

const USER = { name: "Minh", streak: 12, level: "B2", goal: "IELTS 7.0" };

const PAGE_TITLES = {
  "/dashboard":  { title: "Learning path",        icon: "" },
  "/speaking":   { title: "Speaking",             icon: "" },
  "/vocabulary": { title: "New words",            icon: "" },
  "/profile":    { title: "Hồ sơ & Cài đặt",     icon: "" },
  "/roadmap":    { title: "Lộ trình học",          icon: "" },
};

/**
 * AppLayout – shared shell dùng chung cho mọi page có xác thực.
 *
 * Breakpoints (NFR §4.8):
 *   375px  — 1 cột; sidebar ẩn; MobileBottomNav hiện; padding 16px
 *   768px  — sidebar xuất hiện; MobileBottomNav ẩn; content co lại
 *   1024px — sidebar + content + right panel (nếu có)
 *   1440px — content max-width 1280px căn giữa (DESIGN.md)
 *
 * Touch target: mọi nav item ≥ 44×44px (đảm bảo qua padding/min-height).
 *
 * Usage:
 *   <AppLayout>
 *     <YourPageContent />
 *   </AppLayout>
 *
 *   <AppLayout rightPanel={<YourPanel />}>
 *     ...
 *   </AppLayout>
 */
export default function AppLayout({ children, rightPanel = null }) {
  const { pathname } = useLocation();
  const { title, icon } = PAGE_TITLES[pathname] ?? { title: "SpeakBuddi", icon: "✨" };

  return (
    <div style={{ fontFamily: FONTS.body, background: COLORS.cream, minHeight: "100vh" }}>
      <style>{SHELL_CSS}</style>

      {/* Topbar — fixed, spans col 2 + col 3 */}
      <div className="shell-topbar-wrapper">
        <DashTopbar title={title} icon={icon} user={USER} />
      </div>

      <div className="shell-outer">
        {/* Col 1: Sidebar (desktop) */}
        <DashSidebar activePath={pathname} user={USER} />

        {/* Col 2 + 3: main body */}
        <div className="shell-body">
          {/* Content với max-width ở desktop lớn */}
          <div className="shell-content-wrapper">
            <div className="shell-content">
              {children}
            </div>
          </div>
          {rightPanel && (
            <div className="shell-right-panel">{rightPanel}</div>
          )}
        </div>
      </div>

      {/* MobileBottomNav — chỉ hiện trên mobile (≤768px) */}
      <MobileBottomNav activePath={pathname} />
    </div>
  );
}

const SHELL_CSS = `
  /* ── Topbar wrapper ────────────────────────────────────────────── */
  .shell-topbar-wrapper {
    position: fixed;
    top: 0; left: 240px; right: 0;
    z-index: 40;
  }

  /* ── Outer layout: sidebar + body ─────────────────────────────── */
  .shell-outer {
    display: flex;
    min-height: 100vh;
  }

  /* ── Body: content area bên phải sidebar ─────────────────────── */
  .shell-body {
    flex: 1;
    min-width: 0;
    display: flex;
    padding-top: 60px;   /* offset topbar fixed */
  }

  /* ── Content wrapper: giới hạn max-width ở desktop lớn ─────── */
  .shell-content-wrapper {
    flex: 1;
    min-width: 0;
    /* Không đặt max-width ở đây để right panel không bị ép;
       dùng inner padding thay vì margin auto để giữ flex layout */
  }

  .shell-content {
    background: ${COLORS.cream};
    min-height: calc(100vh - 60px);
    /* padding bottom để không bị MobileBottomNav che (mobile) */
    padding-bottom: 0;
  }

  /* ── Right panel (optional) ────────────────────────────────────── */
  .shell-right-panel {
    padding: 20px 20px 24px 0;
    overflow-y: auto;
    height: calc(100vh - 60px);
    position: sticky;
    top: 60px;
  }

  /* ════════════════════════════════════════════════════════════════
     BREAKPOINTS (NFR §4.8)
     ════════════════════════════════════════════════════════════════ */

  /* ── ≥1440px: content container max-width 1280px (DESIGN.md) ── */
  @media (min-width: 1440px) {
    .shell-content-wrapper {
      display: flex;
      justify-content: flex-start;
    }
    .shell-content {
      width: 100%;
      max-width: ${MAX_WIDTH};
    }
  }

  /* ── ≥1024px: sidebar + content; right panel visible ──────────── */
  @media (min-width: 1024px) {
    .shell-right-panel {
      display: block;
    }
  }

  /* ── <1024px: hide right panel ────────────────────────────────── */
  @media (max-width: 1023px) {
    .shell-right-panel {
      display: none;
    }
  }

  /* ── ≤768px: mobile layout ─────────────────────────────────────── */
  @media (max-width: 768px) {
    /* Topbar spans full width (no sidebar) */
    .shell-topbar-wrapper {
      left: 0;
    }

    /* Body left-aligns without sidebar offset */
    .shell-body {
      padding-left: 0;
    }

    /* Content adds padding at bottom for MobileBottomNav (≈68px) */
    .shell-content {
      padding-bottom: 72px;
    }

    /* No horizontal overflow */
    .shell-content-wrapper {
      overflow-x: hidden;
    }
  }

  /* ── ≤375px: very small screen — tighten padding ─────────────── */
  @media (max-width: 375px) {
    .shell-content {
      padding-left: 0;
      padding-right: 0;
    }
  }

  /* ── Focus visible global (§4.8-5) ────────────────────────────── */
  /* Đảm bảo :focus-visible rõ ràng trên link/button trong shell */
  .shell-outer a:focus-visible,
  .shell-outer button:focus-visible,
  .shell-topbar-wrapper a:focus-visible,
  .shell-topbar-wrapper button:focus-visible {
    outline: 3px solid #3525cd;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;
