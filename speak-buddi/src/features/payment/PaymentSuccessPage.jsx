import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MdCheckCircle, MdArrowForward } from "react-icons/md";
import { UI } from "../../shared/constants/designTokens";
import { useAuth } from "../../shared/auth/AuthContext";
import { getTransaction } from "./services/paymentService";
import { formatPlanPrice } from "../admin/payment-plans/utils/formatPrice";

// Port mockup `speak-buddi-docs/ui/thanh_toan_thanh_cong_desktop` — Việt hóa,
// bỏ "Download Receipt" (chưa có API), format VND thay USD.
// Route: /payment/success?tx=<transaction_id>

function formatTxDisplay(id) {
  if (!id) return "—";
  const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SB-${short.slice(0, 4)}-${short.slice(4)}`;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser, isAuthenticated } = useAuth();

  const transactionId = searchParams.get("tx") || "";
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?next=" + encodeURIComponent(`/payment/success?tx=${transactionId}`), { replace: true });
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        await refreshUser();
        if (transactionId) {
          const data = await getTransaction(transactionId);
          if (!cancelled) {
            if (data.status !== "success") {
              setError("Giao dịch chưa được xác nhận thành công.");
            } else {
              setTransaction(data);
            }
          }
        }
      } catch {
        if (!cancelled) setError("Không tải được thông tin giao dịch.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, navigate, refreshUser, transactionId]);

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
        background: UI.surfaceContainerLow,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blobs — mockup */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: 384,
          height: 384,
          borderRadius: "50%",
          background: `${UI.secondaryContainer}33`,
          filter: "blur(64px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-5%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `${UI.primaryFixed}4d`,
          filter: "blur(64px)",
          pointerEvents: "none",
        }}
      />

      <main
        style={{
          width: "100%",
          maxWidth: 440,
          background: UI.surface,
          borderRadius: UI.radius.lg,
          boxShadow: "0 8px 32px -8px rgba(53,37,205,0.08)",
          border: `1px solid ${UI.outlineVariant}4d`,
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 128,
            background: `linear-gradient(to bottom, ${UI.secondaryContainer}4d, transparent)`,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: UI.secondaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: UI.spacing.md,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              animation: "payment-success-scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            <MdCheckCircle size={48} color={UI.onSecondaryContainer} />
          </div>

          <style>{`
            @keyframes payment-success-scale-in {
              0% { transform: scale(0.8); opacity: 0; }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>

          <h1
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.h1,
              fontWeight: UI.fontWeight.h1,
              color: UI.onSurface,
              margin: `0 0 ${UI.spacing.xs}`,
            }}
          >
            Thanh toán thành công!
          </h1>

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
            Cảm ơn bạn đã nâng cấp Pro. Hành trình học tiếng Anh của bạn sắp tăng tốc.
          </p>

          {!loading && !error && transaction && (
            <div
              style={{
                width: "100%",
                background: UI.surfaceContainer,
                borderRadius: UI.radius.md,
                padding: UI.spacing.md,
                marginBottom: UI.spacing.lg,
                textAlign: "left",
                boxSizing: "border-box",
              }}
            >
              <DetailRow label="Gói" value={transaction.plan_name} />
              <DetailRow label="Số tiền" value={formatPlanPrice(transaction.amount_vnd)} />
              <div style={{ height: 1, background: `${UI.outlineVariant}66`, margin: `${UI.spacing.sm} 0` }} />
              <DetailRow label="Mã giao dịch" value={formatTxDisplay(transaction.id)} mono />
            </div>
          )}

          {loading && (
            <p style={{ color: UI.onSurfaceVariant, marginBottom: UI.spacing.lg }}>
              Đang xác nhận giao dịch…
            </p>
          )}

          {error && (
            <p role="alert" style={{ color: UI.error, marginBottom: UI.spacing.lg, fontSize: UI.fontSize.bodyMd }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => navigate("/roadmap")}
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
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(53,37,205,0.15)",
            }}
          >
            Về Dashboard
            <MdArrowForward size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: UI.spacing.sm,
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: UI.font,
          fontSize: UI.fontSize.labelMd,
          color: UI.onSurfaceVariant,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "monospace" : UI.font,
          fontSize: mono ? 14 : UI.fontSize.labelMd,
          fontWeight: 600,
          color: UI.onSurface,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
