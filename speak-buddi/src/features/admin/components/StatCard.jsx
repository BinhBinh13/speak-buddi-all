// speak-buddi/src/features/admin/components/StatCard.jsx
// ─── Thẻ KPI tái dùng cho Dashboard admin (S11.1) ───────────────────────────
// UI tham chiếu: dashboard_quan_tri_desktop/code.html (Metric Card)
//
// Mỗi thẻ: icon nền nhạt, giá trị lớn (font-display 48px), label, badge xu hướng.
// `trend` optional — nếu không truyền thì ẩn badge (tránh hiện số liệu bịa đặt
// khi BE chưa có dữ liệu so sánh kỳ trước — §6 "zero/empty state an toàn").

import { COLORS, FONTS } from "../../../shared/constants/theme";

/**
 * @param {{
 *   icon: React.ReactNode,
 *   value: string | number,
 *   label: string,
 *   accent?: "primary" | "secondary" | "neutral",
 *   trend?: { direction: "up" | "down" | "flat", text: string } | null,
 *   hint?: string,
 * }} props
 */
export default function StatCard({ icon, value, label, accent = "primary", trend = null, hint }) {
  return (
    <>
      <style>{CARD_CSS}</style>
      <div className="stat-card">
        <div className="stat-card-top">
          <div className={`stat-card-icon accent-${accent}`}>{icon}</div>
          {trend && (
            <span className={`stat-card-trend dir-${trend.direction}`}>
              {trend.text}
            </span>
          )}
        </div>
        <div>
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-label">{label}</div>
          {hint && <div className="stat-card-hint">{hint}</div>}
        </div>
      </div>
    </>
  );
}

const CARD_CSS = `
  .stat-card {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    transition: box-shadow 0.2s;
    min-height: 148px;
    box-sizing: border-box;
  }
  .stat-card:hover {
    box-shadow: 0px 8px 24px rgba(79, 70, 229, 0.06);
  }
  .stat-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .stat-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .stat-card-icon.accent-primary {
    background: rgba(79, 70, 229, 0.12);
    color: ${COLORS.primary};
  }
  .stat-card-icon.accent-secondary {
    background: rgba(0, 108, 73, 0.12);
    color: ${COLORS.emeraldDark};
  }
  .stat-card-icon.accent-neutral {
    background: ${COLORS.surfaceContainerHigh};
    color: ${COLORS.onSurfaceVariant};
  }
  .stat-card-trend {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: ${FONTS.body};
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .stat-card-trend.dir-up {
    background: rgba(0, 108, 73, 0.12);
    color: ${COLORS.emeraldDark};
  }
  .stat-card-trend.dir-down {
    background: rgba(186, 26, 26, 0.10);
    color: #ba1a1a;
  }
  .stat-card-trend.dir-flat {
    background: ${COLORS.surfaceContainerHigh};
    color: ${COLORS.onSurfaceVariant};
  }
  .stat-card-value {
    font-family: ${FONTS.display};
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: ${COLORS.onSurface};
  }
  .stat-card-label {
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    margin-top: 2px;
  }
  .stat-card-hint {
    font-family: ${FONTS.body};
    font-size: 12px;
    color: ${COLORS.outline};
    margin-top: 4px;
  }

  @media (min-width: 1440px) {
    .stat-card-value { font-size: 44px; }
  }
`;
