// speak-buddi/src/features/analytics/components/UserTopWordsCard.jsx

import { COLORS, FONTS } from "../../../shared/constants/theme";
import { LuBookMarked } from "react-icons/lu";

const STATUS_LABEL = {
  known: "Đã thuộc",
  learning: "Đang học",
};

/**
 * @param {{ words?: Array<{ word: string, review_count: number, status: string }> }} props
 */
export default function UserTopWordsCard({ words = [] }) {
  const hasData = words.length > 0;

  return (
    <>
      <style>{CARD_CSS}</style>
      <section className="ua-words-card" aria-labelledby="ua-words-title">
        <div className="ua-words-header">
          <LuBookMarked size={20} strokeWidth={2} aria-hidden />
          <h2 id="ua-words-title" className="ua-words-title">
            Từ vựng ôn nhiều nhất
          </h2>
        </div>

        {!hasData ? (
          <p className="ua-words-empty">Chưa có từ vựng nào được ghi nhận.</p>
        ) : (
          <ol className="ua-words-list">
            {words.map((item, index) => (
              <li key={`${item.word}-${index}`} className="ua-words-row">
                <span className="ua-words-rank">{index + 1}</span>
                <div className="ua-words-main">
                  <span className="ua-words-word">{item.word}</span>
                  <span className={`ua-words-badge status-${item.status}`}>
                    {STATUS_LABEL[item.status] || item.status}
                  </span>
                </div>
                <span className="ua-words-count">
                  {new Intl.NumberFormat("vi-VN").format(item.review_count)} lần
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

const CARD_CSS = `
  .ua-words-card {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    box-sizing: border-box;
  }
  .ua-words-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: ${COLORS.emeraldDark};
  }
  .ua-words-title {
    font-family: ${FONTS.display};
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0;
  }
  .ua-words-empty {
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
    padding: 12px 0;
  }
  .ua-words-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ua-words-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: ${COLORS.surfaceLow};
    min-height: 44px;
  }
  .ua-words-rank {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: rgba(53, 37, 205, 0.1);
    color: ${COLORS.primary};
    font-family: ${FONTS.body};
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .ua-words-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ua-words-word {
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 600;
    color: ${COLORS.onSurface};
  }
  .ua-words-badge {
    font-family: ${FONTS.body};
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    align-self: flex-start;
  }
  .ua-words-badge.status-known {
    background: rgba(0, 108, 73, 0.12);
    color: ${COLORS.emeraldDark};
  }
  .ua-words-badge.status-learning {
    background: rgba(53, 37, 205, 0.1);
    color: ${COLORS.primary};
  }
  .ua-words-count {
    font-family: ${FONTS.body};
    font-size: 12px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    flex-shrink: 0;
  }
`;
