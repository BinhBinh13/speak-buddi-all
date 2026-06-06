import { Link } from "react-router-dom";
import { UI } from "../constants/designTokens";

const FOOTER_LINKS = [
  { label: "Điều khoản", href: "#" },
  { label: "Bảo mật",    href: "#" },
  { label: "Liên hệ",    href: "#" },
  { label: "Trợ giúp",   href: "#" },
];

export default function PublicFooter() {
  return (
    <footer
      style={{
        background: UI.surfaceContainerLowest,
        borderTop: `1px solid ${UI.outlineVariant}`,
        padding: `${UI.spacing.xl} clamp(16px, 5vw, ${UI.spacing.marginDesktop})`,
      }}
    >
      <style>{`
        .footer-link-vi {
          font-family: ${UI.font};
          font-size: ${UI.fontSize.labelSm};
          font-weight: ${UI.fontWeight.labelSm};
          color: ${UI.onSurfaceVariant};
          text-decoration: underline;
          transition: color 0.2s;
        }
        .footer-link-vi:hover { color: ${UI.secondary}; }

        @media (max-width: 640px) {
          .footer-inner-vi { flex-direction: column !important; align-items: center !important; text-align: center; }
          .footer-brand-vi { align-items: center !important; }
        }
      `}</style>

      <div
        className="footer-inner-vi"
        style={{
          maxWidth: UI.spacing.maxWidth,
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: UI.spacing.md,
          flexWrap: "wrap",
        }}
      >
        {/* Brand + copyright */}
        <div
          className="footer-brand-vi"
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: UI.spacing.xs }}
        >
          <Link
            to="/"
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.h3,
              fontWeight: UI.fontWeight.h3,
              color: UI.primary,
              textDecoration: "none",
            }}
          >
            SpeakBuddi
          </Link>
          <p
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.bodyMd,
              color: UI.onSurfaceVariant,
              margin: 0,
              lineHeight: UI.lineHeight.bodyMd,
            }}
          >
            © 2026 SpeakBuddi. Nền tảng học Tiếng Anh cho người Việt.
          </p>
        </div>

        {/* Links */}
        <nav style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: UI.spacing.md }}>
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="footer-link-vi">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
