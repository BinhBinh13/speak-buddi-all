// speak-buddi/src/features/analytics/components/RecentQuizzesCard.jsx

import { COLORS, FONTS } from "../../../shared/constants/theme";
import { LuClipboardCheck } from "react-icons/lu";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function scoreColor(score) {
  if (score >= 80) return COLORS.emeraldDark;
  if (score >= 50) return COLORS.amber;
  return "#ba1a1a";
}

/**
 * @param {{ quizzes?: Array<{ test_title: string, score_percent: number, submitted_at: string | null }> }} props
 */
export default function RecentQuizzesCard({ quizzes = [] }) {
  const hasData = quizzes.length > 0;

  return (
    <>
      <style>{CARD_CSS}</style>
      <section className="ua-quiz-card" aria-labelledby="ua-quiz-title">
        <div className="ua-quiz-header">
          <LuClipboardCheck size={20} strokeWidth={2} aria-hidden />
          <h2 id="ua-quiz-title" className="ua-quiz-title">
            Bài kiểm tra gần đây
          </h2>
        </div>

        {!hasData ? (
          <p className="ua-quiz-empty">Bạn chưa hoàn thành bài kiểm tra nào.</p>
        ) : (
          <ul className="ua-quiz-list">
            {quizzes.map((item, index) => (
              <li key={`${item.test_title}-${index}`} className="ua-quiz-row">
                <div className="ua-quiz-info">
                  <span className="ua-quiz-name">{item.test_title}</span>
                  <span className="ua-quiz-date">{formatDate(item.submitted_at)}</span>
                </div>
                <span
                  className="ua-quiz-score"
                  style={{ color: scoreColor(item.score_percent) }}
                >
                  {item.score_percent % 1 === 0
                    ? item.score_percent
                    : item.score_percent.toFixed(1)}
                  %
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

const CARD_CSS = `
  .ua-quiz-card {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    box-sizing: border-box;
  }
  .ua-quiz-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: ${COLORS.primary};
  }
  .ua-quiz-title {
    font-family: ${FONTS.display};
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0;
  }
  .ua-quiz-empty {
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
    padding: 12px 0;
  }
  .ua-quiz-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ua-quiz-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    background: ${COLORS.surfaceLow};
    min-height: 44px;
  }
  .ua-quiz-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .ua-quiz-name {
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ua-quiz-date {
    font-family: ${FONTS.body};
    font-size: 12px;
    color: ${COLORS.onSurfaceVariant};
  }
  .ua-quiz-score {
    font-family: ${FONTS.display};
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
  }
`;
