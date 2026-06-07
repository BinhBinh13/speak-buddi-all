// src/features/support/ContactPage.jsx
// Trang form liên hệ / hỗ trợ công khai — S12.3 (extra-scope)
// Shell: PublicNavbar + card form + PublicFooter (PricingPage / ForgotPasswordPage)
// Mockup tham chiếu: landing_page_desktop, pricing_page_desktop (footer), thanh_toan_that_bai_desktop (support CTA)
import { useState } from "react";
import { Link } from "react-router-dom";
import { MdSupportAgent, MdCheckCircle } from "react-icons/md";
import PublicNavbar from "../../shared/components/PublicNavbar";
import PublicFooter from "../../shared/components/PublicFooter";
import { UI } from "../../shared/constants/designTokens";
import { useAuth } from "../../shared/auth/AuthContext";
import { submitContact } from "./services/supportService";

const SUBJECT_OPTIONS = [
  { value: "account",   label: "Tài khoản" },
  { value: "payment",   label: "Thanh toán & gói Pro" },
  { value: "ai",        label: "Hội thoại AI" },
  { value: "technical", label: "Lỗi kỹ thuật" },
  { value: "other",     label: "Khác" },
];

const labelStyle = {
  display: "block",
  fontFamily: UI.font,
  fontSize: UI.fontSize.labelMd,
  fontWeight: UI.fontWeight.labelMd,
  color: UI.onSurfaceVariant,
  marginBottom: 6,
};

function fieldStyle(hasError) {
  return {
    width: "100%",
    padding: "0.75rem 1rem",
    border: `1px solid ${hasError ? UI.error : UI.outlineVariant}`,
    borderRadius: 8,
    background: UI.surface,
    fontFamily: UI.font,
    fontSize: UI.fontSize.bodyMd,
    color: UI.onSurface,
    outline: "none",
    boxSizing: "border-box",
  };
}

export default function ContactPage() {
  const { user } = useAuth();

  const [name, setName]       = useState(() => user?.name || "");
  const [email, setEmail]     = useState(() => user?.email || "");
  const [subject, setSubject] = useState("account");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError("Vui lòng nhập họ tên.");
      return;
    }
    if (!trimmedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!trimmedMessage) {
      setError("Vui lòng nhập nội dung tin nhắn.");
      return;
    }

    setLoading(true);
    try {
      await submitContact({
        name: trimmedName,
        email: trimmedEmail,
        subject,
        message: trimmedMessage,
        website: website || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Không gửi được yêu cầu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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
        flexDirection: "column",
      }}
    >
      <PublicNavbar />

      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: `${UI.spacing.xl} clamp(16px, 5vw, ${UI.spacing.marginDesktop})`,
        }}
      >
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: UI.spacing.lg }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: UI.primaryFixed,
                color: UI.primary,
                marginBottom: UI.spacing.sm,
              }}
            >
              <MdSupportAgent size={28} />
            </div>
            <h1
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.h1,
                fontWeight: UI.fontWeight.h1,
                color: UI.onSurface,
                margin: `0 0 ${UI.spacing.xs}`,
                lineHeight: UI.lineHeight.h1,
              }}
            >
              Liên hệ &amp; hỗ trợ
            </h1>
            <p
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.bodyMd,
                color: UI.onSurfaceVariant,
                margin: 0,
                lineHeight: UI.lineHeight.bodyMd,
              }}
            >
              Gửi yêu cầu về tài khoản, thanh toán, AI hoặc lỗi kỹ thuật. Chúng tôi phản hồi qua email trong 24–48 giờ.
            </p>
          </div>

          {/* Card */}
          <div
            style={{
              background: UI.surfaceContainerLowest,
              border: `1px solid ${UI.outlineVariant}`,
              borderRadius: 16,
              padding: UI.spacing.lg,
              boxShadow: "0 4px 24px rgba(27,27,36,0.06)",
            }}
          >
            {success ? (
              <div
                role="status"
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: UI.spacing.md,
                  background: "#dcfce7",
                  borderRadius: 12,
                  border: "1px solid #86efac",
                }}
              >
                <MdCheckCircle size={24} color="#166534" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p
                    style={{
                      fontFamily: UI.font,
                      fontSize: UI.fontSize.bodyMd,
                      fontWeight: UI.fontWeight.labelMd,
                      color: "#166534",
                      margin: `0 0 ${UI.spacing.xs}`,
                    }}
                  >
                    Đã gửi yêu cầu thành công
                  </p>
                  <p
                    style={{
                      fontFamily: UI.font,
                      fontSize: UI.fontSize.bodyMd,
                      color: "#166534",
                      margin: 0,
                      lineHeight: UI.lineHeight.bodyMd,
                    }}
                  >
                    Chúng tôi đã nhận yêu cầu của bạn và sẽ phản hồi qua email trong vòng 24–48 giờ làm việc.
                  </p>
                  <Link
                    to="/"
                    style={{
                      display: "inline-block",
                      marginTop: UI.spacing.md,
                      fontFamily: UI.font,
                      fontSize: UI.fontSize.labelMd,
                      color: UI.primary,
                      fontWeight: UI.fontWeight.labelMd,
                    }}
                  >
                    ← Về trang chủ
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {error && (
                  <div
                    role="alert"
                    style={{
                      marginBottom: UI.spacing.md,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#ffdad6",
                      color: UI.error,
                      fontFamily: UI.font,
                      fontSize: UI.fontSize.labelMd,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Honeypot — ẩn khỏi người dùng */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                />

                <div style={{ marginBottom: UI.spacing.md }}>
                  <label htmlFor="contact-name" style={labelStyle}>Họ tên</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    maxLength={100}
                    required
                    style={fieldStyle(false)}
                  />
                </div>

                <div style={{ marginBottom: UI.spacing.md }}>
                  <label htmlFor="contact-email" style={labelStyle}>Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    maxLength={255}
                    required
                    style={fieldStyle(false)}
                  />
                </div>

                <div style={{ marginBottom: UI.spacing.md }}>
                  <label htmlFor="contact-subject" style={labelStyle}>Chủ đề</label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={loading}
                    style={{ ...fieldStyle(false), cursor: "pointer" }}
                  >
                    {SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: UI.spacing.lg }}>
                  <label htmlFor="contact-message" style={labelStyle}>Nội dung</label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    maxLength={2000}
                    rows={5}
                    required
                    style={{ ...fieldStyle(false), resize: "vertical", minHeight: 120 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: 12,
                    background: loading ? UI.outlineVariant : UI.primary,
                    color: UI.onPrimary,
                    fontFamily: UI.font,
                    fontSize: UI.fontSize.labelMd,
                    fontWeight: UI.fontWeight.labelMd,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.8 : 1,
                  }}
                >
                  {loading ? "Đang gửi…" : "Gửi yêu cầu"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
