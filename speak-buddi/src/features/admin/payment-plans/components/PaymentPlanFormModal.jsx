// speak-buddi/src/features/admin/payment-plans/components/PaymentPlanFormModal.jsx
// Modal create/edit payment plan (S10.1 — AC-14-02 inline validation)

import { useState } from "react";
import { Modal, Form } from "react-bootstrap";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { COLORS, FONTS } from "../../../../shared/constants/theme";
import {
  mapPaymentPlanApiErrorToFields,
  validatePaymentPlanForm,
} from "../../utils/adminValidation";

const EMPTY = {
  name: "",
  price_vnd: "",
  duration_days: "0",
  description: "",
  features: [""],
  sort_order: "0",
  is_free: false,
};

function FieldError({ error }) {
  if (!error) return null;
  return (
    <div style={{ color: "#ba1a1a", fontSize: 12, marginTop: 4, fontFamily: FONTS.body }}>
      {error}
    </div>
  );
}

/**
 * @param {{
 *   show: boolean,
 *   initial?: object | null,
 *   onClose: () => void,
 *   onSubmit: (values: object) => Promise<void>,
 * }} props
 */
export default function PaymentPlanFormModal({ show, initial, onClose, onSubmit }) {
  if (!show) return null;
  const formKey = initial?.id ?? "new";
  return (
    <PaymentPlanFormModalInner
      key={formKey}
      show={show}
      initial={initial}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function PaymentPlanFormModalInner({ show, initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial?.id);
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    name: initial?.name ?? "",
    price_vnd: initial?.price_vnd != null ? String(initial.price_vnd) : "",
    duration_days: initial?.duration_days != null ? String(initial.duration_days) : "0",
    description: initial?.description ?? "",
    features: initial?.features?.length ? [...initial.features] : [""],
    sort_order: initial?.sort_order != null ? String(initial.sort_order) : "0",
    is_free: initial ? Number(initial.price_vnd) === 0 : false,
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function setField(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next.features;
      delete next._form;
      return next;
    });
  }

  function setFeature(idx, val) {
    setValues((prev) => {
      const feats = [...prev.features];
      feats[idx] = val;
      return { ...prev, features: feats };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.features;
      return next;
    });
  }

  function addFeature() {
    setValues((prev) => ({ ...prev, features: [...prev.features, ""] }));
  }

  function removeFeature(idx) {
    setValues((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  }

  function buildPayload() {
    const price = values.is_free ? 0 : parseInt(values.price_vnd, 10);
    const duration = parseInt(values.duration_days, 10);
    const sort = parseInt(values.sort_order, 10);
    return {
      name: values.name.trim(),
      price_vnd: Number.isNaN(price) ? -1 : price,
      duration_days: Number.isNaN(duration) ? -1 : duration,
      description: values.description.trim() || null,
      features: values.features.map((f) => f.trim()).filter(Boolean),
      sort_order: Number.isNaN(sort) ? 0 : sort,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = buildPayload();
    const clientErrors = validatePaymentPlanForm({
      ...payload,
      is_free: values.is_free,
      features: values.features,
    });
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const mapped = mapPaymentPlanApiErrorToFields(err.message);
      setErrors(mapped);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered size="lg" backdrop="static">
      <Modal.Header closeButton style={{ fontFamily: FONTS.body }}>
        <Modal.Title>{isEdit ? "Sửa gói thanh toán" : "Tạo gói mới"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ fontFamily: FONTS.body }}>
          {errors._form && <FieldError error={errors._form} />}

          <Form.Group className="mb-3">
            <Form.Label>Tên gói *</Form.Label>
            <Form.Control
              value={values.name}
              onChange={(e) => setField("name", e.target.value)}
              isInvalid={Boolean(errors.name)}
              placeholder="VD: Pro tháng"
            />
            <FieldError error={errors.name} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="plan-is-free"
              label="Gói miễn phí (giá = 0 ₫)"
              checked={values.is_free}
              onChange={(e) => {
                setField("is_free", e.target.checked);
                if (e.target.checked) setField("price_vnd", "0");
              }}
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Giá (VND) *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={values.is_free ? "0" : values.price_vnd}
                  disabled={values.is_free}
                  onChange={(e) => setField("price_vnd", e.target.value)}
                  isInvalid={Boolean(errors.price_vnd)}
                  placeholder="99000"
                />
                <FieldError error={errors.price_vnd} />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Thời hạn (ngày) *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={values.duration_days}
                  onChange={(e) => setField("duration_days", e.target.value)}
                  isInvalid={Boolean(errors.duration_days)}
                  placeholder="0 = vĩnh viễn"
                />
                <Form.Text muted>0 = vĩnh viễn / gói free</Form.Text>
                <FieldError error={errors.duration_days} />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Mô tả ngắn về gói"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">Tính năng *</Form.Label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                onClick={addFeature}
                style={{ minHeight: 36, borderColor: COLORS.primary, color: COLORS.primary }}
              >
                <LuPlus size={14} /> Thêm
              </button>
            </div>
            {values.features.map((feat, idx) => (
              <div key={idx} className="d-flex gap-2 mb-2">
                <Form.Control
                  value={feat}
                  onChange={(e) => setFeature(idx, e.target.value)}
                  placeholder={`Tính năng ${idx + 1}`}
                  isInvalid={Boolean(errors.features) && idx === 0}
                />
                {values.features.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeFeature(idx)}
                    aria-label="Xóa tính năng"
                    style={{ minWidth: 44, minHeight: 44 }}
                  >
                    <LuTrash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <FieldError error={errors.features} />
          </Form.Group>

          <Form.Group className="mb-1">
            <Form.Label>Thứ tự hiển thị</Form.Label>
            <Form.Control
              type="number"
              value={values.sort_order}
              onChange={(e) => setField("sort_order", e.target.value)}
              style={{ maxWidth: 120 }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-light" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button
            type="submit"
            className="btn text-white"
            disabled={saving}
            style={{ background: COLORS.emeraldDark, minHeight: 44, minWidth: 120 }}
          >
            {saving ? "Đang lưu…" : isEdit ? "Cập nhật" : "Tạo gói"}
          </button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
