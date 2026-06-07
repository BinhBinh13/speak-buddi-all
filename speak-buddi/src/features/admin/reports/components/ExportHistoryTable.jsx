// speak-buddi/src/features/admin/reports/components/ExportHistoryTable.jsx
// ─── Bảng lịch sử xuất báo cáo (S11.3) ─────────────────────────────────────

import { COLORS, FONTS } from "../../../../shared/constants/theme";

const TYPE_LABELS = {
  revenue: "Doanh thu",
  users: "Người dùng",
  learning: "Học tập & Kiểm tra",
  ai_usage: "Sử dụng AI",
};

const STATUS_LABELS = {
  pending: "Đang xử lý",
  completed: "Hoàn thành",
  failed: "Thất bại",
};

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

/**
 * @param {{
 *   items: Array<object>,
 *   loading?: boolean,
 * }} props
 */
export default function ExportHistoryTable({ items = [], loading = false }) {
  return (
    <>
      <style>{TABLE_CSS}</style>
      <section className="export-history" aria-labelledby="export-history-title">
        <h2 id="export-history-title" className="export-history-title">
          Lịch sử xuất báo cáo
        </h2>

        {loading ? (
          <p className="export-history-empty">Đang tải lịch sử…</p>
        ) : items.length === 0 ? (
          <p className="export-history-empty">Chưa có lần xuất nào.</p>
        ) : (
          <div className="export-history-scroll">
            <table className="export-history-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Loại</th>
                  <th>Định dạng</th>
                  <th>Trạng thái</th>
                  <th>Tên file</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{TYPE_LABELS[row.report_type] || row.report_type}</td>
                    <td>{(row.export_format || "").toUpperCase()}</td>
                    <td>
                      <span className={`export-status export-status--${row.status}`}>
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="export-file-name">{row.file_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

const TABLE_CSS = `
  .export-history {
    background: #ffffff;
    border: 1px solid ${COLORS.surfaceContainerHigh};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.04);
  }
  .export-history-title {
    font-family: ${FONTS.display};
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.onSurface};
    margin: 0 0 16px;
  }
  .export-history-empty {
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.outline};
    margin: 0;
  }
  .export-history-scroll {
    overflow-x: auto;
  }
  .export-history-table {
    width: 100%;
    border-collapse: collapse;
    font-family: ${FONTS.body};
    font-size: 14px;
    min-width: 560px;
  }
  .export-history-table th {
    text-align: left;
    padding: 10px 12px;
    background: ${COLORS.surfaceContainer};
    color: ${COLORS.onSurfaceVariant};
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    border-bottom: 1px solid ${COLORS.outlineVariant};
  }
  .export-history-table td {
    padding: 12px;
    border-bottom: 1px solid ${COLORS.surfaceContainerHigh};
    color: ${COLORS.onSurface};
    vertical-align: middle;
  }
  .export-file-name {
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .export-status {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  .export-status--completed {
    background: rgba(0, 108, 73, 0.12);
    color: ${COLORS.secondary};
  }
  .export-status--pending {
    background: rgba(53, 37, 205, 0.1);
    color: ${COLORS.primary};
  }
  .export-status--failed {
    background: #ffdad6;
    color: #93000a;
  }
`;
