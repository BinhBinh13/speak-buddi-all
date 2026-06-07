import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MdOutlineScience } from "react-icons/md";
import { UI } from "../../shared/constants/designTokens";
import { useAuth } from "../../shared/auth/AuthContext";
import { simulateMockCallback } from "./services/paymentService";

// ─── MockPayPage (S8.1 dev-only UI → S8.2 gọi webhook thật) ───────────────────
// Màn mock thay thế trang payment provider thật (Provider chính thức = Sepay,
// PO chốt 2026-06-07; mock dùng để dev/QA chạy hết luồng UC10 không cần Sepay).
// Khi MockPaymentProvider.create_checkout() trả redirect_url, FE điều hướng
// người dùng tới đây (`/payment/mock?tx=<id>&ref=<provider_ref>`) để dev/QA bấm
// "Giả lập thành công/thất bại" → S8.2: gọi THẬT POST /api/payment/webhook/mock
// { provider_ref, result } → BE kích hoạt user_subscription / set Paid User
// (AC-10-02) hoặc đánh dấu giao dịch fail (tối thiểu — UX đầy đủ ở S8.3).
//
// CHỈ phục vụ dev/QA — không phải UI production. Không có mockup riêng cho
// S8.1/S8.2 (xem CLAUDE.md §6.2); UI tối giản, theo design tokens chung.
//
// S8.3: sau khi BE xác nhận webhook, điều hướng sang màn kết quả thật
// `/payment/result?status=&tx=&plan=` (port mockup `thanh_toan_that_bai_desktop`)
// thay vì `/pricing?mock_result=...` — PricingPage không còn cần xử lý query đó.
// ──────────────────────────────────────────────────────────────────────────────

export default function MockPayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const transactionId = searchParams.get("tx") || "";
  const providerRef = searchParams.get("ref") || "";

  const [loading, setLoading] = useState(null); // "success" | "failed" | null
  const [error, setError] = useState("");

  // S8.2/S8.3: gọi THẬT webhook mock — BE xác thực + map về transaction qua
  // provider_ref, kích hoạt subscription (success) hoặc đánh dấu fail (giữ
  // nguyên gói cũ — AC-10-03). Sau khi BE xác nhận, điều hướng sang màn kết
  // quả thật: `/pricing` cho thành công (chưa có màn riêng — ngoài phạm vi
  // S8.3), `/payment/result` cho thất bại/hủy (PaymentResultPage — AC-10-03).
  async function handleResult(result) {
    if (!providerRef) {
      setError("Thiếu mã giao dịch provider_ref — không thể gọi webhook giả lập.");
      return;
    }
    setError("");
    setLoading(result);
    try {
      await simulateMockCallback({ provider_ref: providerRef, result });
      if (result === "success") {
        await refreshUser();
        navigate(`/payment/success?tx=${encodeURIComponent(transactionId)}`);
      } else {
        navigate(`/payment/result?status=${result}&tx=${encodeURIComponent(transactionId)}`);
      }
    } catch (err) {
      setError(err.message || "Không thể gọi webhook giả lập. Vui lòng thử lại.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        fontFamily: UI.font,
        background: UI.background,
        color: UI.onSurface,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: UI.spacing.gutter,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: UI.surfaceContainerLowest,
          border: `1px solid ${UI.outlineVariant}`,
          borderRadius: UI.radius.lg,
          boxShadow: UI.shadow.card,
          padding: UI.spacing.lg,
          boxSizing: "border-box",
        }}
      >
        {/* Dev-only badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            background: UI.surfaceContainer,
            color: UI.onSurfaceVariant,
            borderRadius: UI.radius.full,
            padding: "4px 12px",
            fontSize: UI.fontSize.labelSm,
            fontWeight: UI.fontWeight.labelSm,
            marginBottom: UI.spacing.md,
          }}
        >
          <MdOutlineScience size={16} />
          DEV ONLY — Mock Payment Provider
        </div>

        <h1
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.h2,
            fontWeight: UI.fontWeight.h2,
            color: UI.onSurface,
            margin: `0 0 ${UI.spacing.xs}`,
          }}
        >
          Trang giả lập thanh toán
        </h1>
        <p
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.bodyMd,
            color: UI.onSurfaceVariant,
            lineHeight: UI.lineHeight.bodyMd,
            margin: `0 0 ${UI.spacing.sm}`,
          }}
        >
          Vì SpeakBuddi chưa tích hợp cổng thanh toán thật (provider TBD), đây là
          màn giả lập nội bộ để kiểm thử luồng UC10. Hãy chọn kết quả bên dưới
          để tiếp tục.
        </p>

        {(transactionId || providerRef) && (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: UI.fontSize.labelMd,
              color: UI.onSurfaceVariant,
              background: UI.surfaceContainer,
              borderRadius: UI.radius.base,
              padding: "8px 12px",
              marginBottom: UI.spacing.md,
              wordBreak: "break-all",
            }}
          >
            {transactionId && <div>Mã giao dịch: {transactionId}</div>}
            {providerRef && <div>Mã provider_ref: {providerRef}</div>}
          </div>
        )}

        {error && (
          <div
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.labelMd,
              color: UI.error,
              background: UI.surfaceContainer,
              border: `1px solid ${UI.error}`,
              borderRadius: UI.radius.base,
              padding: "8px 12px",
              marginBottom: UI.spacing.md,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: UI.spacing.xs }}>
          <button
            type="button"
            onClick={() => handleResult("success")}
            disabled={loading !== null}
            style={{
              width: "100%",
              minHeight: 44,
              padding: "12px 16px",
              borderRadius: UI.radius.full,
              border: "none",
              background: UI.secondary,
              color: UI.onSecondary,
              fontFamily: UI.font,
              fontSize: UI.fontSize.labelMd,
              fontWeight: UI.fontWeight.labelMd,
              cursor: loading !== null ? "not-allowed" : "pointer",
              opacity: loading !== null ? 0.7 : 1,
            }}
          >
            {loading === "success" ? "Đang xử lý…" : "Giả lập thanh toán thành công"}
          </button>

          <button
            type="button"
            onClick={() => handleResult("failed")}
            disabled={loading !== null}
            style={{
              width: "100%",
              minHeight: 44,
              padding: "12px 16px",
              borderRadius: UI.radius.full,
              border: `2px solid ${UI.error}`,
              background: "transparent",
              color: UI.error,
              fontFamily: UI.font,
              fontSize: UI.fontSize.labelMd,
              fontWeight: UI.fontWeight.labelMd,
              cursor: loading !== null ? "not-allowed" : "pointer",
              opacity: loading !== null ? 0.7 : 1,
            }}
          >
            {loading === "failed" ? "Đang xử lý…" : "Giả lập thanh toán thất bại"}
          </button>
        </div>

        <p
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.labelSm,
            color: UI.onSurfaceVariant,
            margin: `${UI.spacing.md} 0 0`,
          }}
        >
          Lưu ý: bấm nút sẽ gọi THẬT webhook <code>/api/payment/webhook/mock</code>{" "}
          — "thành công" kích hoạt gói Pro (Paid User, AC-10-02 — S8.2); "thất
          bại"/"hủy" giữ nguyên gói hiện tại và chuyển sang màn kết quả thất bại
          (AC-10-03 — S8.3) với tùy chọn thử lại.
        </p>
      </div>
    </div>
  );
}
