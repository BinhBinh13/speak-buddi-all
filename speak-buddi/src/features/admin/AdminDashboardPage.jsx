// speak-buddi/src/features/admin/AdminDashboardPage.jsx
// ─── Dashboard quản trị: doanh thu / user / learning / AI (S11.1) ───────────
// UI: speak-buddi-docs/ui/dashboard_quan_tri_desktop/ + DESIGN.md

import { useEffect, useState } from "react";
import {
  LuUsers,
  LuUserCheck,
  LuWallet,
  LuAward,
  LuClipboardCheck,
  LuTarget,
} from "react-icons/lu";
import { useAuth } from "../../shared/auth/AuthContext";
import { COLORS, FONTS } from "../../shared/constants/theme";
import StatCard from "./components/StatCard";
import RevenueFilterPanel from "./components/RevenueFilterPanel";
import UserActivityChart from "./components/UserActivityChart";
import TopWordsCard from "./components/TopWordsCard";
import AiUsageCard from "./components/AiUsageCard";
import { getOverview, getRevenueFiltered } from "./services/analyticsService";
import { formatPlanPrice } from "./payment-plans/utils/formatPrice";

const DEFAULT_REVENUE_FILTER = {
  granularity: "month",
  from: "",
  to: "",
  planId: "",
};

function formatCount(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n) || 0);
}

