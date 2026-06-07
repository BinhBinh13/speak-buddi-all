// speak-buddi/src/features/admin/components/TopWordsCard.jsx
// ─── Top từ vựng được học nhiều nhất (S11.1, §3.6) ────────────────────────

import { COLORS, FONTS } from "../../../shared/constants/theme";
import { LuBookMarked } from "react-icons/lu";

/**
 * @param {{ words?: Array<{ word: string, learned_count: number }> }} props
 */
export default function TopWordsCard({ words = [] }) {
  const hasData = words.length > 0;

  return (
    <>
      <style>{CARD_CSS}</style>
      <section className="top-words-card" aria-labelledby="top-words-title">
        <div className="top-words-header">
          <LuBookMarked size={20} strokeWidth={2} aria-hidden />
          <h2 id="top-words-title" className="top-words-title">
            Từ vựng học nhiều nhất
          </h2>
        </div>

        {!hasData ? (
          <p className="top-words-empty">Chưa có dữ liệu học tập.</p>
        ) : (
          <ol className="top-words-list">
            {words.map((item, index) => (
              <li key={`${item.word}-${index}`} className="top-words-row">
                <span className="top-words-rank">{index + 1}</span>
                <span className="top-words-word">{item.word}</span>
                <span className="top-words-count">
                  {new Intl.NumberFormat("vi-VN").format(item.learned_count)}
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
  .top-words-card {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    box-sizing: border-box;
  }
  .top-words-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: ${COLORS.primary};
  }
  .top-words-title {
    font-family: ${FONTS.display};
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0;
  }
  .top-words-empty {
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
    padding: 12px 0;
  }
  .top-words-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .top-words-row {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    background: ${COLORS.surfaceLow};
  }
  .top-words-rank {
    font-family: ${FONTS.body};
    font-size: 12px;
    font-weight: 700;
    color: ${COLORS.onSurfaceVariant};
  }
  .top-words-word {
    font-family: ${FONTS.body};
    font-size: 15px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .top-words-count {
    font-family: ${FONTS.body};
    font-size: 13px;
    font-weight: 600;
    color: ${COLORS.emeraldDark};
  }
`;
