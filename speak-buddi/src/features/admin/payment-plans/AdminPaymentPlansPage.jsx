// speak-buddi/src/features/admin/payment-plans/AdminPaymentPlansPage.jsx
// ─── Admin Payment Plans (S10.1 + S10.2 soft delete) ────────────────────────
// UI: speak-buddi-docs/ui/quan_li_goi_thanh_toan_admin/

import { useCallback, useEffect, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import AdminPagination from "../components/AdminPagination";
import AdminToast from "../components/AdminToast";
import ConfirmDisableModal from "../components/ConfirmDisableModal";
import PaymentPlanCard from "./components/PaymentPlanCard";
import PaymentPlanFormModal from "./components/PaymentPlanFormModal";
import {
  listPlans,
  createPlan,
  updatePlan,
  disablePlan,
} from "./services/paymentPlanService";

const STATUS_OPTIONS = [
  { value: "all", label: "Trạng thái: Tất cả" },
  { value: "active", label: "Trạng thái: Đang bán" },
  { value: "inactive", label: "Trạng thái: Đã tắt" },
];

export default function AdminPaymentPlansPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [offset, setOffset] = useState(0);
  const [modal, setModal] = useState({ show: false, initial: null });
  const [disableModal, setDisableModal] = useState({ show: false, plan: null });
  const [disabling, setDisabling] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPlans({
        status: statusFilter,
        limit: pageSize,
        offset,
      });
      setData(res);
    } catch (err) {
      setToast({ message: err.message || "Không tải được danh sách gói.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pageSize, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const highlightId = data.items.find((p) => p.is_active && p.price_vnd > 0 && p.duration_days === 30)?.id
    ?? data.items.find((p) => p.is_active && p.price_vnd > 0)?.id;

  function openCreate() {
    setModal({ show: true, initial: null });
  }

  function openEdit(plan) {
    setModal({ show: true, initial: plan });
  }

  function openDisable(plan) {
    setDisableModal({ show: true, plan });
  }

  async function handleSave(payload) {
    if (modal.initial?.id) {
      await updatePlan(modal.initial.id, payload);
      setToast({ message: "Đã cập nhật gói thanh toán!", type: "success" });
    } else {
      await createPlan(payload);
      setToast({ message: "Đã tạo gói thanh toán mới!", type: "success" });
    }
    await load();
  }

  async function handleConfirmDisable() {
    if (!disableModal.plan) return;
    setDisabling(true);
    try {
      await disablePlan(disableModal.plan.id);
      setToast({ message: "Đã vô hiệu hóa gói thanh toán.", type: "success" });
      setDisableModal({ show: false, plan: null });
      await load();
    } catch (err) {
      setToast({ message: err.message || "Vô hiệu hóa thất bại.", type: "error" });
    } finally {
      setDisabling(false);
    }
  }

  return (
    <div className="admin-payment-plans" style={{ fontFamily: FONTS.body }}>
      <header className="appp-header">
        <div>
          <h1 className="appp-title">Payment Plans</h1>
          <p className="appp-subtitle">
            Cấu hình các gói đăng ký, quản lý giá và theo dõi phân bổ người dùng.
          </p>
        </div>
        <button type="button" className="appp-create-btn" onClick={openCreate}>
          <LuPlus size={18} />
          Tạo gói mới
        </button>
      </header>

      <div className="appp-filters">
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOffset(0);
          }}
          style={{ maxWidth: 220, minHeight: 44, fontFamily: FONTS.body }}
          aria-label="Lọc trạng thái gói"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#464555" }}>Đang tải…</p>
      ) : data.items.length === 0 ? (
        <div className="appp-empty">
          <p>
            {data.total === 0 && statusFilter === "all"
              ? "Chưa có gói thanh toán nào."
              : "Không có gói nào khớp bộ lọc."}
          </p>
          {data.total === 0 && statusFilter === "all" && (
            <button type="button" className="appp-create-btn" onClick={openCreate}>
              <LuPlus size={18} />
              Tạo gói đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="appp-grid">
          {data.items.map((plan) => (
            <PaymentPlanCard
              key={plan.id}
              plan={plan}
              highlighted={plan.is_active && plan.id === highlightId}
              onEdit={openEdit}
              onDisable={openDisable}
            />
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
        itemLabel="gói"
        className="mt-4"
      />

      <PaymentPlanFormModal
        show={modal.show}
        initial={modal.initial}
        onClose={() => setModal({ show: false, initial: null })}
        onSubmit={handleSave}
      />

      <ConfirmDisableModal
        show={disableModal.show}
        title="Vô hiệu hóa gói thanh toán"
        entityLabel={
          disableModal.plan
            ? `gói "${disableModal.plan.name}" — sẽ không còn hiển thị trên Pricing và không thể mua mới`
            : "gói này"
        }
        loading={disabling}
        onConfirm={handleConfirmDisable}
        onCancel={() => setDisableModal({ show: false, plan: null })}
      />

      <AdminToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      <style>{PAGE_CSS}</style>
    </div>
  );
}

const PAGE_CSS = `
  .admin-payment-plans {
    max-width: 1280px;
    margin: 0 auto;
  }
  .appp-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }
  .appp-filters {
    margin-bottom: 24px;
  }
  .appp-title {
    font-size: clamp(28px, 4vw, 48px);
    font-weight: 700;
    color: ${COLORS.onSurface};
    margin: 0 0 8px;
    line-height: 1.2;
  }
  .appp-subtitle {
    font-size: 18px;
    color: #464555;
    margin: 0;
    max-width: 560px;
    line-height: 1.5;
  }
  .appp-create-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    background: ${COLORS.emeraldDark};
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
  .appp-create-btn:hover {
    filter: brightness(0.95);
  }
  .appp-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    align-items: stretch;
  }
  @media (min-width: 768px) {
    .appp-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .appp-grid { grid-template-columns: repeat(3, 1fr); }
  }
  .appp-empty {
    text-align: center;
    padding: 48px 16px;
    color: #464555;
  }
  .appp-empty .appp-create-btn {
    margin-top: 16px;
  }
`;
