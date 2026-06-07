// speak-buddi/src/features/admin/tests/AdminTestEditorPage.jsx
// ─── Admin Test Q&A Editor (S9.1) ────────────────────────────────────────────
// Mockup: speak-buddi-docs/ui/quan_li_cau_hoi_dap_an_admin/

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuBan, LuPlus, LuRotateCcw, LuTrash2 } from "react-icons/lu";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import AdminToast from "../components/AdminToast";
import ConfirmDisableModal from "../components/ConfirmDisableModal";
import ConfirmEnableModal from "../components/ConfirmEnableModal";
import {
  formatMappingPair,
  isQuestionIncomplete,
  mapApiErrorToFields,
  parseMappingPair,
  REQUIRED_MSG,
} from "../utils/adminValidation";
import {
  getTestEditor,
  createTest,
  updateTest,
  disableTest,
  enableTest,
  listLevels,
  listTopicsAll,
} from "../services/adminContentService";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "fill_blank", label: "Fill Blank" },
  { value: "grammar_mapping", label: "Grammar Mapping" },
];

const FILL_BLANK_HINT =
  "Dùng ___ (3 dấu gạch) trong câu để đánh dấu chỗ trống. VD: I ___ to school every day.";

const GRAMMAR_MAPPING_HINT =
  "Mỗi cặp: Từ bên trái nối với đáp án bên phải. Lưu dạng \"Từ A → Đáp án A\".";

function answersForType(type) {
  if (type === "fill_blank") {
    return [{ answer_text: "", is_correct: true, display_order: 0 }];
  }
  if (type === "grammar_mapping") {
    return [
      { answer_text: " → ", is_correct: true, display_order: 0 },
      { answer_text: " → ", is_correct: true, display_order: 1 },
    ];
  }
  return [
    { answer_text: "", is_correct: true, display_order: 0 },
    { answer_text: "", is_correct: false, display_order: 1 },
  ];
}

function emptyQuestion(order = 0) {
  return {
    question_text: "",
    question_type: "multiple_choice",
    topic_word_id: null,
    display_order: order,
    answers: [
      { answer_text: "", is_correct: true, display_order: 0 },
      { answer_text: "", is_correct: false, display_order: 1 },
    ],
  };
}

function normalizeQuestions(questions) {
  return (questions || []).map((q, idx) => {
    const questionType =
      q.question_type === "flashcard" ? "multiple_choice" : q.question_type || "multiple_choice";
    const rawAnswers = q.answers || [];
    let answers;

    if (questionType === "fill_blank") {
      answers = rawAnswers.length
        ? rawAnswers.map((a, j) => ({
            answer_text: a.answer_text || "",
            is_correct: Boolean(a.is_correct),
            display_order: a.display_order ?? j,
          }))
        : answersForType("fill_blank");
      if (!answers.some((a) => a.is_correct)) {
        answers[0] = { ...answers[0], is_correct: true };
      }
    } else if (questionType === "grammar_mapping") {
      answers = rawAnswers.length
        ? rawAnswers.map((a, j) => ({
            answer_text: a.answer_text || " → ",
            is_correct: true,
            display_order: a.display_order ?? j,
          }))
        : answersForType("grammar_mapping");
    } else {
      answers = rawAnswers.length
        ? rawAnswers.map((a, j) => ({
            answer_text: a.answer_text || "",
            is_correct: Boolean(a.is_correct),
            display_order: a.display_order ?? j,
          }))
        : answersForType("multiple_choice");
    }

    return {
      question_text: q.question_text || "",
      question_type: questionType,
      topic_word_id: q.topic_word_id || null,
      display_order: q.display_order ?? idx,
      answers,
    };
  });
}

