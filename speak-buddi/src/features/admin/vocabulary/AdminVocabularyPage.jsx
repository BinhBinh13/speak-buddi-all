// speak-buddi/src/features/admin/vocabulary/AdminVocabularyPage.jsx
// ─── Admin Vocabulary table (S9.1) ─────────────────────────────────────────────
// Mockup: speak-buddi-docs/ui/quan_li_tu_vung_admin/

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuBan, LuLock, LuPlus, LuRotateCcw, LuSearch } from "react-icons/lu";
import { BADGE_COLORS } from "../../profile/constants/levels";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import AdminPagination from "../components/AdminPagination";
import AdminToast from "../components/AdminToast";
import ConfirmDisableModal from "../components/ConfirmDisableModal";
import ConfirmEnableModal from "../components/ConfirmEnableModal";
import ContentFormModal from "../components/ContentFormModal";
import {
  listWords,
  listTopicsAll,
  listLevels,
  createWord,
  updateWord,
  disableWord,
  enableWord,
} from "../services/adminContentService";

const PAGE_SIZE_DEFAULT = 20;
const STATUS_OPTIONS = [
  { value: "all", label: "Status: All" },
  { value: "active", label: "Status: Active" },
  { value: "inactive", label: "Status: Draft" },
];

const SOURCE_OPTIONS = [
  { value: "all", label: "Source: All" },
  { value: "admin", label: "Source: Manual" },
  { value: "langeek", label: "Source: Langeek" },
];

function LevelBadge({ code }) {
  if (!code) return <span style={{ color: COLORS.outline }}>—</span>;
  const c = BADGE_COLORS[code] || { bg: "#f3f2f8", text: COLORS.onSurfaceVariant };
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        fontWeight: 700,
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      {code}
    </span>
  );
}

