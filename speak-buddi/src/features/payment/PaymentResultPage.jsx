import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { MdCreditCardOff, MdInfoOutline, MdClose, MdRefresh, MdSupportAgent } from "react-icons/md";
import { UI } from "../../shared/constants/designTokens";
import { getTransaction, startCheckout } from "./services/paymentService";

// ─── PaymentResultPage (S8.3 — UC10, AC-10-03) ────────────────────────────────
// Màn kết quả thanh toán khi THẤT BẠI/HỦY: hiển thị thông điệp §5.2
// (`❌ Thanh toán không thành công. Lý do: [reason]`), giữ nguyên gói hiện tại
// (BE không đụng user_subscription ở nhánh fail/cancel — xem payment_service.py),
// và cho phép "Thử lại" (tạo giao dịch mới qua startCheckout) hoặc "Về Dashboard" (/roadmap).
//
// Port từ mockup `speak-buddi-docs/ui/thanh_toan_that_bai_desktop` (Việt hóa
// toàn bộ — bản gốc tiếng Anh + nhắc "card/CVV" không phù hợp Sepay/chuyển
// khoản, đã thay "lý do thường gặp" theo ngân hàng/VietQR — mục 6.3 plan).
// Theo DESIGN.md: card max-width 480, accent đỏ trên cùng, icon credit_card_off,
// màu primary #3525cd / error #ba1a1a, font Be Vietnam Pro, nút ≥44px.
//
// Route: /payment/result?status=failed|cancelled&tx=<id>&plan=<planId>
// ──────────────────────────────────────────────────────────────────────────────

// Map mã lý do (failure_reason) → câu tiếng Việt hiển thị (đồng bộ payment_service.reason_to_message)
const REASON_MESSAGES = {
  failed: "Giao dịch bị từ chối hoặc không hoàn tất.",
  cancelled: "Bạn đã hủy giao dịch.",
  amount_mismatch: "Số tiền chuyển khoản không khớp.",
  timeout: "Giao dịch đã hết thời gian xác nhận.",
};

function reasonToMessage(reason) {
  if (!reason) return "Giao dịch không thành công.";
  return REASON_MESSAGES[reason] || "Giao dịch bị từ chối hoặc không hoàn tất.";
}

