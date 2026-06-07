import { Link } from "react-router-dom";
import { COLORS, FONTS } from "../../../shared/constants/theme";

export default function DashTopbar({
  user = { name: "Minh" },
}) {
  return (
    <>
      <style>{TOPBAR_CSS}</style>
      <header className="dash-topbar">
        {/* Left: brand name */}
        <a href="/roadmap" className="topbar-brand">
          SpeakBuddi
        </a>

        {/* Right: avatar */}
        <div className="topbar-right">
          <Link to="/profile" className="topbar-avatar" aria-label="Tài khoản của tôi">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </Link>
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
    text-decoration: none;
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
