// speak-buddi/src/features/admin/components/ConfirmDisableModal.jsx
// Modal xác nhận vô hiệu hóa nội dung (S9.2 — AC-13-03)

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
export default function ConfirmDisableModal({
  show,
  title = "Vô hiệu hóa nội dung",
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
        Bạn có chắc muốn vô hiệu hóa {label}? Nội dung sẽ không còn hiển thị cho học viên.
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
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={loading}
          style={{ minHeight: 44, minWidth: 120 }}
        >
          {loading ? "Đang xử lý…" : "Vô hiệu hóa"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
