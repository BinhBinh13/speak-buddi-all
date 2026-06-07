// speak-buddi/src/features/admin/components/AiUsageCard.jsx
// ─── Chỉ số AI usage — placeholder khi Epic 7 chưa có dữ liệu (S11.1) ─────

import { COLORS, FONTS } from "../../../shared/constants/theme";
import { LuBot, LuClock, LuMessagesSquare } from "react-icons/lu";

/**
 * @param {{
 *   totalMinutes?: number,
 *   conversations?: number,
 *   isAvailable?: boolean,
 * }} props
 */
export default function AiUsageCard({
  totalMinutes = 0,
  conversations = 0,
  isAvailable = false,
}) {
  return (
    <>
      <style>{CARD_CSS}</style>
      <section className="ai-usage-card" aria-labelledby="ai-usage-title">
        <div className="ai-usage-header">
          <LuBot size={20} strokeWidth={2} aria-hidden />
          <h2 id="ai-usage-title" className="ai-usage-title">
            Sử dụng AI
          </h2>
        </div>

        {!isAvailable ? (
          <div className="ai-usage-placeholder">
            <p className="ai-usage-soon">Sắp có</p>
            <p className="ai-usage-note">
              Thống kê hội thoại AI sẽ hiển thị sau khi tích hợp Epic 7 (S7.x).
            </p>
          </div>
        ) : (
          <div className="ai-usage-stats">
            <div className="ai-usage-stat">
              <LuClock size={18} aria-hidden />
              <div>
                <div className="ai-usage-value">
                  {new Intl.NumberFormat("vi-VN").format(totalMinutes)}
                </div>
                <div className="ai-usage-label">Phút hội thoại</div>
              </div>
            </div>
            <div className="ai-usage-stat">
              <LuMessagesSquare size={18} aria-hidden />
              <div>
                <div className="ai-usage-value">
                  {new Intl.NumberFormat("vi-VN").format(conversations)}
                </div>
                <div className="ai-usage-label">Cuộc hội thoại</div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

const CARD_CSS = `
  .ai-usage-card {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    box-sizing: border-box;
  }
  .ai-usage-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: ${COLORS.primary};
  }
  .ai-usage-title {
    font-family: ${FONTS.display};
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0;
  }
  .ai-usage-placeholder {
    padding: 8px 0 4px;
  }
  .ai-usage-soon {
    font-family: ${FONTS.display};
    font-size: 28px;
    font-weight: 700;
    color: ${COLORS.onSurfaceVariant};
    margin: 0 0 8px;
  }
  .ai-usage-note {
    font-family: ${FONTS.body};
    font-size: 13px;
    line-height: 1.5;
    color: ${COLORS.outline};
    margin: 0;
  }
  .ai-usage-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ai-usage-stat {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    background: ${COLORS.surfaceLow};
    color: ${COLORS.primary};
  }
  .ai-usage-value {
    font-family: ${FONTS.display};
    font-size: 22px;
    font-weight: 700;
    color: ${COLORS.onSurface};
    line-height: 1.2;
  }
  .ai-usage-label {
    font-family: ${FONTS.body};
    font-size: 13px;
    color: ${COLORS.onSurfaceVariant};
  }
`;
