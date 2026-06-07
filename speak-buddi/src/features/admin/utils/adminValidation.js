// speak-buddi/src/features/admin/utils/adminValidation.js
// ─── Validation helpers cho Admin content forms (S9.1 — AC-13-02, §5.2) ─────

export const REQUIRED_MSG = "⚠ Vui lòng điền đầy đủ thông tin.";

/** Sinh slug từ tên topic (ASCII, lowercase, hyphen). */
export function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Map message lỗi BE → field key cho inline validation.
 * @param {string} message
 * @returns {Record<string, string>}
 */
export function mapApiErrorToFields(message) {
  const msg = message || "";
  const fields = {};

  if (msg.includes("Tên chủ đề")) fields.name = msg;
  else if (msg.includes("slug") || msg.includes("Đường dẫn")) fields.slug = msg;
  else if (msg.includes("Từ này")) fields.word = msg;
  else if (msg.includes("Chủ đề không tồn tại")) fields.topic_id = msg;
  else if (msg.includes("điền đầy đủ")) {
    fields._form = REQUIRED_MSG;
  }   else if (msg.includes("Missing Correct Answer") || msg.includes("đáp án đúng")) {
    fields._form = msg;
  } else if (msg.includes("___") || msg.includes("Fill Blank")) {
    fields._form = msg;
  } else if (msg.includes("Grammar Mapping") || msg.includes(" → ")) {
    fields._form = msg;
  } else if (msg.includes("ít nhất 1 câu hỏi")) {
    fields._form = msg;
  }

  return fields;
}

// ─── Payment plan (S10.1 — AC-14-02) ───────────────────────────────────────

export const MSG_PLAN_NAME = "⚠ Vui lòng nhập tên gói.";
export const MSG_PLAN_PRICE_NEG = "⚠ Giá gói không được nhỏ hơn 0.";
export const MSG_PLAN_PRICE_PAID = "⚠ Giá gói trả phí phải lớn hơn 0.";
export const MSG_PLAN_FEATURES = "⚠ Gói phải có ít nhất 1 tính năng.";
export const MSG_PLAN_DURATION = "⚠ Thời hạn không hợp lệ.";

export function mapPaymentPlanApiErrorToFields(message) {
  const msg = message || "";
  const fields = {};

  if (msg.includes("tên gói")) fields.name = msg;
  else if (msg.includes("Giá gói")) fields.price_vnd = msg;
  else if (msg.includes("tính năng")) fields.features = msg;
  else if (msg.includes("Thời hạn")) fields.duration_days = msg;
  else if (msg) fields._form = msg;

  return fields;
}

/** Validate payment plan form client-side trước khi gọi API. */
export function validatePaymentPlanForm(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = MSG_PLAN_NAME;

  const price = values.price_vnd;
  if (price == null || Number.isNaN(price) || price < 0) {
    errors.price_vnd = MSG_PLAN_PRICE_NEG;
  } else if (!values.is_free && price === 0) {
    errors.price_vnd = MSG_PLAN_PRICE_PAID;
  }

  const duration = values.duration_days;
  if (duration == null || Number.isNaN(duration) || duration < 0) {
    errors.duration_days = MSG_PLAN_DURATION;
  }

  const feats = (values.features || []).map((f) => (typeof f === "string" ? f.trim() : f)).filter(Boolean);
  if (!feats.length) errors.features = MSG_PLAN_FEATURES;

  return errors;
}

/** Validate topic form client-side trước khi gọi API. */
export function validateTopicForm(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = REQUIRED_MSG;
  if (!values.slug?.trim()) errors.slug = REQUIRED_MSG;
  return errors;
}

/** Validate word form client-side trước khi gọi API. */
export function validateWordForm(values) {
  const errors = {};
  if (!values.topic_id) errors.topic_id = REQUIRED_MSG;
  if (!values.word?.trim()) errors.word = REQUIRED_MSG;
  if (!values.meaning_vi?.trim()) errors.meaning_vi = REQUIRED_MSG;
  return errors;
}

/** Tách cặp Grammar Mapping: "Từ A → Đáp án A". */
export function parseMappingPair(answerText) {
  const text = answerText || "";
  const idx = text.indexOf(" → ");
  if (idx === -1) return { left: text.trim(), right: "" };
  return {
    left: text.slice(0, idx).trim(),
    right: text.slice(idx + 3).trim(),
  };
}

/** Ghép cặp Grammar Mapping theo format chuẩn. */
export function formatMappingPair(left, right) {
  return `${(left || "").trim()} → ${(right || "").trim()}`;
}

/** Kiểm tra câu hỏi chưa đủ dữ liệu (client mirror BE). */
export function isQuestionIncomplete(question) {
  const type = question.question_type;

  if (type === "multiple_choice") {
    return !question.answers?.some((a) => a.is_correct && a.answer_text?.trim());
  }

  if (type === "fill_blank") {
    const hasBlank = (question.question_text || "").includes("___");
    const hasCorrect = question.answers?.some((a) => a.is_correct && a.answer_text?.trim());
    return !hasBlank || !hasCorrect;
  }

  if (type === "grammar_mapping") {
    const pairs = question.answers || [];
    if (pairs.length < 2) return true;
    return pairs.some((a) => {
      const { left, right } = parseMappingPair(a.answer_text);
      return !left || !right;
    });
  }

  return false;
}
