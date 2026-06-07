// speak-buddi/src/features/admin/topics/AdminTopicsPage.jsx
// ─── Admin Topics Library (S9.1 + S9.2 soft delete + S9.5 crawl admin) ───────────

import { useCallback, useEffect, useState } from "react";
import { LuBan, LuPlus, LuRotateCcw, LuSearch } from "react-icons/lu";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import AdminPagination from "../components/AdminPagination";
import AdminToast from "../components/AdminToast";
import ConfirmDisableModal from "../components/ConfirmDisableModal";
import ConfirmEnableModal from "../components/ConfirmEnableModal";
import ContentFormModal from "../components/ContentFormModal";
import {
  listTopics,
  listLevels,
  createTopic,
  updateTopic,
  disableTopic,
  enableTopic,
} from "../services/adminContentService";

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

export default function AdminTopicsPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [levels, setLevels] = useState([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, initial: null });
  const [disableModal, setDisableModal] = useState({ show: false, topic: null });
  const [enableModal, setEnableModal] = useState({ show: false, topic: null });
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    listLevels().then(setLevels).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTopics({
        search: search || undefined,
        levelId: levelFilter || undefined,
        status: statusFilter,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        limit: pageSize,
        offset,
      });
      setData(res);
    } catch (err) {
      setToast({ message: err.message || "Không tải được danh sách.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, levelFilter, statusFilter, sourceFilter, pageSize, offset]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSave(values) {
    const body = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      level_id: values.level_id || null,
      description: values.description || null,
      display_order: values.display_order || 0,
    };
    if (modal.initial?.id) {
      await updateTopic(modal.initial.id, body);
      setToast({ message: "Đã cập nhật chủ đề!", type: "success" });
    } else {
      await createTopic(body);
      setToast({ message: "Đã tạo chủ đề mới!", type: "success" });
    }
    await load();
  }

  async function handleConfirmDisable() {
    if (!disableModal.topic) return;
    setDisabling(true);
    try {
      await disableTopic(disableModal.topic.id);
      setToast({ message: "Đã vô hiệu hóa chủ đề.", type: "success" });
      setDisableModal({ show: false, topic: null });
      await load();
    } catch (err) {
      setToast({ message: err.message || "Vô hiệu hóa thất bại.", type: "error" });
    } finally {
      setDisabling(false);
    }
  }

  async function handleConfirmEnable() {
    if (!enableModal.topic) return;
    setEnabling(true);
    try {
      await enableTopic(enableModal.topic.id);
      setToast({ message: "Đã kích hoạt lại chủ đề.", type: "success" });
      setEnableModal({ show: false, topic: null });
      await load();
    } catch (err) {
      setToast({ message: err.message || "Kích hoạt thất bại.", type: "error" });
    } finally {
      setEnabling(false);
    }
  }

  function resetPage() {
    setOffset(0);
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
          <h1 style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, color: COLORS.onSurface, margin: 0 }}>
            Topics Library
          </h1>
          <p style={{ color: COLORS.onSurfaceVariant, margin: "4px 0 0", fontFamily: FONTS.body }}>
            Quản lý chủ đề học tập
          </p>
        </div>
        <button
          type="button"
          className="btn d-flex align-items-center gap-2"
          style={{ background: COLORS.primary, color: "#fff", minHeight: 44, fontWeight: 600 }}
          onClick={() => setModal({ show: true, initial: null })}
        >
          <LuPlus size={18} /> Add New Topic
        </button>
      </div>

      <div className="d-flex flex-wrap gap-3 mb-4">
        <div className="position-relative flex-grow-1" style={{ maxWidth: 400 }}>
          <LuSearch
            size={18}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.outline }}
          />
          <input
            type="search"
            className="form-control ps-5"
            placeholder="Tìm chủ đề…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            style={{ minHeight: 44, fontFamily: FONTS.body }}
          />
        </div>
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 180, minHeight: 44 }}
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
            resetPage();
          }}
          style={{ maxWidth: 180, minHeight: 44 }}
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={levelFilter}
          onChange={(e) => {
            setLevelFilter(e.target.value);
            resetPage();
          }}
          style={{ maxWidth: 180, minHeight: 44 }}
        >
          <option value="">All Levels</option>
          {levels.map((lv) => (
            <option key={lv.id} value={lv.id}>{lv.code}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: COLORS.onSurfaceVariant }}>Đang tải…</div>
      ) : data.items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            background: COLORS.surfaceLow,
            borderRadius: 16,
            color: COLORS.onSurfaceVariant,
          }}
        >
          Không có chủ đề phù hợp bộ lọc.
        </div>
      ) : (
        <div className="row g-3">
          {data.items.map((topic) => (
            <div key={topic.id} className="col-12 col-md-6 col-xl-4">
              <div
                className="card h-100"
                style={{ borderRadius: 16, border: `1px solid ${COLORS.outlineVariant}` }}
              >
                <div
                  className="card-body p-4"
                  style={{ cursor: "pointer" }}
                  onClick={() => setModal({ show: true, initial: topic })}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <span
                        style={{
                          background: topic.is_active ? COLORS.emeraldBg : "#f3f2f8",
                          color: topic.is_active ? COLORS.emeraldDark : COLORS.outline,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 999,
                          textTransform: "uppercase",
                        }}
                      >
                        {topic.is_active ? "Active" : "Draft"}
                      </span>
                      {topic.source === "langeek" && (
                        <span
                          style={{
                            background: COLORS.primaryBg,
                            color: COLORS.primary,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 999,
                            textTransform: "uppercase",
                          }}
                        >
                          Langeek
                        </span>
                      )}
                    </div>
                    {topic.level_code && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>
                        {topic.level_code}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    {topic.name}
                  </h3>
                  <p
                    style={{
                      color: COLORS.onSurfaceVariant,
                      fontSize: 14,
                      marginBottom: 16,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {topic.description || "—"}
                  </p>
                  <div style={{ fontSize: 13, color: COLORS.onSurfaceVariant }}>
                    <strong>{topic.word_count ?? 0}</strong> Words
                  </div>
                </div>
                {topic.is_active ? (
                  <div className="card-footer bg-transparent border-0 pt-0 px-4 pb-4">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
                      style={{ minHeight: 44 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDisableModal({ show: true, topic });
                      }}
                    >
                      <LuBan size={16} /> Vô hiệu hóa
                    </button>
                  </div>
                ) : (
                  <div className="card-footer bg-transparent border-0 pt-0 px-4 pb-4">
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm d-flex align-items-center gap-2"
                      style={{ minHeight: 44 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnableModal({ show: true, topic });
                      }}
                    >
                      <LuRotateCcw size={16} /> Kích hoạt lại
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminPagination
        total={data.total}
        offset={offset}
        pageSize={pageSize}
        onOffsetChange={setOffset}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setOffset(0);
        }}
        itemLabel="chủ đề"
        className="mt-4"
      />

      <ContentFormModal
        show={modal.show}
        mode="topic"
        initial={modal.initial}
        levels={levels}
        onClose={() => setModal({ show: false, initial: null })}
        onSubmit={handleSave}
      />

      <ConfirmDisableModal
        show={disableModal.show}
        title="Vô hiệu hóa chủ đề"
        entityName={disableModal.topic?.name}
        loading={disabling}
        onConfirm={handleConfirmDisable}
        onCancel={() => setDisableModal({ show: false, topic: null })}
      />

      <ConfirmEnableModal
        show={enableModal.show}
        title="Kích hoạt lại chủ đề"
        entityName={enableModal.topic?.name}
        loading={enabling}
        onConfirm={handleConfirmEnable}
        onCancel={() => setEnableModal({ show: false, topic: null })}
      />
    </>
  );
}
