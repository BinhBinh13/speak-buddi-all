import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdCheckCircle } from "react-icons/md";
import { UI } from "../../../shared/constants/designTokens";
import { useAuth } from "../../../shared/auth/AuthContext";
import { getPlans, startCheckout } from "../../payment/services/paymentService";

const PLANS = [
  {
    name: "Cơ bản",
    price: "Miễn phí",
    features: [
      "Giới hạn thời gian luyện tập",
      "Chủ đề cơ bản",
    ],
    cta: "Bắt đầu ngay",
    ctaTo: "/login",
    highlight: false,
    isPaid: false,
  },
  {
    name: "Pro",
    price: "99k",
    priceUnit: "/tháng",
    features: [
      "Không giới hạn luyện nói AI",
      "Truy cập tất cả 500+ chủ đề",
      "Phân tích phát âm chuyên sâu",
    ],
    cta: "Nâng cấp Pro",
    highlight: true,
    badge: "Phổ biến nhất",
    isPaid: true,
  },
];

/**
 * Map gói "Pro" hiển thị → plan_id UUID thật (S8.1).
 * Bám cùng quy tắc với PricingPage: chọn gói trả phí có sort_order nhỏ nhất.
 */
function resolveProPlanId(plans) {
  const paid = plans.filter((p) => p.price_vnd > 0);
  if (paid.length === 0) return null;
  return paid.reduce((min, p) => (p.sort_order < min.sort_order ? p : min), paid[0]).id;
}

