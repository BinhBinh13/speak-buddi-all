// speak-buddi/src/features/admin/reports/components/ExportFormPanel.jsx
// ─── Form xuất báo cáo (S11.3) ─────────────────────────────────────────────
// UI: speak-buddi-docs/ui/bao_cao_xuat_file_admin/ (Export Data Engine)

import { useEffect, useState } from "react";
import { LuDownload } from "react-icons/lu";
import { COLORS, FONTS } from "../../../../shared/constants/theme";
import { listPlansAll } from "../../payment-plans/services/paymentPlanService";

const REPORT_TYPES = [
  { value: "users", label: "Người dùng" },
  { value: "revenue", label: "Doanh thu" },
  { value: "learning", label: "Học tập & Kiểm tra" },
  { value: "ai_usage", label: "Sử dụng AI" },
];

const FORMATS = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "pdf", label: "PDF (.pdf)" },
];

function defaultFromDate() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function defaultToDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {{
 *   onExport: (payload: object) => Promise<void>,
 *   loading?: boolean,
 *   error?: string,
 * }} props
 */
export default function ExportFormPanel({ onExport, loading = false, error = "" }) {
  const [reportType, setReportType] = useState("users");
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(defaultToDate);
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await listPlansAll({ includeInactive: true });
        if (active) setPlans(rows);
      } catch (err) {
        if (active) setPlansError(err.message || "Không tải được danh sách gói.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setValidationError("");
    if (!from || !to) {
      setValidationError("⚠ Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (from > to) {
      setValidationError("⚠ Ngày bắt đầu không được sau ngày kết thúc.");
      return;
    }
    const payload = {
      report_type: reportType,
      export_format: exportFormat,
      from,
      to,
    };
    if (reportType === "revenue" && planId) {
      payload.plan_id = planId;
      payload.granularity = "day";
    }
    await onExport(payload);
  }

  const displayError = validationError || error;

  return (
    <>
      <style>{PANEL_CSS}</style>
      <section className="export-engine" aria-labelledby="export-engine-title">
        <div className="export-engine-header">
          <LuDownload size={24} strokeWidth={2} aria-hidden />
          <div>
            <h2 id="export-engine-title" className="export-engine-title">
              Xuất báo cáo
            </h2>
            <p className="export-engine-desc">
              Chọn loại dữ liệu, khoảng thời gian và định dạng để tải báo cáo phục vụ phân tích.
            </p>
          </div>
        </div>

        <form className="export-engine-form" onSubmit={handleSubmit}>
          <div className="export-engine-main">
            <div className="export-field">
              <span className="export-label">Loại báo cáo</span>
              <div className="export-type-grid" role="radiogroup" aria-label="Loại báo cáo">
                {REPORT_TYPES.map((t) => (
                  <label key={t.value} className="export-type-option">
                    <input
                      type="radio"
                      name="reportType"
                      value={t.value}
                      checked={reportType === t.value}
                      onChange={() => setReportType(t.value)}
                      className="sr-only"
                    />
                    <span className={`export-type-chip${reportType === t.value ? " active" : ""}`}>
                      {t.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="export-dates">
              <div className="export-field">
                <label htmlFor="export-from">Từ ngày</label>
                <input
                  id="export-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="export-input"
                  required
                />
              </div>
              <div className="export-field">
                <label htmlFor="export-to">Đến ngày</label>
                <input
                  id="export-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="export-input"
                  required
                />
              </div>
            </div>

            {reportType === "revenue" && (
              <div className="export-field">
                <label htmlFor="export-plan">Gói thanh toán</label>
                <select
                  id="export-plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="export-input"
                >
                  <option value="">Tất cả gói</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{!p.is_active ? " (đã tắt)" : ""}
                    </option>
                  ))}
                </select>
                {plansError && <p className="export-hint error">{plansError}</p>}
              </div>
            )}
          </div>

          <div className="export-engine-side">
            <div className="export-field">
              <label htmlFor="export-format">Định dạng</label>
              <select
                id="export-format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="export-input"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="export-submit-btn" disabled={loading}>
              {loading ? "Đang xuất…" : "Xuất báo cáo"}
            </button>
          </div>
        </form>

        {displayError && (
          <p className="export-hint error" role="alert">{displayError}</p>
        )}
      </section>
    </>
  );
}

const PANEL_CSS = `
  .export-engine {
    background: ${COLORS.surfaceContainer};
    border: 1px solid ${COLORS.outlineVariant};
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .export-engine-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    color: ${COLORS.primary};
    margin-bottom: 20px;
  }
  .export-engine-title {
    font-family: ${FONTS.display};
    font-size: 22px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0 0 4px;
  }
  .export-engine-desc {
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
    max-width: 640px;
  }
  .export-engine-form {
    background: #ffffff;
    border: 1px solid ${COLORS.outlineVariant};
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  @media (min-width: 768px) {
    .export-engine-form {
      flex-direction: row;
    }
  }
  .export-engine-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .export-engine-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-top: 1px solid ${COLORS.outlineVariant};
    padding-top: 16px;
  }
  @media (min-width: 768px) {
    .export-engine-side {
      width: 240px;
      border-top: none;
      border-left: 1px solid ${COLORS.outlineVariant};
      padding-top: 0;
      padding-left: 20px;
    }
  }
  .export-label,
  .export-field label {
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 500;
    color: ${COLORS.onSurface};
    display: block;
    margin-bottom: 8px;
  }
  .export-type-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  @media (min-width: 768px) {
    .export-type-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .export-type-option {
    cursor: pointer;
    margin: 0;
  }
  .export-type-chip {
    display: block;
    text-align: center;
    padding: 10px 8px;
    min-height: 44px;
    border-radius: 8px;
    border: 1px solid ${COLORS.outlineVariant};
    font-family: ${FONTS.body};
    font-size: 13px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }
  .export-type-chip.active {
    border-color: ${COLORS.primary};
    background: rgba(79, 70, 229, 0.12);
    color: ${COLORS.primary};
    font-weight: 600;
  }
  .export-dates {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 768px) {
    .export-dates {
      grid-template-columns: 1fr 1fr;
    }
  }
  .export-input {
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${COLORS.outlineVariant};
    background: ${COLORS.surface};
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurface};
    box-sizing: border-box;
  }
  .export-input:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-color: ${COLORS.primary};
  }
  .export-submit-btn {
    margin-top: auto;
    min-height: 48px;
    border: none;
    border-radius: 12px;
    background: ${COLORS.primary};
    color: #ffffff;
    font-family: ${FONTS.display};
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(53, 37, 205, 0.2);
    transition: background 0.15s, box-shadow 0.15s;
  }
  .export-submit-btn:hover:not(:disabled) {
    background: ${COLORS.primaryContainer};
    box-shadow: 0 8px 24px rgba(53, 37, 205, 0.25);
  }
  .export-submit-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  .export-submit-btn:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
  }
  .export-hint {
    font-family: ${FONTS.body};
    font-size: 13px;
    color: ${COLORS.outline};
    margin: 12px 0 0;
  }
  .export-hint.error {
    color: #93000a;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
`;