export default function AdminVocabularyPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [topics, setTopics] = useState([]);
  const [levels, setLevels] = useState([]);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, initial: null });
  const [disableModal, setDisableModal] = useState({ show: false, word: null });
  const [enableModal, setEnableModal] = useState({ show: false, word: null });
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    Promise.all([listTopicsAll({ includeInactive: true }), listLevels()])
      .then(([t, l]) => {
        setTopics(t);
        setLevels(l);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWords({
        search: search || undefined,
        topicId: topicFilter || undefined,
        levelId: levelFilter || undefined,
        includeInactive: statusFilter !== "active",
        limit: pageSize,
        offset,
      });
      setData(res);
    } catch (err) {
      setToast({ message: err.message || "Không tải được từ vựng.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, topicFilter, levelFilter, statusFilter, pageSize, offset]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSave(values) {
    const body = {
      topic_id: values.topic_id,
      word: values.word.trim(),
      phonetic: values.phonetic || null,
      meaning_vi: values.meaning_vi.trim(),
      meaning_en: values.meaning_en || null,
      example_sentence: values.example_sentence || null,
      grammar_note: values.grammar_note || null,
      level_id: values.level_id || null,
      display_order: values.display_order || 0,
      tag_ids: values.tag_ids || [],
    };
    if (modal.initial?.id) {
      await updateWord(modal.initial.id, body);
      setToast({ message: "Đã cập nhật từ vựng!", type: "success" });
    } else {
      await createWord(body);
      setToast({ message: "Đã thêm từ vựng mới!", type: "success" });
    }
    await load();
  }

  const displayedItems = useMemo(() => {
    let rows = data.items;
    if (statusFilter === "inactive") rows = rows.filter((w) => !w.is_active);
    else if (statusFilter === "active") rows = rows.filter((w) => w.is_active);
    if (sourceFilter === "langeek") rows = rows.filter((w) => w.source === "langeek");
    else if (sourceFilter === "admin") rows = rows.filter((w) => w.source !== "langeek");
    return rows;
  }, [data.items, statusFilter, sourceFilter]);

  async function handleConfirmDisable() {
    if (!disableModal.word) return;
    setDisabling(true);
    try {
      await disableWord(disableModal.word.id);
      setToast({ message: "Đã vô hiệu hóa từ vựng.", type: "success" });
      setDisableModal({ show: false, word: null });
      await load();
    } catch (err) {
      setToast({ message: err.message || "Vô hiệu hóa thất bại.", type: "error" });
    } finally {
      setDisabling(false);
    }
  }

  async function handleConfirmEnable() {
    if (!enableModal.word) return;
    setEnabling(true);
    try {
      await enableWord(enableModal.word.id);
      setToast({ message: "Đã kích hoạt lại từ vựng.", type: "success" });
      setEnableModal({ show: false, word: null });
      await load();
    } catch (err) {
      setToast({ message: err.message || "Kích hoạt thất bại.", type: "error" });
    } finally {
      setEnabling(false);
    }
  }


  return (
    <>
      <AdminToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, margin: 0 }}>
            Vocabulary
          </h1>
          <p style={{ color: COLORS.onSurfaceVariant, margin: "4px 0 0" }}>
            Quản lý từ vựng theo chủ đề
          </p>
        </div>
        <button
          type="button"
          className="btn d-flex align-items-center gap-2"
          style={{ background: COLORS.primary, color: "#fff", minHeight: 44, fontWeight: 600 }}
          onClick={() => setModal({ show: true, initial: null })}
        >
          <LuPlus size={18} /> Thêm từ
        </button>
      </div>

      <div className="d-flex flex-wrap gap-3 mb-4">
        <div className="position-relative flex-grow-1" style={{ maxWidth: 360 }}>
          <LuSearch
            size={18}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.outline }}
          />
          <input
            type="search"
            className="form-control ps-5"
            placeholder="Tìm từ, IPA, nghĩa…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            style={{ minHeight: 44 }}
          />
        </div>
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOffset(0);
          }}
          style={{ maxWidth: 160, minHeight: 44 }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setOffset(0);
          }}
          style={{ maxWidth: 160, minHeight: 44 }}
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={topicFilter}
          onChange={(e) => {
            setTopicFilter(e.target.value);
            setOffset(0);
          }}
          style={{ maxWidth: 200, minHeight: 44 }}
        >
          <option value="">All Topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={levelFilter}
          onChange={(e) => {
            setLevelFilter(e.target.value);
            setOffset(0);
          }}
          style={{ maxWidth: 140, minHeight: 44 }}
        >
          <option value="">All Levels</option>
          {levels.map((lv) => (
            <option key={lv.id} value={lv.id}>{lv.code}</option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table align-middle" style={{ fontFamily: FONTS.body, minWidth: 640 }}>
          <thead style={{ background: COLORS.surfaceLow }}>
            <tr>
              <th>Word</th>
              <th>IPA</th>
              <th>Vietnamese Meaning</th>
              <th>Difficulty</th>
              <th>Topic</th>
              <th>Source</th>
              <th>Status</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ color: COLORS.onSurfaceVariant }}>Đang tải…</td></tr>
            ) : displayedItems.length === 0 ? (
              <tr><td colSpan={8} style={{ color: COLORS.onSurfaceVariant }}>Không có từ vựng phù hợp.</td></tr>
            ) : (
              displayedItems.map((w) => (
                <tr key={w.id}>
                  <td
                    style={{ fontWeight: 600, cursor: "pointer" }}
                    onClick={() => setModal({ show: true, initial: w })}
                  >
                    {w.word}
                  </td>
                  <td
                    style={{ color: COLORS.onSurfaceVariant, cursor: "pointer" }}
                    onClick={() => setModal({ show: true, initial: w })}
                  >
                    {w.phonetic || "—"}
                  </td>
                  <td style={{ cursor: "pointer" }} onClick={() => setModal({ show: true, initial: w })}>
                    {w.meaning_vi}
                  </td>
                  <td style={{ cursor: "pointer" }} onClick={() => setModal({ show: true, initial: w })}>
                    <LevelBadge code={w.level_code} />
                  </td>
                  <td
                    style={{ color: COLORS.onSurfaceVariant, cursor: "pointer" }}
                    onClick={() => setModal({ show: true, initial: w })}
                  >
                    {w.topic_name || "—"}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: w.source === "langeek" ? COLORS.primaryBg : "#f3f2f8",
                        color: w.source === "langeek" ? COLORS.primary : COLORS.outline,
                      }}
                    >
                      {w.source === "langeek" ? "Langeek" : "Manual"}
                    </span>
                    {w.admin_locked && (
                      <LuLock
                        size={14}
                        title="Đã khóa — crawler không ghi đè"
                        style={{ marginLeft: 6, color: COLORS.outline, verticalAlign: "middle" }}
                      />
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: w.is_active ? COLORS.emeraldBg : "#f3f2f8",
                        color: w.is_active ? COLORS.emeraldDark : COLORS.outline,
                      }}
                    >
                      {w.is_active ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td>
                    {w.is_active ? (
                      <button
                        type="button"
                        className="btn btn-link text-danger p-1"
                        aria-label={`Vô hiệu hóa ${w.word}`}
                        style={{ minWidth: 44, minHeight: 44 }}
                        onClick={() => setDisableModal({ show: true, word: w })}
                      >
                        <LuBan size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-link p-1"
                        aria-label={`Kích hoạt lại ${w.word}`}
                        style={{ minWidth: 44, minHeight: 44, color: COLORS.emeraldDark }}
                        onClick={() => setEnableModal({ show: true, word: w })}
                      >
                        <LuRotateCcw size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        total={data.total}
        offset={offset}
        pageSize={pageSize}
        onOffsetChange={setOffset}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setOffset(0);
        }}
        itemLabel="từ"
        className="mt-3"
      />

      <ContentFormModal
        show={modal.show}
        mode="word"
        initial={modal.initial}
        levels={levels}
        topics={topics}
        onClose={() => setModal({ show: false, initial: null })}
        onSubmit={handleSave}
      />

      <ConfirmDisableModal
        show={disableModal.show}
        title="Vô hiệu hóa từ vựng"
        entityName={disableModal.word?.word}
        loading={disabling}
        onConfirm={handleConfirmDisable}
        onCancel={() => setDisableModal({ show: false, word: null })}
      />

      <ConfirmEnableModal
        show={enableModal.show}
        title="Kích hoạt lại từ vựng"
        entityName={enableModal.word?.word}
        loading={enabling}
        onConfirm={handleConfirmEnable}
        onCancel={() => setEnableModal({ show: false, word: null })}
      />
    </>
  );
}
