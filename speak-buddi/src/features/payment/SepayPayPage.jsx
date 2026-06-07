import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MdContentCopy,
  MdQrCode2,
  MdRefresh,
  MdCheckCircle,
  MdTimer,
} from "react-icons/md";
import { UI } from "../../shared/constants/designTokens";
import { useAuth } from "../../shared/auth/AuthContext";
import {
  cancelCheckout,
  getTransaction,
} from "./services/paymentService";
import {
  buildVietQrUrl,
  formatVnd,
  getBankLabel,
} from "./utils/buildVietQrUrl";

const POLL_MS = 4000;
const DEFAULT_TIMEOUT_SECONDS = 5 * 60;

function getRemainingMs(createdAt, timeoutSeconds) {
  if (!createdAt) return timeoutSeconds * 1000;
  const expiresAt = new Date(createdAt).getTime() + timeoutSeconds * 1000;
  return Math.max(0, expiresAt - Date.now());
}

function formatCountdown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function SepayPayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();

  const transactionId = searchParams.get("tx") || "";
  const codeFromUrl = searchParams.get("code") || "";

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [polling, setPolling] = useState(false);
  const [remainingMs, setRemainingMs] = useState(null);
  const timeoutHandledRef = useRef(false);

  const pendingTimeoutSeconds =
    transaction?.pending_timeout_seconds ?? DEFAULT_TIMEOUT_SECONDS;

  const paymentCode = transaction?.payment_code || codeFromUrl;
  const qrUrl = useMemo(
    () =>
      buildVietQrUrl({
        bankCode: transaction?.bank_code,
        accountNumber: transaction?.bank_account_number,
        amount: transaction?.amount_vnd,
        paymentCode,
      }),
    [transaction, paymentCode],
  );

  const handleTerminalStatus = useCallback(
    async (data) => {
      if (data.status === "success") {
        await refreshUser();
        navigate(`/payment/success?tx=${encodeURIComponent(data.id)}`, { replace: true });
        return true;
      }
      if (data.status === "failed" || data.status === "cancelled") {
        navigate(
          `/payment/result?status=${encodeURIComponent(data.status)}&tx=${encodeURIComponent(data.id)}&plan=${encodeURIComponent(data.plan_id)}`,
          { replace: true },
        );
        return true;
      }
      return false;
    },
    [navigate, refreshUser],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      const next = `/payment/sepay?${searchParams.toString()}`;
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }
    if (!transactionId) {
      setError("Thiếu mã giao dịch. Vui lòng bắt đầu lại từ trang thanh toán.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getTransaction(transactionId);
        if (cancelled) return;
        setTransaction(data);
        if (await handleTerminalStatus(data)) return;
        if (data.provider && data.provider !== "sepay") {
          setError("Giao dịch này không dùng Sepay.");
        } else if (!data.bank_account_number || !data.bank_code) {
          setError(
            "Chưa cấu hình tài khoản nhận tiền Sepay trên server (SEPAY_ACCOUNT_NUMBER / SEPAY_BANK_CODE).",
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không tải được thông tin thanh toán.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [handleTerminalStatus, isAuthenticated, navigate, searchParams, transactionId]);

  useEffect(() => {
    if (!transactionId || !isAuthenticated || loading) return undefined;
    if (transaction?.status && transaction.status !== "pending") return undefined;

    setPolling(true);
    const timer = setInterval(async () => {
      try {
        const data = await getTransaction(transactionId);
        setTransaction(data);
        if (await handleTerminalStatus(data)) {
          clearInterval(timer);
        }
      } catch {
        /* giữ polling — mạng có thể tạm lỗi */
      }
    }, POLL_MS);

    return () => {
      clearInterval(timer);
      setPolling(false);
    };
  }, [
    handleTerminalStatus,
    isAuthenticated,
    loading,
    transaction?.status,
    transactionId,
  ]);

  const handleTimeout = useCallback(async () => {
    if (!transactionId || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    setCancelling(true);
    setError("");
    try {
      const data = await getTransaction(transactionId);
      setTransaction(data);
      if (!(await handleTerminalStatus(data))) {
        navigate(
          `/payment/result?status=failed&tx=${encodeURIComponent(transactionId)}&plan=${encodeURIComponent(transaction?.plan_id || "")}`,
          { replace: true },
        );
      }
    } catch (err) {
      setError(err.message || "Giao dịch đã hết thời gian. Vui lòng thử lại.");
      setCancelling(false);
      timeoutHandledRef.current = false;
    }
  }, [handleTerminalStatus, navigate, transaction?.plan_id, transactionId]);

  useEffect(() => {
    if (!transaction?.created_at || transaction.status !== "pending") {
      setRemainingMs(null);
      return undefined;
    }

    const tick = () => {
      const next = getRemainingMs(transaction.created_at, pendingTimeoutSeconds);
      setRemainingMs(next);
      if (next <= 0) {
        handleTimeout();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [
    handleTimeout,
    pendingTimeoutSeconds,
    transaction?.created_at,
    transaction?.status,
  ]);

  async function handleCopy(label, value) {
    const ok = await copyText(value);
    if (ok) {
      setCopiedField(label);
      setTimeout(() => setCopiedField(""), 2000);
    }
  }

  async function handleCancel() {
    if (!transactionId) return;
    setCancelling(true);
    setError("");
    try {
      await cancelCheckout(transactionId);
      navigate(
        `/payment/result?status=cancelled&tx=${encodeURIComponent(transactionId)}&plan=${encodeURIComponent(transaction?.plan_id || "")}`,
        { replace: true },
      );
    } catch (err) {
      setError(err.message || "Không thể hủy giao dịch. Vui lòng thử lại.");
      setCancelling(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: UI.font,
        minHeight: "100vh",
        background: UI.background,
        color: UI.onSurface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: UI.spacing.gutter,
        boxSizing: "border-box",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: 520,
          background: UI.surfaceContainerLowest,
          border: `1px solid ${UI.outlineVariant}`,
          borderRadius: UI.radius.lg,
          boxShadow: UI.shadow?.card || "0 8px 32px -8px rgba(53,37,205,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${UI.primary} 0%, ${UI.primaryContainer} 100%)`,
            color: UI.onPrimary,
            padding: `${UI.spacing.md} ${UI.spacing.lg}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MdQrCode2 size={28} />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: UI.fontSize.h2,
                  fontWeight: UI.fontWeight.h2,
                }}
              >
                Thanh toán chuyển khoản
              </h1>
              <p style={{ margin: "4px 0 0", opacity: 0.9, fontSize: UI.fontSize.bodyMd }}>
                Quét mã VietQR hoặc chuyển khoản thủ công
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: UI.spacing.lg }}>
          {loading && (
            <p style={{ color: UI.onSurfaceVariant, textAlign: "center" }}>
              Đang tải thông tin thanh toán…
            </p>
          )}

          {error && (
            <div
              role="alert"
              style={{
                background: UI.error + "14",
                border: `1px solid ${UI.error}`,
                borderRadius: UI.radius.base,
                padding: "12px 14px",
                color: UI.error,
                marginBottom: UI.spacing.md,
                fontSize: UI.fontSize.bodyMd,
              }}
            >
              {error}
            </div>
          )}

          {!loading && transaction && (
            <>
              <InfoRow label="Gói" value={transaction.plan_name} />
              <InfoRow label="Số tiền" value={formatVnd(transaction.amount_vnd)} highlight />

              {transaction.status === "pending" && remainingMs != null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: UI.spacing.sm,
                    padding: "10px 14px",
                    borderRadius: UI.radius.base,
                    background: remainingMs <= 60_000 ? UI.error + "14" : UI.surfaceContainer,
                    border: `1px solid ${remainingMs <= 60_000 ? UI.error : UI.outlineVariant}`,
                    color: remainingMs <= 60_000 ? UI.error : UI.onSurface,
                    fontSize: UI.fontSize.labelMd,
                    fontWeight: 600,
                  }}
                >
                  <MdTimer size={20} />
                  <span>
                    Thời gian còn lại: {formatCountdown(remainingMs)}
                    {remainingMs <= 0 && " — đang hủy giao dịch…"}
                  </span>
                </div>
              )}

              {qrUrl ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    margin: `${UI.spacing.md} 0`,
                    padding: UI.spacing.md,
                    background: UI.surfaceContainer,
                    borderRadius: UI.radius.md,
                  }}
                >
                  <img
                    src={qrUrl}
                    alt="Mã QR VietQR thanh toán SpeakBuddi Pro"
                    width={240}
                    height={240}
                    style={{
                      display: "block",
                      borderRadius: UI.radius.base,
                      background: "#fff",
                    }}
                  />
                  <p
                    style={{
                      margin: `${UI.spacing.sm} 0 0`,
                      fontSize: UI.fontSize.labelSm,
                      color: UI.onSurfaceVariant,
                      textAlign: "center",
                    }}
                  >
                    Quét bằng app ngân hàng — hệ thống tự đối soát sau vài giây
                  </p>
                </div>
              ) : (
                !error && (
                  <p style={{ color: UI.onSurfaceVariant, fontSize: UI.fontSize.bodyMd }}>
                    Không tạo được mã QR. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.
                  </p>
                )
              )}

              {transaction.bank_account_number && (
                <CopyRow
                  label={getBankLabel(transaction.bank_code)}
                  subLabel={`STK · ${transaction.bank_code || ""}`}
                  value={transaction.bank_account_number}
                  copied={copiedField === "account"}
                  onCopy={() => handleCopy("account", transaction.bank_account_number)}
                />
              )}

              {paymentCode && (
                <CopyRow
                  label="Nội dung chuyển khoản"
                  subLabel="Bắt buộc — không đổi nội dung"
                  value={paymentCode}
                  copied={copiedField === "code"}
                  onCopy={() => handleCopy("code", paymentCode)}
                  highlight
                />
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginTop: UI.spacing.md,
                  padding: "12px 14px",
                  background: UI.primaryFixed + "66",
                  borderRadius: UI.radius.base,
                  fontSize: UI.fontSize.labelMd,
                  color: UI.onSurface,
                }}
              >
                <MdCheckCircle size={20} color={UI.secondary} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  Hoàn tất chuyển khoản trong {Math.round(pendingTimeoutSeconds / 60)} phút.
                  Sau đó trang sẽ tự hủy giao dịch nếu chưa nhận được thanh toán.
                  {polling && " Đang chờ Sepay đối soát…"}
                </span>
              </div>
            </>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: UI.spacing.xs,
              marginTop: UI.spacing.lg,
            }}
          >
            <button
              type="button"
              onClick={() => window.location.reload()}
              disabled={loading || cancelling}
              style={secondaryBtnStyle}
            >
              <MdRefresh size={18} />
              Làm mới trạng thái
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={loading || cancelling || !transactionId}
              style={{
                ...secondaryBtnStyle,
                borderColor: UI.error,
                color: UI.error,
              }}
            >
              {cancelling ? "Đang hủy…" : "Hủy thanh toán"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const secondaryBtnStyle = {
  width: "100%",
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: UI.radius.full,
  border: `2px solid ${UI.outlineVariant}`,
  background: "transparent",
  color: UI.onSurface,
  fontFamily: UI.font,
  fontSize: UI.fontSize.labelMd,
  fontWeight: UI.fontWeight.labelMd,
  cursor: "pointer",
};

function InfoRow({ label, value, highlight = false }) {
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
      <span style={{ color: UI.onSurfaceVariant, fontSize: UI.fontSize.labelMd }}>{label}</span>
      <span
        style={{
          fontWeight: 600,
          fontSize: highlight ? UI.fontSize.h3 : UI.fontSize.labelMd,
          color: highlight ? UI.primary : UI.onSurface,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function CopyRow({ label, subLabel, value, onCopy, copied, highlight = false }) {
  return (
    <div
      style={{
        marginTop: UI.spacing.sm,
        padding: "12px 14px",
        borderRadius: UI.radius.base,
        background: highlight ? UI.surfaceContainerHigh : UI.surfaceContainer,
        border: `1px solid ${UI.outlineVariant}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: UI.fontSize.labelSm, color: UI.onSurfaceVariant }}>{label}</div>
          {subLabel && (
            <div style={{ fontSize: UI.fontSize.labelSm, color: UI.onSurfaceVariant, marginTop: 2 }}>
              {subLabel}
            </div>
          )}
          <div
            style={{
              marginTop: 6,
              fontFamily: "monospace",
              fontSize: 15,
              fontWeight: 600,
              color: highlight ? UI.primary : UI.onSurface,
              wordBreak: "break-all",
            }}
          >
            {value}
          </div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Sao chép ${label}`}
          style={{
            flexShrink: 0,
            minWidth: 44,
            minHeight: 44,
            border: "none",
            borderRadius: UI.radius.base,
            background: copied ? UI.secondaryContainer : UI.surfaceContainerLowest,
            color: copied ? UI.onSecondaryContainer : UI.primary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdContentCopy size={20} />
        </button>
      </div>
      {copied && (
        <div style={{ marginTop: 6, fontSize: UI.fontSize.labelSm, color: UI.secondary }}>
          Đã sao chép
        </div>
      )}
    </div>
  );
}
