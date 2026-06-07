// speak-buddi/src/features/admin/components/AdminPagination.jsx
// ─── Phân trang dùng chung cho màn Admin ─────────────────────────────────────

import { COLORS, FONTS } from "../../../shared/constants/theme";

export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * @param {{
 *   total: number,
 *   offset: number,
 *   pageSize: number,
 *   onOffsetChange: (nextOffset: number) => void,
 *   onPageSizeChange: (nextSize: number) => void,
 *   itemLabel?: string,
 *   className?: string,
 * }} props
 */
export default function AdminPagination({
  total,
  offset,
  pageSize,
  onOffsetChange,
  onPageSizeChange,
  itemLabel = "mục",
  className = "",
}) {
  if (total <= 0) return null;

  const pageStart = offset + 1;
  const pageEnd = Math.min(offset + pageSize, total);

  return (
    <div
      className={`d-flex flex-wrap justify-content-between align-items-center gap-2 ${className}`.trim()}
      style={{ fontFamily: FONTS.body }}
    >
      <span style={{ fontSize: 14, color: COLORS.onSurfaceVariant }}>
        Hiển thị {pageStart}–{pageEnd} / {total} {itemLabel}
      </span>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <label className="d-flex align-items-center gap-2 mb-0" style={{ fontSize: 14, color: COLORS.onSurfaceVariant }}>
          <span>Số dòng:</span>
          <select
            className="form-select form-select-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Số dòng mỗi trang"
            style={{ minHeight: 44, width: 80 }}
          >
            {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={offset === 0}
          onClick={() => onOffsetChange(Math.max(0, offset - pageSize))}
          style={{ minHeight: 44 }}
        >
          Trước
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={offset + pageSize >= total}
          onClick={() => onOffsetChange(offset + pageSize)}
          style={{ minHeight: 44 }}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
