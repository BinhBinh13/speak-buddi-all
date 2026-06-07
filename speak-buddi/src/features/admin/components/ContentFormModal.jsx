// speak-buddi/src/features/admin/components/ContentFormModal.jsx
// Modal form dùng chung cho Topic & Word (S9.1 — AC-13-02 inline validation)

import { useState } from "react";
import { Modal, Form } from "react-bootstrap";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import {
  mapApiErrorToFields,
  slugify,
  validateTopicForm,
  validateWordForm,
  REQUIRED_MSG,
} from "../utils/adminValidation";

const EMPTY_TOPIC = { name: "", slug: "", level_id: "", description: "", display_order: 0 };
const EMPTY_WORD = {
  topic_id: "",
  word: "",
  phonetic: "",
  meaning_vi: "",
  meaning_en: "",
  example_sentence: "",
  grammar_note: "",
  level_id: "",
  display_order: 0,
  tag_ids: [],
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
 *   mode: "topic" | "word",
 *   initial?: object,
 *   levels: object[],
 *   topics?: object[],
 *   onClose: () => void,
 *   onSubmit: (values: object) => Promise<void>,
 * }} props
 */
export default function ContentFormModal(props) {
  if (!props.show) return null;
  const formKey = `${props.mode}-${props.initial?.id ?? "new"}`;
  return <ContentFormModalInner key={formKey} {...props} />;
}

function ContentFormModalInner({
  show,
  mode,
  initial,
  levels,
  topics = [],
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(initial?.id);
  const [values, setValues] = useState(() => ({
    ...(mode === "topic" ? EMPTY_TOPIC : EMPTY_WORD),
    ...(initial || {}),
    level_id: initial?.level_id || "",
    topic_id: initial?.topic_id || "",
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  function setField(key, val) {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      if (mode === "topic" && key === "name" && autoSlug) {
        next.slug = slugify(val);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined, _form: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = mode === "topic" ? validateTopicForm(values) : validateWordForm(values);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...values,
        display_order: Number(values.display_order) || 0,
        level_id: values.level_id || null,
      };
      if (mode === "word") {
        payload.topic_id = values.topic_id;
        payload.tag_ids = values.tag_ids || [];
      }
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const mapped = mapApiErrorToFields(err.message);
      if (Object.keys(mapped).length === 0) {
        setErrors({ _form: err.message || "Lưu thất bại." });
      } else {
        setErrors(mapped);
      }
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = (field) => ({
    borderColor: errors[field] ? "#ba1a1a" : COLORS.outlineVariant,
    fontFamily: FONTS.body,
    minHeight: 44,
  });

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton style={{ fontFamily: FONTS.display }}>
        <Modal.Title style={{ color: COLORS.primary, fontWeight: 700 }}>
          {isEdit
            ? mode === "topic" ? "Sửa chủ đề" : "Sửa từ vựng"
            : mode === "topic" ? "Thêm chủ đề mới" : "Thêm từ vựng mới"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ fontFamily: FONTS.body }}>
          {isEdit && initial?.source === "langeek" && (
            <div
              style={{
                background: COLORS.primaryBg,
                color: COLORS.primary,
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              Nội dung từ Langeek — chỉnh sửa sẽ khóa đồng bộ tự động từ crawler.
            </div>
          )}
          {errors._form && (
            <div
              style={{
                background: "#fdecea",
                color: "#ba1a1a",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {errors._form}
            </div>
          )}

          {mode === "topic" ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Tên chủ đề *</Form.Label>
                <Form.Control
                  value={values.name}
                  onChange={(e) => setField("name", e.target.value)}
                  style={inputStyle("name")}
                  isInvalid={!!errors.name}
                />
                <FieldError error={errors.name} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Slug (đường dẫn) *</Form.Label>
                <Form.Control
                  value={values.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setField("slug", e.target.value);
                  }}
                  style={inputStyle("slug")}
                  isInvalid={!!errors.slug}
                />
                <FieldError error={errors.slug} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Trình độ</Form.Label>
                <Form.Select
                  value={values.level_id}
                  onChange={(e) => setField("level_id", e.target.value)}
                  style={inputStyle("level_id")}
                >
                  <option value="">— Không chọn —</option>
                  {levels.map((lv) => (
                    <option key={lv.id} value={lv.id}>{lv.code} — {lv.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={values.description || ""}
                  onChange={(e) => setField("description", e.target.value)}
                  style={inputStyle("description")}
                />
              </Form.Group>
            </>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Chủ đề *</Form.Label>
                <Form.Select
                  value={values.topic_id}
                  onChange={(e) => setField("topic_id", e.target.value)}
                  style={inputStyle("topic_id")}
                  isInvalid={!!errors.topic_id}
                >
                  <option value="">— Chọn chủ đề —</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Form.Select>
                <FieldError error={errors.topic_id} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Từ (EN) *</Form.Label>
                <Form.Control
                  value={values.word}
                  onChange={(e) => setField("word", e.target.value)}
                  style={inputStyle("word")}
                  isInvalid={!!errors.word}
                />
                <FieldError error={errors.word} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>IPA</Form.Label>
                <Form.Control
                  value={values.phonetic || ""}
                  onChange={(e) => setField("phonetic", e.target.value)}
                  style={inputStyle("phonetic")}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nghĩa tiếng Việt *</Form.Label>
                <Form.Control
                  value={values.meaning_vi}
                  onChange={(e) => setField("meaning_vi", e.target.value)}
                  style={inputStyle("meaning_vi")}
                  isInvalid={!!errors.meaning_vi}
                />
                <FieldError error={errors.meaning_vi} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nghĩa tiếng Anh</Form.Label>
                <Form.Control
                  value={values.meaning_en || ""}
                  onChange={(e) => setField("meaning_en", e.target.value)}
                  style={inputStyle("meaning_en")}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Trình độ</Form.Label>
                <Form.Select
                  value={values.level_id}
                  onChange={(e) => setField("level_id", e.target.value)}
                  style={inputStyle("level_id")}
                >
                  <option value="">— Không chọn —</option>
                  {levels.map((lv) => (
                    <option key={lv.id} value={lv.id}>{lv.code}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={saving}
            style={{ minHeight: 44 }}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ background: COLORS.primary, borderColor: COLORS.primary, minHeight: 44, minWidth: 120 }}
          >
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export { REQUIRED_MSG };
