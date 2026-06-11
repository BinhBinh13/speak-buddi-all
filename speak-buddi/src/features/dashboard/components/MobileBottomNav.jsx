// S1.1: thêm aria-label, aria-current, touch target ≥ 44px (NFR §4.8-3/6)
import { COLORS, FONTS } from "../../../shared/constants/theme";
import { useAuth } from "../../../shared/auth/AuthContext";
import house from "../../../assets/icons/house.svg";
import mic from "../../../assets/icons/microphone.svg";
import vocab from "../../../assets/icons/vocab.svg";

const ALL_NAV_ITEMS = [
  { label: "Roadmap",   icon: house, path: "/roadmap",    vocabOnly: true  },
  { label: "Speaking",  icon: mic,   path: "/speaking",   vocabOnly: false },
  { label: "New words", icon: vocab, path: "/vocabulary", vocabOnly: true  },
];

/**
 * MobileBottomNav – Thanh nav dưới cùng cho mobile (thay thế sidebar)
 * Touch target: mỗi item tối thiểu 44×44px (NFR §4.8-3).
 * ARIA: aria-label + aria-current cho screen reader (NFR §4.8-6).
 */
export default function MobileBottomNav({ activePath = "/roadmap" }) {
  const { user } = useAuth();
  const isSpeakingOnly = user?.words_per_session === 0;
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(
    (item) => !isSpeakingOnly || !item.vocabOnly
  );

  return (
    <>
      <style>{BOTTOM_NAV_CSS}</style>

      <nav className="mobile-bottom-nav" aria-label="Điều hướng chính">
        {NAV_ITEMS.map((item) => {
          const isActive = activePath.startsWith(item.path);

          return (
            <a
              key={item.label}
              href={item.path}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`mobile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="mobile-nav-icon" aria-hidden="true">
                {item.icon ? (
                  <img
                    src={item.icon}
                    alt=""
                    style={{
                      width: 22,
                      height: 22,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  /* Roadmap inline SVG */
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ color: "inherit" }}>
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3c0 1.1.9 2 2 2zm-2-12h2V7H3v2zm12 12h2v-2h-2v2zm4-18H5c-1.1 0-2 .9-2 2v2h2V5h14v14h-4v2h4c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12h2v-2h-2v2zm-4 4h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V9H7v2zm4 8h2v-2h-2v2zm0-8h2V9h-2v2z"/>
                  </svg>
                )}
              </span>

              <span className="mobile-nav-label">
                {item.label}
              </span>

              {isActive && <div className="mobile-nav-indicator" />}
            </a>
          );
        })}
      </nav>
    </>
  );
}

const BOTTOM_NAV_CSS = `
  /* Only show on mobile */
  .mobile-bottom-nav {
    display: none;
  }

  @media (max-width: 768px) {
    .mobile-bottom-nav {
      display: flex;
      position: fixed; bottom: 0; left: 0; right: 0;
      z-index: 100;
      background: rgba(250,250,247,0.96);
      backdrop-filter: blur(12px);
      border-top: 1px solid ${COLORS.creamDark};
      padding: 6px 0 max(6px, env(safe-area-inset-bottom));
      justify-content: space-around;
    }

    /* Touch target ≥ 44×44px (NFR §4.8-3) */
    .mobile-nav-item {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 3px;
      padding: 0 12px;
      text-decoration: none; position: relative;
      flex: 1;
      min-height: 44px;
      min-width: 44px;
    }

    .mobile-nav-icon {
      font-size: 20px;
      transition: transform 0.15s;
    }
    .mobile-nav-item.active .mobile-nav-icon {
      transform: scale(1.15);
    }

    .mobile-nav-label {
      font-family: ${FONTS.body}; font-size: 10px;
      font-weight: 500; color: ${COLORS.stoneLight};
    }
    .mobile-nav-item.active .mobile-nav-label {
      color: ${COLORS.emeraldDark}; font-weight: 700;
    }

    .mobile-nav-indicator {
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 20px; height: 3px; border-radius: 99px;
      background: ${COLORS.emerald};
    }

    /* Focus visible (NFR §4.8-5) */
    .mobile-nav-item:focus-visible {
      outline: 3px solid #3525cd;
      outline-offset: -2px;
      border-radius: 8px;
    }
  }
`;
