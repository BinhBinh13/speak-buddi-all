// speak-buddi/src/features/admin/components/UserActivityChart.jsx
// ─── Biểu đồ User Activity / Revenue (S11.1 + S11.2 filter) ─────────────────

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import { getRevenueFiltered, getTimeseries } from "../services/analyticsService";
import { formatPlanPrice } from "../payment-plans/utils/formatPrice";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "year", label: "Năm nay" },
];

const METRIC_OPTIONS = [
  { value: "users", label: "Người dùng mới" },
  { value: "revenue", label: "Doanh thu" },
];

function formatTooltipValue(metric, value) {
  if (metric === "revenue") return formatPlanPrice(value);
  return new Intl.NumberFormat("vi-VN").format(value);
}

/**
 * @param {{
 *   revenueFilter?: { granularity: string, from: string, to: string, planId: string },
 *   revenueRefreshKey?: number,
 * }} props
 */
export default function UserActivityChart({
  revenueFilter = { granularity: "month", from: "", to: "", planId: "" },
  revenueRefreshKey = 0,
}) {
  const [metric, setMetric] = useState("users");
  const [range, setRange] = useState("7d");
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (metric === "revenue") {
          const data = await getRevenueFiltered({
            granularity: revenueFilter.granularity,
            from: revenueFilter.from || undefined,
            to: revenueFilter.to || undefined,
            planId: revenueFilter.planId || undefined,
          });
          if (active) setPoints(data.points ?? []);
        } else {
          const data = await getTimeseries(metric, range);
          if (active) setPoints(data.points ?? []);
        }
      } catch (err) {
        if (active) {
          setPoints([]);
          setError(err.message || "Không tải được biểu đồ.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [metric, range, revenueFilter, revenueRefreshKey]);

  const chartTitle = metric === "revenue" ? "Doanh thu theo bộ lọc" : "Hoạt động người dùng";

  return (
    <>
      <style>{CHART_CSS}</style>
      <section className="activity-chart-card" aria-labelledby="activity-chart-title">
        <div className="activity-chart-header">
          <h2 id="activity-chart-title" className="activity-chart-title">
            {chartTitle}
          </h2>
          <div className="activity-chart-controls">
            <select
              className="activity-chart-select"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              aria-label="Chọn chỉ số biểu đồ"
            >
              {METRIC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {metric === "users" && (
              <select
                className="activity-chart-select"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                aria-label="Chọn khoảng thời gian"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {metric === "revenue" && (
          <p className="activity-chart-note">
            Biểu đồ doanh thu dùng bộ lọc phía trên (giao dịch thành công).
          </p>
        )}

        <div className="activity-chart-body">
          {loading && <p className="activity-chart-status">Đang tải biểu đồ…</p>}
          {!loading && error && (
            <p className="activity-chart-status error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && points.length === 0 && (
            <p className="activity-chart-status">Chưa có giao dịch trong khoảng đã chọn.</p>
          )}
          {!loading && !error && points.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.outlineVariant} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: COLORS.onSurfaceVariant, fontSize: 11, fontFamily: FONTS.body }}
                  axisLine={{ stroke: COLORS.outlineVariant }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: COLORS.onSurfaceVariant, fontSize: 11, fontFamily: FONTS.body }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) =>
                    metric === "revenue" ? formatPlanPrice(v).replace(" ₫", "") : v
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(53, 37, 205, 0.06)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${COLORS.surfaceContainerHigh}`,
                    fontFamily: FONTS.body,
                    fontSize: 13,
                  }}
                  formatter={(value) => [
                    formatTooltipValue(metric, value),
                    metric === "revenue" ? "Doanh thu" : "Người dùng",
                  ]}
                />
                <Bar dataKey="value" fill={COLORS.primary} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </>
  );
}

const CHART_CSS = `
  .activity-chart-card {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    box-sizing: border-box;
    min-height: 360px;
  }
  .activity-chart-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .activity-chart-title {
    font-family: ${FONTS.display};
    font-size: 20px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0;
  }
  .activity-chart-note {
    font-family: ${FONTS.body};
    font-size: 13px;
    color: ${COLORS.outline};
    margin: 0 0 12px;
  }
  .activity-chart-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .activity-chart-select {
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${COLORS.outlineVariant};
    background: ${COLORS.surfaceLow};
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurface};
    cursor: pointer;
  }
  .activity-chart-select:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-color: ${COLORS.primary};
  }
  .activity-chart-body {
    min-height: 280px;
  }
  .activity-chart-status {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 280px;
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
  }
  .activity-chart-status.error {
    color: #ba1a1a;
  }
`;