export default function AdminTestEditorPage() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion(0)]);
  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isActive, setIsActive] = useState(true);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    Promise.all([listLevels(), listTopicsAll()])
      .then(([l, t]) => {
        setLevels(l);
        setTopics(t);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getTestEditor(id)
      .then((data) => {
        if (cancelled) return;
        setTitle(data.title || "");
        setDescription(data.description || "");
        setTopicId(data.topic_id || "");
        setLevelId(data.level_id || "");
        setIsActive(data.is_active !== false);
        setQuestions(
          data.questions?.length ? normalizeQuestions(data.questions) : [emptyQuestion(0)]
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setToast({ message: err.message || "Không tải được bài kiểm tra.", type: "error" });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const incompleteCount = useMemo(
    () => questions.filter(isQuestionIncomplete).length,
    [questions]
  );

  function updateQuestion(idx, patch) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function changeQuestionType(qIdx, newType) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, question_type: newType, answers: answersForType(newType) } : q
      )
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion(prev.length)]);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateAnswer(qIdx, aIdx, patch) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const answers = q.answers.map((a, j) => (j === aIdx ? { ...a, ...patch } : a));
        return { ...q, answers };
      })
    );
  }

  function setCorrectAnswer(qIdx, aIdx) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          answers: q.answers.map((a, j) => ({ ...a, is_correct: j === aIdx })),
        };
      })
    );
  }

  function addAnswer(qIdx) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          answers: [
            ...q.answers,
            { answer_text: "", is_correct: false, display_order: q.answers.length },
          ],
        };
      })
    );
  }

  function removeAnswer(qIdx, aIdx) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const answers = q.answers.filter((_, j) => j !== aIdx);
        if (answers.length && !answers.some((a) => a.is_correct)) {
          answers[0] = { ...answers[0], is_correct: true };
        }
        return { ...q, answers };
      })
    );
  }

  function addFillBlankDistractor(qIdx) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          answers: [
            ...q.answers,
            {
              answer_text: "",
              is_correct: false,
              display_order: q.answers.length,
            },
          ],
        };
      })
    );
  }

  function addMappingPair(qIdx) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          answers: [
            ...q.answers,
            {
              answer_text: " → ",
              is_correct: true,
              display_order: q.answers.length,
            },
          ],
        };
      })
    );
  }

  function updateMappingPair(qIdx, aIdx, side, value) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const answers = q.answers.map((a, j) => {
          if (j !== aIdx) return a;
          const { left, right } = parseMappingPair(a.answer_text);
          const nextLeft = side === "left" ? value : left;
          const nextRight = side === "right" ? value : right;
          return {
            ...a,
            answer_text: formatMappingPair(nextLeft, nextRight),
            is_correct: true,
          };
        });
        return { ...q, answers };
      })
    );
  }

  function removeMappingPair(qIdx, aIdx) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return { ...q, answers: q.answers.filter((_, j) => j !== aIdx) };
      })
    );
  }

  function serializeAnswers(q) {
    if (q.question_type === "multiple_choice") {
      return q.answers.map((a, j) => ({
        answer_text: a.answer_text.trim(),
        is_correct: a.is_correct,
        display_order: j,
      }));
    }
    if (q.question_type === "fill_blank") {
      return q.answers
        .filter((a) => a.answer_text?.trim())
        .map((a, j) => ({
          answer_text: a.answer_text.trim(),
          is_correct: a.is_correct,
          display_order: j,
        }));
    }
    if (q.question_type === "grammar_mapping") {
      return q.answers.map((a, j) => ({
        answer_text: a.answer_text.trim(),
        is_correct: true,
        display_order: j,
      }));
    }
    return [];
  }

  function validateClient() {
    const errors = {};
    if (!title.trim()) errors.title = REQUIRED_MSG;
    if (!questions.length) errors._form = "Bài kiểm tra phải có ít nhất 1 câu hỏi.";
    questions.forEach((q, idx) => {
      if (!q.question_text?.trim()) errors[`q${idx}_text`] = REQUIRED_MSG;
      if (isQuestionIncomplete(q)) {
        errors[`q${idx}`] = "MISSING CORRECT ANSWER";
      }
    });
    return errors;
  }

  async function handleSave() {
    setFormError("");
    setFieldErrors({});
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      if (clientErrors._form) setFormError(clientErrors._form);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description || null,
      topic_id: topicId || null,
      level_id: levelId || null,
      questions: questions.map((q, idx) => ({
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        topic_word_id: q.topic_word_id || null,
        display_order: idx,
        answers: serializeAnswers(q),
      })),
    };

    setSaving(true);
    try {
      if (isNew) {
        const created = await createTest(payload);
        setToast({ message: "Đã tạo bài kiểm tra!", type: "success" });
        navigate(`/admin/tests/${created.id}/edit`, { replace: true });
      } else {
        await updateTest(id, payload);
        setToast({ message: "Đã lưu thay đổi!", type: "success" });
      }
    } catch (err) {
      const mapped = mapApiErrorToFields(err.message);
      setFieldErrors(mapped);
      setFormError(mapped._form || err.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDisable() {
    if (isNew) return;
    setDisabling(true);
    try {
      await disableTest(id);
      setIsActive(false);
      setToast({ message: "Đã vô hiệu hóa bài kiểm tra.", type: "success" });
      setShowDisableModal(false);
    } catch (err) {
      setToast({ message: err.message || "Vô hiệu hóa thất bại.", type: "error" });
    } finally {
      setDisabling(false);
    }
  }

  async function handleConfirmEnable() {
    if (isNew) return;
    setEnabling(true);
    try {
      await enableTest(id);
      setIsActive(true);
      setToast({ message: "Đã kích hoạt lại bài kiểm tra.", type: "success" });
      setShowEnableModal(false);
    } catch (err) {
      setToast({ message: err.message || "Kích hoạt thất bại.", type: "error" });
    } finally {
      setEnabling(false);
    }
  }

  if (loading) {
    return <div style={{ color: COLORS.onSurfaceVariant, fontFamily: FONTS.body }}>Đang tải…</div>;
  }

  return (
    <>
      <AdminToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => navigate("/admin/tests")}
            aria-label="Quay lại"
            style={{ color: COLORS.primary, minWidth: 44, minHeight: 44 }}
          >
            <LuArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 700, margin: 0 }}>
              {isNew ? "Tạo bài kiểm tra" : "Edit Test Q&A"}
            </h1>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {!isNew && isActive && (
            <button
              type="button"
              className="btn btn-outline-danger d-flex align-items-center gap-2"
              disabled={disabling}
              onClick={() => setShowDisableModal(true)}
              style={{ minHeight: 44 }}
            >
              <LuBan size={16} /> Vô hiệu hóa
            </button>
          )}
          {!isNew && !isActive && (
            <button
              type="button"
              className="btn btn-outline-success d-flex align-items-center gap-2"
              disabled={enabling}
              onClick={() => setShowEnableModal(true)}
              style={{ minHeight: 44 }}
            >
              <LuRotateCcw size={16} /> Kích hoạt lại
            </button>
          )}
          <button
            type="button"
            className="btn"
            disabled={saving}
            onClick={handleSave}
            style={{ background: COLORS.primary, color: "#fff", minHeight: 44, fontWeight: 600, minWidth: 140 }}
          >
            {saving ? "Đang lưu…" : "Save Changes"}
          </button>
        </div>
      </div>

      {formError && (
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
          {formError}
        </div>
      )}

      {/* Metadata */}
      <div className="card mb-4" style={{ borderRadius: 12, border: `1px solid ${COLORS.outlineVariant}` }}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold">Tiêu đề *</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ borderColor: fieldErrors.title ? "#ba1a1a" : undefined, minHeight: 44 }}
              />
              {fieldErrors.title && (
                <div style={{ color: "#ba1a1a", fontSize: 12, marginTop: 4 }}>{fieldErrors.title}</div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">Chủ đề</label>
              <select
                className="form-select"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                style={{ minHeight: 44 }}
              >
                <option value="">— Không chọn —</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Trình độ</label>
              <select
                className="form-select"
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                style={{ minHeight: 44 }}
              >
                <option value="">— Không chọn —</option>
                {levels.map((lv) => (
                  <option key={lv.id} value={lv.id}>{lv.code}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-control"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions bank header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, margin: 0 }}>
            Questions Bank
          </h2>
          <div className="d-flex gap-2 mt-1 flex-wrap">
            <span
              style={{
                background: COLORS.primaryBg,
                color: COLORS.primary,
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 999,
              }}
            >
              Total: {questions.length} Questions
            </span>
            {incompleteCount > 0 && (
              <span
                style={{
                  background: "#fdecea",
                  color: "#ba1a1a",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                {incompleteCount} Incomplete
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={addQuestion}
          style={{ minHeight: 44, borderColor: COLORS.primary, color: COLORS.primary }}
        >
          <LuPlus size={16} /> Add Question
        </button>
      </div>

      {/* Question cards */}
      <div className="d-flex flex-column gap-3">
        {questions.map((q, qIdx) => {
          const incomplete = isQuestionIncomplete(q);
          const hasError = incomplete || fieldErrors[`q${qIdx}`] || fieldErrors[`q${qIdx}_text`];

          return (
            <div
              key={qIdx}
              className="card"
              style={{
                borderRadius: 12,
                border: `2px solid ${hasError ? "#ba1a1a" : COLORS.outlineVariant}`,
              }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span style={{ fontWeight: 700, fontFamily: FONTS.display }}>
                      Question {qIdx + 1}
                    </span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "auto", minWidth: 160 }}
                      value={q.question_type}
                      onChange={(e) => changeQuestionType(qIdx, e.target.value)}
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {incomplete && (
                      <span
                        style={{
                          background: "#ba1a1a",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "4px 8px",
                          borderRadius: 4,
                          letterSpacing: "0.04em",
                        }}
                      >
                        MISSING CORRECT ANSWER
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-danger p-1"
                    onClick={() => removeQuestion(qIdx)}
                    aria-label="Xóa câu hỏi"
                    style={{ minWidth: 44, minHeight: 44 }}
                  >
                    <LuTrash2 size={18} />
                  </button>
                </div>

                <label className="form-label">Question Text *</label>
                {q.question_type === "fill_blank" && (
                  <div
                    className="mb-2"
                    style={{
                      fontSize: 13,
                      color: COLORS.onSurfaceVariant,
                      background: COLORS.primaryBg,
                      padding: "8px 12px",
                      borderRadius: 8,
                    }}
                  >
                    {FILL_BLANK_HINT}
                  </div>
                )}
                {q.question_type === "grammar_mapping" && (
                  <div
                    className="mb-2"
                    style={{
                      fontSize: 13,
                      color: COLORS.onSurfaceVariant,
                      background: COLORS.primaryBg,
                      padding: "8px 12px",
                      borderRadius: 8,
                    }}
                  >
                    {GRAMMAR_MAPPING_HINT}
                  </div>
                )}
                <input
                  className="form-control mb-3"
                  value={q.question_text}
                  onChange={(e) => updateQuestion(qIdx, { question_text: e.target.value })}
                  placeholder={
                    q.question_type === "fill_blank"
                      ? "I ___ to school every day."
                      : q.question_type === "grammar_mapping"
                        ? "Nối từ với nghĩa tương ứng"
                        : ""
                  }
                  style={{
                    borderColor: fieldErrors[`q${qIdx}_text`] ? "#ba1a1a" : undefined,
                    minHeight: 44,
                  }}
                />
                {q.question_type === "fill_blank" && !q.question_text.includes("___") && q.question_text.trim() && (
                  <div style={{ color: "#ba1a1a", fontSize: 12, marginTop: -8, marginBottom: 12 }}>
                    Cần có ___ trong câu hỏi để đánh dấu chỗ trống.
                  </div>
                )}

                {q.question_type === "multiple_choice" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold" style={{ fontSize: 14 }}>Answer Options</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => addAnswer(qIdx)}
                        style={{ minHeight: 44 }}
                      >
                        Add Option
                      </button>
                    </div>
                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="d-flex align-items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={a.is_correct}
                          onChange={() => setCorrectAnswer(qIdx, aIdx)}
                          style={{ minWidth: 20, minHeight: 20 }}
                          aria-label={`Đáp án đúng ${aIdx + 1}`}
                        />
                        <input
                          className="form-control"
                          value={a.answer_text}
                          onChange={(e) => updateAnswer(qIdx, aIdx, { answer_text: e.target.value })}
                          placeholder={`Option ${aIdx + 1}`}
                          style={{ minHeight: 44 }}
                        />
                        {a.is_correct && (
                          <span
                            style={{
                              background: COLORS.emeraldBg,
                              color: COLORS.emeraldDark,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 8px",
                              borderRadius: 999,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Correct
                          </span>
                        )}
                        {q.answers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-link text-danger p-1"
                            onClick={() => removeAnswer(qIdx, aIdx)}
                            aria-label="Xóa đáp án"
                            style={{ minWidth: 44, minHeight: 44 }}
                          >
                            <LuTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {q.question_type === "fill_blank" && (
                  <div>
                    <div className="fw-semibold mb-2" style={{ fontSize: 14 }}>
                      Đáp án &amp; gợi ý
                    </div>
                    <p style={{ fontSize: 13, color: COLORS.onSurfaceVariant, marginBottom: 12 }}>
                      Chọn 1 đáp án đúng (điền vào ___). Các từ còn lại hiển thị làm gợi ý (word bank).
                    </p>

                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="d-flex align-items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name={`fill-correct-${qIdx}`}
                          checked={a.is_correct}
                          onChange={() => setCorrectAnswer(qIdx, aIdx)}
                          style={{ minWidth: 20, minHeight: 20 }}
                          aria-label={`Đáp án đúng ${aIdx + 1}`}
                        />
                        <input
                          className="form-control"
                          value={a.answer_text}
                          onChange={(e) => updateAnswer(qIdx, aIdx, { answer_text: e.target.value })}
                          placeholder={a.is_correct ? "Đáp án đúng (vd: go)" : "Từ gợi ý (vd: went)"}
                          style={{ minHeight: 44 }}
                        />
                        {a.is_correct ? (
                          <span
                            style={{
                              background: COLORS.emeraldBg,
                              color: COLORS.emeraldDark,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 8px",
                              borderRadius: 999,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Đáp án đúng
                          </span>
                        ) : (
                          <span
                            style={{
                              background: COLORS.primaryBg,
                              color: COLORS.primary,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 8px",
                              borderRadius: 999,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Gợi ý
                          </span>
                        )}
                        {!a.is_correct && (
                          <button
                            type="button"
                            className="btn btn-link text-danger p-1"
                            onClick={() => removeAnswer(qIdx, aIdx)}
                            aria-label="Xóa gợi ý"
                            style={{ minWidth: 44, minHeight: 44 }}
                          >
                            <LuTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary mt-1"
                      onClick={() => addFillBlankDistractor(qIdx)}
                      style={{ minHeight: 44 }}
                    >
                      Thêm từ gợi ý
                    </button>
                  </div>
                )}

                {q.question_type === "grammar_mapping" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold" style={{ fontSize: 14 }}>
                        Cặp nối (Từ A → Đáp án A)
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => addMappingPair(qIdx)}
                        style={{ minHeight: 44 }}
                      >
                        Thêm cặp
                      </button>
                    </div>

                    <div
                      className="row g-2 mb-2 d-none d-md-flex"
                      style={{ fontSize: 12, fontWeight: 600, color: COLORS.onSurfaceVariant }}
                    >
                      <div className="col-md-5">Từ / Cụm từ (A)</div>
                      <div className="col-md-1 text-center">→</div>
                      <div className="col-md-5">Đáp án (A)</div>
                      <div className="col-md-1" />
                    </div>

                    {q.answers.map((a, aIdx) => {
                      const { left, right } = parseMappingPair(a.answer_text);
                      return (
                        <div key={aIdx} className="row g-2 align-items-center mb-2">
                          <div className="col-md-5">
                            <input
                              className="form-control"
                              value={left}
                              onChange={(e) => updateMappingPair(qIdx, aIdx, "left", e.target.value)}
                              placeholder={`Từ A${aIdx + 1}`}
                              style={{ minHeight: 44 }}
                            />
                          </div>
                          <div
                            className="col-md-1 text-center fw-bold"
                            style={{ color: COLORS.primary, fontSize: 18 }}
                            aria-hidden
                          >
                            →
                          </div>
                          <div className="col-md-5">
                            <input
                              className="form-control"
                              value={right}
                              onChange={(e) => updateMappingPair(qIdx, aIdx, "right", e.target.value)}
                              placeholder={`Đáp án A${aIdx + 1}`}
                              style={{ minHeight: 44 }}
                            />
                          </div>
                          <div className="col-md-1">
                            {q.answers.length > 2 && (
                              <button
                                type="button"
                                className="btn btn-link text-danger p-1"
                                onClick={() => removeMappingPair(qIdx, aIdx)}
                                aria-label="Xóa cặp"
                                style={{ minWidth: 44, minHeight: 44 }}
                              >
                                <LuTrash2 size={16} />
                              </button>
                            )}
                          </div>
                          <div className="col-12 d-md-none">
                            <code
                              style={{
                                fontSize: 12,
                                color: COLORS.onSurfaceVariant,
                                background: COLORS.primaryBg,
                                padding: "4px 8px",
                                borderRadius: 6,
                              }}
                            >
                              {formatMappingPair(left, right) || "Từ A → Đáp án A"}
                            </code>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDisableModal
        show={showDisableModal}
        title="Vô hiệu hóa bài kiểm tra"
        entityName={title}
        loading={disabling}
        onConfirm={handleConfirmDisable}
        onCancel={() => setShowDisableModal(false)}
      />

      <ConfirmEnableModal
        show={showEnableModal}
        title="Kích hoạt lại bài kiểm tra"
        entityName={title}
        loading={enabling}
        onConfirm={handleConfirmEnable}
        onCancel={() => setShowEnableModal(false)}
      />
    </>
  );
}
