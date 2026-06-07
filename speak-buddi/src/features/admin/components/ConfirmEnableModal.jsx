// speak-buddi/src/features/admin/components/ConfirmEnableModal.jsx
// Modal xác nhận kích hoạt lại nội dung (S9.5 — AC-13-06)

import { Modal } from "react-bootstrap";
import { COLORS, FONTS } from "../../../shared/constants/theme";

/**
 * @param {{
 *   show: boolean,
 *   title?: string,
 *   entityName?: string,
 *   entityLabel?: string,
 *   loading?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function ConfirmEnableModal({
  show,
  title = "Kích hoạt lại nội dung",
  entityName = "",
  entityLabel = "mục này",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const label = entityName ? `"${entityName}"` : entityLabel;

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton style={{ fontFamily: FONTS.display }}>
        <Modal.Title style={{ color: COLORS.onSurface, fontWeight: 700 }}>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.onSurfaceVariant }}>
        Bạn có chắc muốn kích hoạt lại {label}? Nội dung sẽ hiển thị lại cho học viên.
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={loading}
          style={{ minHeight: 44 }}
        >
          Hủy
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={onConfirm}
          disabled={loading}
          style={{ minHeight: 44, minWidth: 120, background: COLORS.emeraldDark, borderColor: COLORS.emeraldDark }}
        >
          {loading ? "Đang xử lý…" : "Kích hoạt lại"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