function formatScore(n) {
  const v = Number(n) || 0;
  return `${v % 1 === 0 ? v : v.toFixed(1)}%`;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const adminName = user?.name || user?.email?.split("@")[0] || "Admin";

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedRevenueFilter, setAppliedRevenueFilter] = useState(DEFAULT_REVENUE_FILTER);
  const [filteredRevenue, setFilteredRevenue] = useState(null);
  const [revenueFilterLoading, setRevenueFilterLoading] = useState(false);
  const [revenueRefreshKey, setRevenueRefreshKey] = useState(0);

  async function loadFilteredRevenue(filter) {
    setRevenueFilterLoading(true);
    try {
      const data = await getRevenueFiltered({
        granularity: filter.granularity,
        from: filter.from || undefined,
        to: filter.to || undefined,
        planId: filter.planId || undefined,
      });
      setFilteredRevenue(data);
      setAppliedRevenueFilter(filter);
      setRevenueRefreshKey((k) => k + 1);
    } catch {
      setFilteredRevenue(null);
    } finally {
      setRevenueFilterLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getOverview();
        if (active) setOverview(data);
      } catch (err) {
        if (active) {
          setError(err.message || "Không tải được dữ liệu dashboard.");
          setOverview(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    (async () => {
      setRevenueFilterLoading(true);
      try {
        const data = await getRevenueFiltered({ granularity: "month" });
        if (active) {
          setFilteredRevenue(data);
          setAppliedRevenueFilter(DEFAULT_REVENUE_FILTER);
        }
      } catch {
        if (active) setFilteredRevenue(null);
      } finally {
        if (active) setRevenueFilterLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const users = overview?.users ?? {};
  const revenue = overview?.revenue ?? {};
  const learning = overview?.learning ?? {};
  const aiUsage = overview?.ai_usage ?? {};

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="admin-dashboard">
        <section className="admin-dashboard-welcome">
          <div>
            <h1 className="admin-dashboard-heading">Chào mừng trở lại, {adminName} 👋</h1>
            <p className="admin-dashboard-sub">
              Tổng quan hoạt động SpeakBuddi hôm nay — người dùng, doanh thu, học tập và AI.
            </p>
          </div>
        </section>

        {loading && (
          <p className="admin-dashboard-status" role="status">
            Đang tải dashboard…
          </p>
        )}

        {!loading && error && (
          <div className="admin-dashboard-alert" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="admin-dashboard-kpi" aria-label="Chỉ số tổng quan">
              <StatCard
                icon={<LuUsers size={20} strokeWidth={2} />}
                value={formatCount(users.total)}
                label="Tổng người dùng"
                accent="primary"
                hint={`${formatCount(users.free)} miễn phí · ${formatCount(users.paid)} trả phí`}
              />
              <StatCard
                icon={<LuUserCheck size={20} strokeWidth={2} />}
                value={formatCount(users.paid)}
                label="Người dùng trả phí"
                accent="secondary"
                hint={`+${formatCount(users.new_this_month)} mới tháng này`}
              />
              <StatCard
                icon={<LuWallet size={20} strokeWidth={2} />}
                value={formatPlanPrice(revenue.this_month_vnd)}
                label="Doanh thu tháng này"
                accent="primary"
                hint={
                  revenue.is_estimated
                    ? "Ước lượng từ gói đang active"
                    : "Từ giao dịch thành công"
                }
              />
              <StatCard
                icon={<LuAward size={20} strokeWidth={2} />}
                value={formatScore(learning.avg_score_percent)}
                label="Điểm kiểm tra TB"
                accent="neutral"
                hint={`${formatCount(learning.quiz_attempts_total)} lượt làm bài`}
              />
            </section>

            <section className="admin-dashboard-learning" aria-label="Chỉ số học tập">
              <div className="learning-pill">
                <LuClipboardCheck size={18} aria-hidden />
                <span>
                  <strong>{formatCount(learning.quiz_attempts_total)}</strong> lượt kiểm tra
                </span>
              </div>
              <div className="learning-pill">
                <LuTarget size={18} aria-hidden />
                <span>
                  Tỉ lệ đúng: <strong>{formatScore(learning.accuracy_percent)}</strong>
                  {" "}
                  ({formatCount(learning.correct_answers)} đúng / {formatCount(learning.wrong_answers)} sai)
                </span>
              </div>
              <div className="learning-pill">
                <LuUsers size={18} aria-hidden />
                <span>
                  User mới hôm nay: <strong>{formatCount(users.new_today)}</strong>
                  {" · "}
                  tháng này: <strong>{formatCount(users.new_this_month)}</strong>
                </span>
              </div>
              <div className="learning-pill">
                <LuWallet size={18} aria-hidden />
                <span>
                  Doanh thu tổng: <strong>{formatPlanPrice(revenue.total_vnd)}</strong>
                </span>
              </div>
            </section>

            <RevenueFilterPanel
              onApply={loadFilteredRevenue}
              loading={revenueFilterLoading}
              result={filteredRevenue}
            />

            <div className="admin-dashboard-grid">
              <div className="admin-dashboard-chart">
                <UserActivityChart
                  revenueFilter={appliedRevenueFilter}
                  revenueRefreshKey={revenueRefreshKey}
                />
              </div>
              <div className="admin-dashboard-side">
                <AiUsageCard
                  totalMinutes={aiUsage.total_minutes}
                  conversations={aiUsage.conversations}
                  isAvailable={aiUsage.is_available}
                />
                <TopWordsCard words={learning.top_words ?? []} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const PAGE_CSS = `
  .admin-dashboard {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .admin-dashboard-welcome {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }
  .admin-dashboard-heading {
    font-family: ${FONTS.display};
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 700;
    color: ${COLORS.onSurface};
    margin: 0;
    line-height: 1.25;
  }
  .admin-dashboard-sub {
    font-family: ${FONTS.body};
    font-size: 16px;
    color: ${COLORS.onSurfaceVariant};
    margin: 8px 0 0;
    line-height: 1.5;
  }
  .admin-dashboard-status {
    font-family: ${FONTS.body};
    font-size: 15px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
  }
  .admin-dashboard-alert {
    padding: 14px 16px;
    border-radius: 10px;
    background: rgba(186, 26, 26, 0.08);
    border: 1px solid rgba(186, 26, 26, 0.2);
    color: #93000a;
    font-family: ${FONTS.body};
    font-size: 14px;
  }
  .admin-dashboard-kpi {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 768px) {
    .admin-dashboard-kpi {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .admin-dashboard-kpi {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .admin-dashboard-learning {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .learning-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 999px;
    background: ${COLORS.surfaceContainer};
    border: 1px solid ${COLORS.surfaceContainerHigh};
    font-family: ${FONTS.body};
    font-size: 13px;
    color: ${COLORS.onSurfaceVariant};
    min-height: 44px;
    box-sizing: border-box;
  }
  .learning-pill strong {
    color: ${COLORS.onSurface};
    font-weight: 600;
  }
  .admin-dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .admin-dashboard-grid {
      grid-template-columns: 2fr 1fr;
      align-items: start;
    }
  }
  .admin-dashboard-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`;