const COMMON_REASONS = [
  "Chưa hoàn tất chuyển khoản hoặc sai nội dung chuyển khoản",
  "Số tiền chuyển khoản không khớp với giá trị đơn hàng",
  "Giao dịch đã hết thời gian xác nhận hoặc bị hủy giữa chừng",
];

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const transactionId = searchParams.get("tx") || "";
  const planIdFromQuery = searchParams.get("plan") || "";
  const statusFromQuery = searchParams.get("status") || "failed";

  const [transaction, setTransaction] = useState(null);
  const [loadingTx, setLoadingTx] = useState(Boolean(transactionId));
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  // Lấy trạng thái THẬT từ BE (status + failure_reason) — không chỉ tin query
  // param trên URL (mục 3.a plan, chống hiển thị sai khi user tự sửa URL).
  useEffect(() => {
    if (!transactionId) return;
    let cancelled = false;
    getTransaction(transactionId)
      .then((data) => { if (!cancelled) setTransaction(data); })
      .catch(() => { /* fallback dùng query param nếu BE lỗi/không tải được */ })
      .finally(() => { if (!cancelled) setLoadingTx(false); });
    return () => { cancelled = true; };
  }, [transactionId]);

  const reason = transaction?.failure_reason || statusFromQuery;
  const planId = transaction?.plan_id || planIdFromQuery;
  const message = reasonToMessage(reason);

  // Nút "Thử lại" — tạo giao dịch mới (S8.1 startCheckout) → điều hướng sang
  // màn thanh toán provider (mục 3.b plan).
  async function handleRetry() {
    setRetryError("");
    if (!planId) {
      setRetryError("Không xác định được gói cần mua lại. Vui lòng quay lại trang Bảng giá.");
      return;
    }
    setRetrying(true);
    try {
      const { redirect_url } = await startCheckout(planId);
      window.location.href = redirect_url;
    } catch (err) {
      setRetryError(err.message || "Không thể khởi tạo lại thanh toán. Vui lòng thử lại.");
      setRetrying(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: UI.font,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: UI.spacing.gutter,
        boxSizing: "border-box",
        background: UI.background,
        backgroundImage:
          "radial-gradient(at 0% 0%, hsla(349,100%,88%,0.3) 0px, transparent 50%)," +
          "radial-gradient(at 100% 0%, hsla(245,80%,89%,0.3) 0px, transparent 50%)," +
          "radial-gradient(at 100% 100%, hsla(349,100%,88%,0.2) 0px, transparent 50%)," +
          "radial-gradient(at 0% 100%, hsla(245,80%,89%,0.2) 0px, transparent 50%)",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: 480,
          background: UI.surfaceContainerLowest,
          borderRadius: 24,
          boxShadow: "0 8px 32px -8px rgba(53,37,205,0.08)",
          border: `1px solid ${UI.outlineVariant}55`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative top accent — đỏ nhạt theo mockup */}
        <div style={{ height: 8, width: "100%", background: "#ffdad6", position: "absolute", top: 0, left: 0 }} />

        <div
          style={{
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          {/* Icon cảnh báo */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#ffdad6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: UI.spacing.md,
            }}
          >
            <MdCreditCardOff size={40} color="#93000a" />
          </div>

          <h1
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.h1,
              fontWeight: UI.fontWeight.h1,
              color: UI.onSurface,
              margin: `0 0 ${UI.spacing.xs}`,
            }}
          >
            Thanh toán thất bại
          </h1>

          <p
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.bodyMd,
              color: UI.error,
              fontWeight: 600,
              margin: `0 0 ${UI.spacing.sm}`,
              maxWidth: 360,
            }}
          >
            ❌ Thanh toán không thành công. Lý do: {loadingTx ? "đang tải…" : message}
          </p>

          <p
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.bodyMd,
              color: UI.onSurfaceVariant,
              lineHeight: UI.lineHeight.bodyMd,
              margin: `0 0 ${UI.spacing.lg}`,
              maxWidth: 360,
            }}
          >
            Đừng lo — gói hiện tại của bạn được giữ nguyên và chưa có khoản phí nào bị trừ.
          </p>

          {/* Box "Lý do thường gặp" */}
          <div
            style={{
              width: "100%",
              background: UI.surfaceContainerLow,
              borderRadius: UI.radius.md,
              padding: UI.spacing.md,
              marginBottom: UI.spacing.lg,
              textAlign: "left",
              border: `1px solid ${UI.outlineVariant}66`,
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.labelMd,
                fontWeight: UI.fontWeight.labelMd,
                color: UI.onSurface,
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: `0 0 ${UI.spacing.xs}`,
              }}
            >
              <MdInfoOutline size={18} color={UI.outline} />
              Lý do thường gặp
            </h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {COMMON_REASONS.map((text) => (
                <li
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    fontFamily: UI.font,
                    fontSize: 14,
                    color: UI.onSurfaceVariant,
                    lineHeight: UI.lineHeight.bodyMd,
                  }}
                >
                  <MdClose size={18} color={UI.error} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {retryError && (
            <div
              style={{
                width: "100%",
                fontFamily: UI.font,
                fontSize: UI.fontSize.labelMd,
                color: UI.error,
                background: "#ffdad6",
                borderRadius: UI.radius.base,
                padding: "8px 12px",
                marginBottom: UI.spacing.sm,
                boxSizing: "border-box",
              }}
            >
              {retryError}
            </div>
          )}

          {/* Hành động */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              style={{
                width: "100%",
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 16px",
                borderRadius: UI.radius.md,
                border: "none",
                background: UI.primary,
                color: UI.onPrimary,
                fontFamily: UI.font,
                fontSize: UI.fontSize.labelMd,
                fontWeight: UI.fontWeight.labelMd,
                cursor: retrying ? "not-allowed" : "pointer",
                opacity: retrying ? 0.7 : 1,
                boxSizing: "border-box",
              }}
            >
              <MdRefresh size={18} />
              {retrying ? "Đang khởi tạo lại…" : "Thử lại"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/roadmap")}
              style={{
                width: "100%",
                minHeight: 44,
                padding: "14px 16px",
                borderRadius: UI.radius.md,
                border: `2px solid ${UI.outlineVariant}`,
                background: "transparent",
                color: UI.onSurface,
                fontFamily: UI.font,
                fontSize: UI.fontSize.labelMd,
                fontWeight: UI.fontWeight.labelMd,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              Về trang chủ
            </button>
          </div>

          {/* Liên hệ hỗ trợ — S12.3 */}
          <div style={{ marginTop: UI.spacing.lg }}>
            <Link
              to="/contact"
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.labelSm,
                color: UI.outline,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MdSupportAgent size={16} />
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
