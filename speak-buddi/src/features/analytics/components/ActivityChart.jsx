// speak-buddi/src/features/analytics/components/ActivityChart.jsx

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
import { getUserActivitySeries } from "../services/analyticsService";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "year", label: "Năm nay" },
];

const METRIC_OPTIONS = [
  { value: "words", label: "Từ vựng ôn luyện" },
  { value: "quizzes", label: "Bài kiểm tra" },
];

export default function ActivityChart() {
  const [metric, setMetric] = useState("words");
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
        const data = await getUserActivitySeries({ metric, range });
        if (active) setPoints(data.points ?? []);
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
  }, [metric, range]);

  const metricLabel = metric === "quizzes" ? "Bài kiểm tra" : "Từ vựng";

  return (
    <>
      <style>{CHART_CSS}</style>
      <section className="ua-activity-card" aria-labelledby="ua-activity-title">
        <div className="ua-activity-header">
          <h2 id="ua-activity-title" className="ua-activity-title">
            Hoạt động học tập
          </h2>
          <div className="ua-activity-controls">
            <select
              className="ua-activity-select"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              aria-label="Chọn loại hoạt động"
            >
              {METRIC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="ua-activity-select"
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
          </div>
        </div>

        <div className="ua-activity-body">
          {loading && <p className="ua-activity-status">Đang tải biểu đồ…</p>}
          {!loading && error && (
            <p className="ua-activity-status error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && points.every((p) => !p.value) && (
            <p className="ua-activity-status">
              Chưa có hoạt động trong khoảng thời gian này. Hãy bắt đầu học từ vựng hoặc làm quiz nhé!
            </p>
          )}
          {!loading && !error && points.some((p) => p.value > 0) && (
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
                  width={40}
                  allowDecimals={false}
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
                    new Intl.NumberFormat("vi-VN").format(value),
                    metricLabel,
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
  .ua-activity-card {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    box-sizing: border-box;
    min-height: 360px;
  }
  .ua-activity-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }
  .ua-activity-title {
    font-family: ${FONTS.display};
    font-size: 20px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0;
  }
  .ua-activity-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ua-activity-select {
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
  .ua-activity-select:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-color: ${COLORS.primary};
  }
  .ua-activity-body {
    min-height: 280px;
  }
  .ua-activity-status {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 280px;
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
    text-align: center;
    padding: 0 16px;
  }
  .ua-activity-status.error {
    color: #ba1a1a;
  }
`;
