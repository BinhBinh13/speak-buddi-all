// speak-buddi/src/features/admin/components/RevenueFilterPanel.jsx
// ─── Bộ lọc doanh thu theo ngày/tháng/năm/gói (S11.2) ───────────────────────
// UI: speak-buddi-docs/ui/bao_cao_xuat_file_admin/ (date inputs + plan select)

import { useEffect, useState } from "react";
import { LuFilter } from "react-icons/lu";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import { listPlans } from "../payment-plans/services/paymentPlanService";
import { formatPlanPrice } from "../payment-plans/utils/formatPrice";

const PRESETS = [
  { value: "day", label: "Hôm nay" },
  { value: "month", label: "Tháng này" },
  { value: "year", label: "Năm nay" },
  { value: "total", label: "Tất cả" },
];

/**
 * @param {{
 *   onApply: (filter: { granularity: string, from: string, to: string, planId: string }) => void,
 *   loading?: boolean,
 *   result?: { total_vnd: number, transaction_count: number, is_estimated?: boolean, plan_name?: string | null } | null,
 * }} props
 */
export default function RevenueFilterPanel({ onApply, loading = false, result = null }) {
  const [granularity, setGranularity] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await listPlans(true);
        if (active) setPlans(rows);
      } catch (err) {
        if (active) setPlansError(err.message || "Không tải được danh sách gói.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function selectPreset(value) {
    setGranularity(value);
    setFrom("");
    setTo("");
  }

  function handleApply() {
    if ((from && !to) || (!from && to)) {
      return;
    }
    if (from && to && from > to) {
      return;
    }
    onApply({ granularity, from, to, planId });
  }

  const canApply = !((from && !to) || (!from && to) || (from && to && from > to));

  return (
    <>
      <style>{PANEL_CSS}</style>
      <section className="revenue-filter" aria-labelledby="revenue-filter-title">
        <div className="revenue-filter-header">
          <LuFilter size={20} strokeWidth={2} aria-hidden />
          <h2 id="revenue-filter-title" className="revenue-filter-title">
            Lọc doanh thu
          </h2>
        </div>

        <div className="revenue-filter-presets" role="group" aria-label="Khoảng thời gian">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`revenue-preset${granularity === p.value && !from && !to ? " active" : ""}`}
              onClick={() => selectPreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="revenue-filter-dates">
          <div className="revenue-filter-field">
            <label htmlFor="revenue-from">Từ ngày</label>
            <input
              id="revenue-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="revenue-filter-input"
            />
          </div>
          <div className="revenue-filter-field">
            <label htmlFor="revenue-to">Đến ngày</label>
            <input
              id="revenue-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="revenue-filter-input"
            />
          </div>
        </div>

        <div className="revenue-filter-field">
          <label htmlFor="revenue-plan">Gói thanh toán</label>
          <select
            id="revenue-plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="revenue-filter-input"
          >
            <option value="">Tất cả gói</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{!p.is_active ? " (đã tắt)" : ""}
              </option>
            ))}
          </select>
          {plansError && <p className="revenue-filter-hint error">{plansError}</p>}
        </div>

        <div className="revenue-filter-actions">
          <button
            type="button"
            className="revenue-apply-btn"
            onClick={handleApply}
            disabled={loading || !canApply}
          >
            {loading ? "Đang tải…" : "Áp dụng"}
          </button>
          {(from && to && from > to) && (
            <p className="revenue-filter-hint error" role="alert">
              Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
            </p>
          )}
        </div>

        {result && (
          <div className="revenue-filter-summary" role="status">
            <span>
              Doanh thu đã lọc: <strong>{formatPlanPrice(result.total_vnd)}</strong>
            </span>
            <span className="revenue-filter-summary-meta">
              {result.transaction_count} giao dịch
              {result.plan_name ? ` · ${result.plan_name}` : ""}
              {result.transaction_count === 0 ? " · Chưa có giao dịch" : ""}
            </span>
          </div>
        )}
      </section>
    </>
  );
}

const PANEL_CSS = `
  .revenue-filter {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0px 4px 12px rgba(79, 70, 229, 0.04);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .revenue-filter-header {
    display: flex;
    align-items: center;
    gap: 10px;
    color: ${COLORS.primary};
  }
  .revenue-filter-title {
    font-family: ${FONTS.display};
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0;
  }
  .revenue-filter-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .revenue-preset {
    min-height: 44px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid ${COLORS.outlineVariant};
    background: ${COLORS.surfaceLow};
    font-family: ${FONTS.body};
    font-size: 13px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .revenue-preset.active {
    border-color: ${COLORS.primary};
    background: rgba(53, 37, 205, 0.1);
    color: ${COLORS.primary};
    font-weight: 600;
  }
  .revenue-preset:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
  }
  .revenue-filter-dates {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 768px) {
    .revenue-filter-dates {
      grid-template-columns: 1fr 1fr;
    }
  }
  .revenue-filter-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .revenue-filter-field label {
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 500;
    color: ${COLORS.onSurface};
  }
  .revenue-filter-input {
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${COLORS.outlineVariant};
    background: ${COLORS.surface};
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurface};
    box-sizing: border-box;
    width: 100%;
  }
  .revenue-filter-input:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-color: ${COLORS.primary};
  }
  .revenue-filter-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .revenue-apply-btn {
    min-height: 44px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: ${COLORS.primary};
    color: #ffffff;
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .revenue-apply-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .revenue-apply-btn:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
  }
  .revenue-filter-hint {
    font-family: ${FONTS.body};
    font-size: 12px;
    color: ${COLORS.outline};
    margin: 4px 0 0;
  }
  .revenue-filter-hint.error {
    color: #93000a;
  }
  .revenue-filter-summary {
    padding: 12px 14px;
    border-radius: 8px;
    background: ${COLORS.surfaceContainer};
    border: 1px solid ${COLORS.surfaceContainerHigh};
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .revenue-filter-summary strong {
    color: ${COLORS.onSurface};
    font-weight: 700;
  }
  .revenue-filter-summary-meta {
    font-size: 13px;
  }
`;