export default function PricingSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [proPlanId, setProPlanId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPlans()
      .then((plans) => { if (!cancelled) setProPlanId(resolveProPlanId(plans || [])); })
      .catch(() => { if (!cancelled) setProPlanId(null); });
    return () => { cancelled = true; };
  }, []);

  /**
   * CTA "Nâng cấp Pro" trên landing (S8.1, AC-10-01) — login-aware:
   *  - Chưa đăng nhập → /login?next=/  (giữ trải nghiệm landing).
   *  - Đã đăng nhập   → startCheckout(plan_id) → redirect sang redirect_url.
   */
  async function handleUpgradeClick() {
    setCheckoutError("");
    if (!isAuthenticated) {
      navigate("/login?next=" + encodeURIComponent("/"));
      return;
    }
    if (!proPlanId) {
      setCheckoutError("Không tải được thông tin gói. Vui lòng thử lại sau.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { redirect_url } = await startCheckout(proPlanId);
      window.location.href = redirect_url;
    } catch (err) {
      setCheckoutError(err.message || "Không thể khởi tạo thanh toán. Vui lòng thử lại.");
      setCheckoutLoading(false);
    }
  }

  return (
    <section style={{ background: UI.surfaceContainer, padding: "6rem 0" }}>
      <div
        style={{
          maxWidth: UI.spacing.maxWidth,
          margin: "0 auto",
          padding: `0 clamp(16px, 5vw, ${UI.spacing.marginDesktop})`,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.h1,
            fontWeight: UI.fontWeight.h1,
            color: UI.onSurface,
            margin: "0 0 1rem",
            lineHeight: UI.lineHeight.h1,
          }}
        >
          Mở khóa toàn bộ tiềm năng
        </h2>
        <p
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.bodyLg,
            color: UI.onSurfaceVariant,
            margin: "0 auto 3rem",
            maxWidth: 640,
            lineHeight: UI.lineHeight.bodyLg,
          }}
        >
          Bắt đầu học miễn phí hoặc nâng cấp lên Pro để có quyền truy cập không giới hạn vào các cuộc hội thoại AI nâng cao.
        </p>

        <style>{`
          .pricing-teaser-grid {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            max-width: 900px;
            margin: 0 auto;
          }
          @media (min-width: 768px) {
            .pricing-teaser-grid { flex-direction: row; justify-content: center; }
          }
          /* S8.1: spinner cho nút checkout khi đang gọi /api/payment/checkout */
          @keyframes pricing-section-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div className="pricing-teaser-grid">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.name}
              {...plan}
              onUpgradeClick={plan.isPaid ? handleUpgradeClick : undefined}
              loading={plan.isPaid ? checkoutLoading : false}
              error={plan.isPaid ? checkoutError : ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  name, price, priceUnit, features, cta, ctaTo, highlight, badge,
  onUpgradeClick, loading, error,
}) {
  return (
    <div
      style={{
        background: UI.surfaceContainerLowest,
        borderRadius: "1.5rem",
        padding: "2rem",
        border: highlight ? `2px solid ${UI.goldBorder}` : `1px solid ${UI.outlineVariant}`,
        boxShadow: highlight ? UI.shadow.proCard : "0 1px 4px rgba(0,0,0,0.06)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transform: highlight ? "translateY(-1rem)" : "none",
      }}
    >
      {badge && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: UI.goldBorder,
            color: "#fff",
            fontFamily: UI.font,
            fontSize: UI.fontSize.labelSm,
            fontWeight: UI.fontWeight.labelSm,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "4px 16px",
            borderRadius: UI.radius.full,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {badge}
        </div>
      )}

      <h3
        style={{
          fontFamily: UI.font,
          fontSize: UI.fontSize.h2,
          fontWeight: UI.fontWeight.h2,
          color: UI.onSurface,
          margin: "0 0 0.5rem",
        }}
      >
        {name}
      </h3>

      <div
        style={{
          fontFamily: UI.font,
          fontSize: UI.fontSize.display,
          fontWeight: UI.fontWeight.display,
          color: UI.primary,
          lineHeight: 1.2,
          marginBottom: "1.5rem",
        }}
      >
        {price}
        {priceUnit && (
          <span
            style={{
              fontSize: UI.fontSize.h3,
              fontWeight: UI.fontWeight.h3,
              color: UI.onSurfaceVariant,
            }}
          >
            {priceUnit}
          </span>
        )}
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 2rem",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          flex: 1,
        }}
      >
        {features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <MdCheckCircle
              size={20}
              style={{ color: UI.secondary, flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.bodyMd,
                color: highlight ? UI.onSurface : UI.onSurfaceVariant,
                fontWeight: highlight ? 500 : 400,
              }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* S8.1: gói trả phí (onUpgradeClick) → button checkout login-aware;
          gói miễn phí → giữ nguyên <Link> tĩnh (hành vi cũ). */}
      {onUpgradeClick ? (
        <button
          type="button"
          onClick={onUpgradeClick}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "12px 0",
            borderRadius: UI.radius.md,
            fontFamily: UI.font,
            fontSize: UI.fontSize.labelMd,
            fontWeight: UI.fontWeight.labelMd,
            background: highlight ? UI.primary : "transparent",
            color: highlight ? UI.onPrimary : UI.primary,
            border: highlight ? "none" : `2px solid ${UI.primary}`,
            minHeight: 44,
            transition: "opacity 0.2s, background 0.2s",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            if (highlight) e.currentTarget.style.opacity = "0.9";
            else e.currentTarget.style.background = UI.primaryFixed;
          }}
          onMouseLeave={(e) => {
            if (loading) return;
            if (highlight) e.currentTarget.style.opacity = "1";
            else e.currentTarget.style.background = "transparent";
          }}
        >
          {loading && (
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                border: `2px solid ${highlight ? UI.onPrimary : UI.primary}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "pricing-section-spin 0.8s linear infinite",
              }}
            />
          )}
          {loading ? "Đang khởi tạo thanh toán…" : cta}
        </button>
      ) : (
        <Link
          to={ctaTo}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "12px 0",
            borderRadius: UI.radius.md,
            fontFamily: UI.font,
            fontSize: UI.fontSize.labelMd,
            fontWeight: UI.fontWeight.labelMd,
            textDecoration: "none",
            background: highlight ? UI.primary : "transparent",
            color: highlight ? UI.onPrimary : UI.primary,
            border: highlight ? "none" : `2px solid ${UI.primary}`,
            minHeight: 44,
            transition: highlight ? "opacity 0.2s" : "background 0.2s",
          }}
          onMouseEnter={(e) => {
            if (highlight) e.currentTarget.style.opacity = "0.9";
            else e.currentTarget.style.background = UI.primaryFixed;
          }}
          onMouseLeave={(e) => {
            if (highlight) e.currentTarget.style.opacity = "1";
            else e.currentTarget.style.background = "transparent";
          }}
        >
          {cta}
        </Link>
      )}

      {error && (
        <p
          role="alert"
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.labelSm,
            color: UI.error,
            margin: "0.5rem 0 0",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
