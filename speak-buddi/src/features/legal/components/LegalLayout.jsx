// src/features/legal/components/LegalLayout.jsx
// Layout dùng chung cho các trang pháp lý tĩnh, công khai (Privacy Policy / Terms of Service) — S12.1
// Tái dùng PublicNavbar + PublicFooter, vùng nội dung dạng "prose" căn giữa, bám design system (UI tokens).
// Tham chiếu shell layout: PricingPage.jsx (dòng 59-148).
import PublicNavbar from "../../../shared/components/PublicNavbar";
import PublicFooter from "../../../shared/components/PublicFooter";
import { UI } from "../../../shared/constants/designTokens";

/**
 * @param {string} title        Tiêu đề H1 của trang (vd: "Chính sách bảo mật")
 * @param {string} lastUpdated  Ngày cập nhật lần cuối, dạng "07/06/2026"
 * @param {React.ReactNode} crossLink  Link chéo sang trang pháp lý còn lại (đặt cuối trang)
 * @param {React.ReactNode} children   Nội dung các section (h2/h3/p/ul...)
 */
export default function LegalLayout({ title, lastUpdated, crossLink, children }) {
  return (
    <div
      style={{
        fontFamily: UI.font,
        background: UI.background,
        color: UI.onSurface,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PublicNavbar />

      {/* Style cho vùng văn bản "prose": heading phân cấp, đoạn văn, danh sách, bảng, link */}
      <style>{`
        .legal-prose h2 {
          font-family: ${UI.font};
          font-size: ${UI.fontSize.h2};
          font-weight: ${UI.fontWeight.h2};
          color: ${UI.onSurface};
          line-height: ${UI.lineHeight.h2};
          margin: 2.5rem 0 ${UI.spacing.sm};
        }
        .legal-prose h2:first-of-type { margin-top: ${UI.spacing.lg}; }
        .legal-prose h3 {
          font-family: ${UI.font};
          font-size: ${UI.fontSize.h3};
          font-weight: ${UI.fontWeight.h3};
          color: ${UI.onSurface};
          line-height: ${UI.lineHeight.h3};
          margin: ${UI.spacing.md} 0 ${UI.spacing.xs};
        }
        .legal-prose p, .legal-prose li {
          font-family: ${UI.font};
          font-size: ${UI.fontSize.bodyMd};
          color: ${UI.onSurfaceVariant};
          line-height: ${UI.lineHeight.bodyMd};
          margin: 0 0 ${UI.spacing.xs};
        }
        .legal-prose ul {
          margin: 0 0 ${UI.spacing.sm};
          padding-left: 1.25rem;
        }
        .legal-prose li { margin-bottom: 6px; }
        .legal-prose strong { color: ${UI.onSurface}; font-weight: ${UI.fontWeight.labelMd}; }
        .legal-prose a {
          color: ${UI.primary};
          font-weight: ${UI.fontWeight.labelMd};
          text-decoration: underline;
          /* Không phụ thuộc màu để truyền đạt thông tin — vẫn giữ underline (§4.8) */
        }
        .legal-prose a:hover { color: ${UI.secondary}; }
        .legal-table {
          width: 100%;
          border-collapse: collapse;
          margin: ${UI.spacing.sm} 0 ${UI.spacing.md};
          font-family: ${UI.font};
          font-size: ${UI.fontSize.labelMd};
        }
        .legal-table th, .legal-table td {
          border: 1px solid ${UI.outlineVariant};
          padding: 10px 12px;
          text-align: left;
          vertical-align: top;
          line-height: ${UI.lineHeight.bodyMd};
        }
        .legal-table th {
          background: ${UI.surfaceContainerLow};
          color: ${UI.onSurface};
          font-weight: ${UI.fontWeight.h3};
        }
        .legal-table td { color: ${UI.onSurfaceVariant}; }

        @media (max-width: 480px) {
          .legal-table, .legal-table thead, .legal-table tbody,
          .legal-table th, .legal-table td, .legal-table tr {
            display: block;
          }
          .legal-table th { width: 100%; }
        }
      `}</style>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: `calc(68px + ${UI.spacing.xl}) clamp(16px, 5vw, ${UI.spacing.marginDesktop}) ${UI.spacing.xl}`,
          width: "100%",
          maxWidth: UI.spacing.maxWidth,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: "48rem", margin: "0 auto" }}>
          {/* Header */}
          <header style={{ marginBottom: UI.spacing.lg }}>
            <h1
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.h1,
                fontWeight: UI.fontWeight.h1,
                color: UI.onSurface,
                lineHeight: UI.lineHeight.h1,
                margin: `0 0 ${UI.spacing.xs}`,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.labelMd,
                color: UI.onSurfaceVariant,
                margin: 0,
              }}
            >
              Cập nhật lần cuối: <strong style={{ color: UI.onSurface }}>{lastUpdated}</strong>
            </p>
          </header>

          {/* Nội dung — prose */}
          <div className="legal-prose">{children}</div>

          {/* Link chéo */}
          {crossLink && (
            <div
              style={{
                marginTop: UI.spacing.xl,
                paddingTop: UI.spacing.md,
                borderTop: `1px solid ${UI.outlineVariant}`,
              }}
            >
              {crossLink}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
