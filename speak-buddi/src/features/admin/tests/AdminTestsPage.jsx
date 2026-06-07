// speak-buddi/src/features/admin/tests/AdminTestsPage.jsx
// ─── Admin Tests Repository (S9.1 + S9.2 soft delete) ────────────────────────

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuBan, LuPlus, LuRotateCcw, LuSearch } from "react-icons/lu";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import AdminPagination from "../components/AdminPagination";
import AdminToast from "../components/AdminToast";
import ConfirmDisableModal from "../components/ConfirmDisableModal";
import ConfirmEnableModal from "../components/ConfirmEnableModal";
import { listTests, disableTest, enableTest } from "../services/adminContentService";

const STATUS_OPTIONS = [
  { value: "all", label: "Status: All" },
  { value: "active", label: "Status: Active" },
  { value: "inactive", label: "Status: Draft" },
];

export default function AdminTestsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], total: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [disableModal, setDisableModal] = useState({ show: false, test: null });
  const [enableModal, setEnableModal] = useState({ show: false, test: null });
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTests({
        search: search || undefined,
        status: statusFilter,
        limit: pageSize,
        offset,
      });
      setData(res);
    } catch (err) {
      setToast({ message: err.message || "Không tải được bài kiểm tra.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pageSize, offset]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleConfirmDisable() {
    if (!disableModal.test) return;
    setDisabling(true);
    try {
      await disableTest(disableModal.test.id);
      setToast({ message: "Đã vô hiệu hóa bài kiểm tra.", type: "success" });
      setDisableModal({ show: false, test: null });
      await load();
    } catch (err) {
      setToast({ message: err.message || "Vô hiệu hóa thất bại.", type: "error" });
    } finally {
      setDisabling(false);
    }
  }

  async function handleConfirmEnable() {
    if (!enableModal.test) return;
    setEnabling(true);
    try {
      await enableTest(enableModal.test.id);
      setToast({ message: "Đã kích hoạt lại bài kiểm tra.", type: "success" });
      setEnableModal({ show: false, test: null });
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
            Tests Repository
          </h1>
          <p style={{ color: COLORS.onSurfaceVariant, margin: "4px 0 0" }}>
            Quản lý bài kiểm tra từ vựng
          </p>
        </div>
        <button
          type="button"
          className="btn d-flex align-items-center gap-2"
          style={{ background: COLORS.primary, color: "#fff", minHeight: 44, fontWeight: 600 }}
          onClick={() => navigate("/admin/tests/new")}
        >
          <LuPlus size={18} /> Create New Test
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
            placeholder="Tìm bài kiểm tra…"
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
          style={{ maxWidth: 180, minHeight: 44 }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
          Không có bài kiểm tra phù hợp bộ lọc.
        </div>
      ) : (
        <div className="row g-3">
          {data.items.map((test) => (
            <div key={test.id} className="col-12 col-md-6 col-xl-4">
              <div
                className="card h-100"
                style={{ borderRadius: 16, border: `1px solid ${COLORS.outlineVariant}` }}
              >
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex gap-2 mb-2 flex-wrap">
                    <span
                      style={{
                        background: test.is_active ? COLORS.emeraldBg : "#f3f2f8",
                        color: test.is_active ? COLORS.emeraldDark : COLORS.outline,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        textTransform: "uppercase",
                      }}
                    >
                      {test.is_active ? "Active" : "Draft"}
                    </span>
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
                      {test.level_code || "Quiz"}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    {test.title}
                  </h3>
                  {test.topic_name && (
                    <p style={{ fontSize: 13, color: COLORS.onSurfaceVariant, marginBottom: 16 }}>
                      {test.topic_name}
                    </p>
                  )}
                  <div className="mt-auto">
                    <div style={{ fontSize: 13, color: COLORS.onSurfaceVariant, marginBottom: 12 }}>
                      <div><strong>{test.question_count ?? 0}</strong> Questions</div>
                      <div><strong>{test.attempt_count ?? 0}</strong> Total Attempts</div>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        style={{ minHeight: 44, borderColor: COLORS.primary, color: COLORS.primary }}
                        onClick={() => navigate(`/admin/tests/${test.id}/edit`)}
                      >
                        Edit Questions
                      </button>
                      {test.is_active ? (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                          style={{ minHeight: 44 }}
                          onClick={() => setDisableModal({ show: true, test })}
                        >
                          <LuBan size={14} /> Vô hiệu hóa
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                          style={{ minHeight: 44 }}
                          onClick={() => setEnableModal({ show: true, test })}
                        >
                          <LuRotateCcw size={14} /> Kích hoạt lại
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
        itemLabel="bài kiểm tra"
        className="mt-4"
      />

      <ConfirmDisableModal
        show={disableModal.show}
        title="Vô hiệu hóa bài kiểm tra"
        entityName={disableModal.test?.title}
        loading={disabling}
        onConfirm={handleConfirmDisable}
        onCancel={() => setDisableModal({ show: false, test: null })}
      />

      <ConfirmEnableModal
        show={enableModal.show}
        title="Kích hoạt lại bài kiểm tra"
        entityName={enableModal.test?.title}
        loading={enabling}
        onConfirm={handleConfirmEnable}
        onCancel={() => setEnableModal({ show: false, test: null })}
      />
    </>
  );
}
