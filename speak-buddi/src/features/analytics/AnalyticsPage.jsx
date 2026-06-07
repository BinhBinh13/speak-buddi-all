// speak-buddi/src/features/analytics/AnalyticsPage.jsx
// ─── Trang thống kê học tập cá nhân (Analytics) ──────────────────────────────
// Theme: DESIGN.md — primary #3525cd, emerald #0FA968, Be Vietnam Pro

import { useEffect, useState } from "react";
import {
  LuBookOpen,
  LuCircleCheck,
  LuClipboardCheck,
  LuFlame,
  LuTarget,
  LuTrendingUp,
} from "react-icons/lu";
import AppLayout from "../../shared/components/AppLayout";
import { COLORS, FONTS } from "../../shared/constants/theme";
import { useAuth } from "../../shared/auth/AuthContext";
import StatCard from "../admin/components/StatCard";
import ActivityChart from "./components/ActivityChart";
import RecentQuizzesCard from "./components/RecentQuizzesCard";
import UserTopWordsCard from "./components/UserTopWordsCard";
import { getUserAnalyticsOverview } from "./services/analyticsService";

function formatCount(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n) || 0);
}

function formatScore(n) {
  const v = Number(n) || 0;
  return `${v % 1 === 0 ? v : v.toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const displayName = user?.name || user?.email?.split("@")[0] || "bạn";

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getUserAnalyticsOverview();
        if (active) setOverview(data);
      } catch (err) {
        if (active) {
          setError(err.message || "Không tải được dữ liệu thống kê.");
          setOverview(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const vocab = overview?.vocabulary ?? {};
  const quiz = overview?.quiz ?? {};
  const sessions = overview?.sessions ?? {};
  const streak = overview?.streak_days ?? 0;

  return (
    <AppLayout>
      <style>{PAGE_CSS}</style>
      <div className="analytics-page">
        <section className="analytics-welcome">
          <h1 className="analytics-heading">Thống kê học tập</h1>
          <p className="analytics-sub">
            Xin chào {displayName}! Đây là tổng quan tiến độ học tiếng Anh của bạn.
          </p>
        </section>

        {loading && (
          <p className="analytics-status" role="status">
            Đang tải dữ liệu…
          </p>
        )}

        {!loading && error && (
          <div className="analytics-alert" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="analytics-kpi" aria-label="Chỉ số tổng quan">
              <StatCard
                icon={<LuBookOpen size={20} strokeWidth={2} />}
                value={formatCount(vocab.known_count)}
                label="Từ đã thuộc"
                accent="secondary"
                hint={`${formatCount(vocab.learning_count)} đang học · ${formatCount(vocab.topics_count)} chủ đề`}
              />
              <StatCard
                icon={<LuClipboardCheck size={20} strokeWidth={2} />}
                value={formatCount(quiz.attempts_total)}
                label="Bài kiểm tra đã làm"
                accent="primary"
                hint={
                  quiz.attempts_total > 0
                    ? `Điểm TB ${formatScore(quiz.avg_score_percent)}`
                    : "Hãy thử làm quiz đầu tiên"
                }
              />
              <StatCard
                icon={<LuTarget size={20} strokeWidth={2} />}
                value={formatScore(quiz.accuracy_percent)}
                label="Tỉ lệ trả lời đúng"
                accent="primary"
                hint={
                  quiz.attempts_total > 0
                    ? `${formatCount(quiz.correct_answers)} đúng · ${formatCount(quiz.wrong_answers)} sai`
                    : undefined
                }
              />
              <StatCard
                icon={<LuFlame size={20} strokeWidth={2} />}
                value={formatCount(streak)}
                label="Chuỗi ngày học liên tiếp"
                accent="secondary"
                hint={
                  streak > 0
                    ? "Giữ phong độ nhé!"
                    : "Học hôm nay để bắt đầu chuỗi ngày"
                }
              />
            </section>

            <section className="analytics-secondary-kpi" aria-label="Chỉ số bổ sung">
              <div className="analytics-mini-stat">
                <LuCircleCheck size={18} strokeWidth={2} aria-hidden />
                <div>
                  <span className="analytics-mini-value">
                    {formatCount(sessions.completed_batches)}
                  </span>
                  <span className="analytics-mini-label">Phiên học hoàn thành</span>
                </div>
              </div>
              <div className="analytics-mini-stat">
                <LuTrendingUp size={18} strokeWidth={2} aria-hidden />
                <div>
                  <span className="analytics-mini-value">
                    {formatScore(quiz.best_score_percent)}
                  </span>
                  <span className="analytics-mini-label">Điểm cao nhất</span>
                </div>
              </div>
              <div className="analytics-mini-stat">
                <LuBookOpen size={18} strokeWidth={2} aria-hidden />
                <div>
                  <span className="analytics-mini-value">
                    {formatCount(vocab.total_reviews)}
                  </span>
                  <span className="analytics-mini-label">Lần ôn từ vựng</span>
                </div>
              </div>
            </section>

            <div className="analytics-grid">
              <div className="analytics-grid-main">
                <ActivityChart />
              </div>
              <div className="analytics-grid-side">
                <UserTopWordsCard words={overview?.top_words ?? []} />
                <RecentQuizzesCard quizzes={overview?.recent_quizzes ?? []} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

const PAGE_CSS = `
  .analytics-page {
    padding: clamp(16px, 4vw, 32px) clamp(16px, 4vw, 28px) 48px;
    max-width: 1100px;
    margin: 0 auto;
    box-sizing: border-box;
    width: 100%;
  }

  .analytics-welcome {
    margin-bottom: 28px;
  }
  .analytics-heading {
    font-family: ${FONTS.display};
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 700;
    color: ${COLORS.onSurface};
    margin: 0 0 8px;
    letter-spacing: -0.02em;
  }
  .analytics-sub {
    font-family: ${FONTS.body};
    font-size: 15px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
    line-height: 1.5;
  }

  .analytics-status {
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    padding: 24px 0;
  }

  .analytics-alert {
    background: #ffdad6;
    color: #ba1a1a;
    border-radius: 12px;
    padding: 16px 20px;
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 500;
  }

  .analytics-kpi {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .analytics-secondary-kpi {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .analytics-mini-stat {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    color: ${COLORS.primary};
    min-height: 44px;
  }
  .analytics-mini-value {
    display: block;
    font-family: ${FONTS.display};
    font-size: 20px;
    font-weight: 700;
    color: ${COLORS.onSurface};
    line-height: 1.2;
  }
  .analytics-mini-label {
    display: block;
    font-family: ${FONTS.body};
    font-size: 12px;
    color: ${COLORS.onSurfaceVariant};
    margin-top: 2px;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 20px;
    align-items: start;
  }
  .analytics-grid-side {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  @media (max-width: 1024px) {
    .analytics-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .analytics-kpi {
      grid-template-columns: 1fr;
    }
    .analytics-secondary-kpi {
      grid-template-columns: 1fr;
    }
  }
`;
