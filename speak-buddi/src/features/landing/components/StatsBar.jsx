import { UI } from "../../../shared/constants/designTokens";

const STATS = [
  { value: "100,000+", label: "Người dùng" },
  { value: "500+",     label: "Chủ đề giao tiếp" },
  { value: "10,000+",  label: "Từ vựng" },
];

export default function StatsBar() {
  return (
    <section style={{ background: UI.surfaceContainerLow, padding: "4rem 0" }}>
      <div
        style={{
          maxWidth: UI.spacing.maxWidth,
          margin: "0 auto",
          padding: `0 clamp(16px, 5vw, ${UI.spacing.marginDesktop})`,
        }}
      >
        <style>{`
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            text-align: center;
            gap: 0;
          }
          .stats-item {
            padding: 0 1.25rem;
            border-right: 1px solid ${UI.outlineVariant};
          }
          .stats-item:last-child { border-right: none; }

          @media (max-width: 767px) {
            .stats-grid { grid-template-columns: 1fr; }
            .stats-item { border-right: none; border-bottom: 1px solid ${UI.outlineVariant}; padding: 1rem 0; }
            .stats-item:last-child { border-bottom: none; }
          }
        `}</style>

        <div className="stats-grid">
          {STATS.map(({ value, label }) => (
            <div key={label} className="stats-item">
              <h3
                style={{
                  fontFamily: UI.font,
                  fontSize: UI.fontSize.h1,
                  fontWeight: UI.fontWeight.h1,
                  color: UI.primary,
                  margin: 0,
                  lineHeight: UI.lineHeight.h1,
                }}
              >
                {value}
              </h3>
              <p
                style={{
                  fontFamily: UI.font,
                  fontSize: UI.fontSize.labelMd,
                  fontWeight: UI.fontWeight.labelMd,
                  color: UI.onSurfaceVariant,
                  margin: "0.5rem 0 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
