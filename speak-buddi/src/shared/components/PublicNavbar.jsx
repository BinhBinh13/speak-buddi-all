import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { COLORS, FONTS } from "../constants/theme";
import { UI } from "../constants/designTokens";
import { useScrolled } from "../hooks/useScrolled";

// ── Config ─────────────────────────────────────────────────────────
const APP_NAV_ITEMS = [
  { label: "Roadmap",    path: "/roadmap"    },
  { label: "Speaking",   path: "/speaking"   },
  { label: "Vocabulary", path: "/vocabulary" },
  { label: "Progress",   path: "/analytics"  },
];

const APP_ROUTES = ["/roadmap", "/speaking", "/vocabulary", "/schedule", "/analytics"];

function isAppRoute(path) {
  return APP_ROUTES.some((r) => path.startsWith(r));
}

// ── Main ────────────────────────────────────────────────────────────
export default function PublicNavbar({ forcePath }) {
  const scrolled        = useScrolled(20);
  const { pathname: locationPathname } = useLocation();
  const pathname        = forcePath ?? locationPathname;
  const isApp           = isAppRoute(pathname);
  const hasBg     = scrolled || isApp;

  return (
    <nav
      style={{
        position: isApp ? "sticky" : "fixed",
        top: 0, left: 0, right: 0, zIndex: 100,
        background: hasBg ? "rgba(252,248,255,0.92)" : "rgba(252,248,255,0.0)",
        backdropFilter: hasBg ? "blur(14px)" : "none",
        borderBottom: hasBg ? `1px solid ${UI.outlineVariant}` : "none",
        transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
        padding: `0 clamp(16px, 5vw, ${UI.spacing.marginDesktop})`,
      }}
    >
      <div
        style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          height: 68, gap: 16,
        }}
      >
        <Logo />
        {isApp ? <AppNav pathname={pathname} /> : <PublicLinks />}
        {isApp ? <AppRight /> : <PublicCTA />}
      </div>
    </nav>
  );
}

// ── Logo ────────────────────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" style={{ textDecoration: "none", flexShrink: 0 }}>
      <span
        style={{
          fontFamily: UI.font,
          fontSize: UI.fontSize.h2,
          fontWeight: UI.fontWeight.h2,
          color: UI.primary,
          letterSpacing: "-0.02em",
        }}
      >
        SpeakBuddi
      </span>
    </Link>
  );
}

// ── Public nav links ────────────────────────────────────────────────
function PublicLinks() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      <Link
        to="/#features"
        style={{
          fontFamily: UI.font, fontSize: UI.fontSize.labelMd, fontWeight: UI.fontWeight.labelMd,
          color: UI.onSurfaceVariant, textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.color = UI.primary)}
        onMouseLeave={(e) => (e.target.style.color = UI.onSurfaceVariant)}
      >
        Tính năng
      </Link>
      <Link
        to="/#pricing"
        style={{
          fontFamily: UI.font, fontSize: UI.fontSize.labelMd, fontWeight: UI.fontWeight.labelMd,
          color: UI.onSurfaceVariant, textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.color = UI.primary)}
        onMouseLeave={(e) => (e.target.style.color = UI.onSurfaceVariant)}
      >
        Bảng giá
      </Link>
      <Link
        to="/login"
        style={{
          fontFamily: UI.font, fontSize: UI.fontSize.labelMd, fontWeight: UI.fontWeight.labelMd,
          color: UI.onSurfaceVariant, textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.color = UI.primary)}
        onMouseLeave={(e) => (e.target.style.color = UI.onSurfaceVariant)}
      >
        Đăng nhập
      </Link>
    </div>
  );
}

// ── Public CTA ──────────────────────────────────────────────────────
function PublicCTA() {
  return (
    <Link
      to="/login"
      style={{
        fontFamily: UI.font, fontSize: UI.fontSize.labelMd, fontWeight: UI.fontWeight.labelMd,
        background: UI.primary, color: UI.onPrimary,
        textDecoration: "none",
        borderRadius: UI.radius.full,
        padding: "10px 24px",
        minHeight: 44, display: "inline-flex", alignItems: "center",
        transition: "opacity 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      Bắt đầu miễn phí
    </Link>
  );
}

// ── App nav (dashboard / speaking / ...) ───────────────────────────
function AppNav({ pathname }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
      {APP_NAV_ITEMS.map((item) => (
        <AppNavItem key={item.label} item={item} isActive={pathname.startsWith(item.path)} />
      ))}
    </nav>
  );
}

function AppNavItem({ item, isActive }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={item.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 14px", borderRadius: 8,
        fontFamily: FONTS.body, fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? COLORS.emeraldDark : COLORS.navyMid,
        background: isActive ? COLORS.emeraldBg : hovered ? COLORS.creamDark : "transparent",
        opacity: isActive ? 1 : hovered ? 1 : 0.75,
        textDecoration: "none", transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >
      {item.label}
    </a>
  );
}

// ── App right (streak + level + avatar placeholder) ─────────────────
function AppRight() {
  const [notifOpen, setNotifOpen] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "#FEF3DC", borderRadius: 99, padding: "5px 12px",
          fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: "#854F0B",
        }}
      >
        🔥 0
      </div>

      <div
        style={{
          background: COLORS.emeraldBg, borderRadius: 99, padding: "5px 12px",
          fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: COLORS.emeraldDark,
        }}
      >
        B1
      </div>

      {/* Notification button — aria-label, touch target ≥ 44px (NFR §4.8-3/6) */}
      <button
        onClick={() => setNotifOpen((v) => !v)}
        aria-label={notifOpen ? "Đóng thông báo" : "Xem thông báo"}
        aria-expanded={notifOpen}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: notifOpen ? COLORS.emeraldBg : "transparent",
          border: `1px solid ${notifOpen ? COLORS.emeraldBg2 : COLORS.creamDark}`,
          cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", transition: "all 0.2s",
          minWidth: 44, minHeight: 44,
        }}
      >
        🔔
        <span
          aria-hidden="true"
          style={{
            position: "absolute", top: 6, right: 6,
            width: 7, height: 7, borderRadius: "50%",
            background: COLORS.coral, border: "1.5px solid white",
          }}
        />
      </button>

      <div
        style={{
          width: 34, height: 34, borderRadius: 10,
          background: `linear-gradient(135deg, ${COLORS.emerald}30, ${COLORS.sky}30)`,
          border: `2px solid ${COLORS.emeraldBg2}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONTS.body, fontSize: 13, fontWeight: 700,
          color: COLORS.emeraldDark, cursor: "pointer",
        }}
      >
        M
      </div>
    </div>
  );
}
