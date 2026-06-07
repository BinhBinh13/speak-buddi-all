import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { UI } from "../../shared/constants/designTokens";
import { getPlans, startCheckout } from "./services/paymentService";
import { PAYMENT_CHECKOUT_PATH, resolveProPlanId } from "./utils/resolveProPlanId";

/**
 * Khởi tạo checkout Pro và redirect sang payment provider (/payment/mock hoặc Sepay).
 * Thay thế bước trung gian /pricing — mọi CTA "Nâng cấp Pro" trỏ tới route này.
 */
export default function PaymentCheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isPaid } = useAuth();
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function runCheckout() {
      setError("");

      if (!isAuthenticated) {
        navigate("/login?next=" + encodeURIComponent(PAYMENT_CHECKOUT_PATH), { replace: true });
        return;
      }

      if (isPaid) {
        navigate("/roadmap", { replace: true });
        return;
      }

      try {
        const plans = await getPlans();
        const proPlanId = resolveProPlanId(plans || []);
        if (!proPlanId) {
          if (!cancelled) {
            setError("Không tải được thông tin gói. Vui lòng thử lại sau.");
          }
          return;
        }

        const { redirect_url } = await startCheckout(proPlanId);
        if (!cancelled) window.location.href = redirect_url;
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể khởi tạo thanh toán. Vui lòng thử lại.");
        }
      }
    }

    runCheckout();
    return () => { cancelled = true; };
  }, [isAuthenticated, isPaid, navigate, retryKey]);

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
          maxWidth: 420,
          textAlign: "center",
          background: UI.surfaceContainerLowest,
          border: `1px solid ${UI.outlineVariant}`,
          borderRadius: UI.radius.lg,
          padding: UI.spacing.lg,
          boxShadow: UI.shadow.card,
        }}
      >
        {!error ? (
          <>
            <div
              aria-hidden="true"
              style={{
                width: 40,
                height: 40,
                margin: "0 auto 1rem",
                border: `3px solid ${UI.primary}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "payment-checkout-spin 0.8s linear infinite",
              }}
            />
            <style>{`
              @keyframes payment-checkout-spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <h1
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.h3,
                fontWeight: UI.fontWeight.h3,
                margin: "0 0 0.5rem",
              }}
            >
              Đang chuyển sang thanh toán…
            </h1>
            <p style={{ margin: 0, color: UI.onSurfaceVariant, fontSize: UI.fontSize.bodyMd }}>
              Vui lòng đợi trong giây lát.
            </p>
          </>
        ) : (
          <>
            <h1
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.h3,
                fontWeight: UI.fontWeight.h3,
                margin: "0 0 0.5rem",
                color: UI.error,
              }}
            >
              Không thể bắt đầu thanh toán
            </h1>
            <p
              role="alert"
              style={{
                margin: "0 0 1rem",
                color: UI.onSurfaceVariant,
                fontSize: UI.fontSize.bodyMd,
              }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              style={{
                minHeight: 44,
                padding: "12px 24px",
                borderRadius: UI.radius.full,
                border: "none",
                background: UI.primary,
                color: UI.onPrimary,
                fontFamily: UI.font,
                fontSize: UI.fontSize.labelMd,
                fontWeight: UI.fontWeight.labelMd,
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </>
        )}
      </div>
    </div>
  );
}
