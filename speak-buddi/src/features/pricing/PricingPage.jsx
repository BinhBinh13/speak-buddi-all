import { Link } from "react-router-dom";
import { MdCheck, MdStar } from "react-icons/md";
import PublicNavbar from "../../shared/components/PublicNavbar";
import PublicFooter from "../../shared/components/PublicFooter";
import { UI } from "../../shared/constants/designTokens";

// ── Dữ liệu gói (static — Admin sẽ quản lý thật ở S10.1) ────────────
// TODO: Giá Pro thật sẽ được Admin cấu hình. Hiện dùng 149.000đ theo mockup pricing_page_desktop.
const PLANS = [
  {
    name: "Miễn phí",
    price: "0đ",
    priceUnit: null,
    features: [
      { label: "AI 15 phút / 5 giờ",   included: true },
      { label: "Học từ vựng",           included: true },
      { label: "Luyện phát âm",         included: true },
      { label: "Bản đồ học tập",        included: true },
    ],
    cta: "Bắt đầu ngay",
    // TODO: Đổi thành /register khi S1.4 hoàn thành
    ctaTo: "/login",
    highlight: false,
  },
  {
    name: "Pro",
    price: "149.000đ",
    priceUnit: "/ tháng",
    features: [
      { label: "AI không giới hạn",     included: true },
      { label: "Đổi giọng đọc AI",      included: true },
      { label: "Mô hình AI cao cấp",    included: true },
      { label: "Tải báo cáo chi tiết",  included: true },
    ],
    cta: "Nâng cấp Pro",
    // TODO: Đổi thành /register khi S1.4 hoàn thành
    ctaTo: "/login",
    highlight: true,
    badge: "Phổ biến",
  },
];

const FAQ_ITEMS = [
  {
    q: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
    a: "Có, bạn có thể quản lý và hủy gói đăng ký của mình bất cứ lúc nào trong phần Cài đặt tài khoản. Quá trình hủy sẽ có hiệu lực vào cuối chu kỳ thanh toán hiện tại.",
  },
  {
    q: "Mô hình AI cao cấp khác gì so với bản miễn phí?",
    a: "Mô hình AI cao cấp cung cấp phản hồi nhanh hơn, ngữ điệu tự nhiên hơn, hiểu ngữ cảnh phức tạp tốt hơn và khả năng nhận diện phát âm chính xác hơn đáng kể so với bản tiêu chuẩn.",
  },
  {
    q: "Phương thức thanh toán được chấp nhận?",
    a: "Chúng tôi chấp nhận chuyển khoản ngân hàng (VietQR), ví điện tử MoMo, ZaloPay và thẻ tín dụng/ghi nợ quốc tế (Visa, Mastercard).",
  },
];

// ── Page ─────────────────────────────────────────────────────────────
export default function PricingPage() {
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
          paddingTop: 68,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: `calc(68px + ${UI.spacing.xl}) clamp(16px, 5vw, ${UI.spacing.marginDesktop}) ${UI.spacing.xl}`,
          width: "100%",
          maxWidth: UI.spacing.maxWidth,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            width: "100%",
            maxWidth: "42rem",
            margin: "0 auto 3rem",
          }}
        >
          <h1
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.h1,
              fontWeight: UI.fontWeight.h1,
              color: UI.onSurface,
              margin: "0 0 1rem",
              lineHeight: UI.lineHeight.h1,
            }}
          >
            Bảng giá
          </h1>
          <p
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.bodyLg,
              color: UI.onSurfaceVariant,
              margin: 0,
              lineHeight: UI.lineHeight.bodyLg,
            }}
          >
            Chọn gói học phù hợp với mục tiêu của bạn. Nâng cấp bất cứ lúc nào để tận dụng tối đa sức mạnh AI.
          </p>
        </div>

        {/* Plan cards */}
        <style>{`
          .pricing-cards-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: ${UI.spacing.lg};
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
          }
          @media (min-width: 768px) {
            .pricing-cards-grid { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>

        <div className="pricing-cards-grid">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>

        {/* FAQ */}
        <FaqList items={FAQ_ITEMS} />
      </main>

      <PublicFooter />
    </div>
  );
}

// ── PlanCard ─────────────────────────────────────────────────────────
function PlanCard({ name, price, priceUnit, features, cta, ctaTo, highlight, badge }) {
  const cardInner = (
    <div
      style={{
        background: UI.surfaceContainerLowest,
        borderRadius: highlight ? "0.625rem" : UI.radius.md,
        padding: UI.spacing.lg,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Decorative ambient blob for Pro */}
      {highlight && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 128,
            height: 128,
            background: `${UI.primary}0d`,
            borderRadius: "50%",
            filter: "blur(32px)",
            transform: "translate(50%, -50%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Name + price */}
      <div style={{ marginBottom: UI.spacing.lg, position: "relative" }}>
        <h3
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.h3,
            fontWeight: UI.fontWeight.h3,
            color: UI.onSurface,
            margin: `0 0 ${UI.spacing.xs}`,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {name}
          {highlight && <MdStar size={20} style={{ color: UI.goldStar }} />}
        </h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: UI.spacing.xs }}>
          <span
            style={{
              fontFamily: UI.font,
              fontSize: "40px",
              fontWeight: 700,
              lineHeight: 1.1,
              color: highlight ? UI.primary : UI.onSurface,
            }}
          >
            {price}
          </span>
          {priceUnit && (
            <span
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.bodyMd,
                color: UI.onSurfaceVariant,
              }}
            >
              {priceUnit}
            </span>
          )}
        </div>
      </div>

      {/* Features list */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: UI.spacing.sm,
          flex: 1,
          position: "relative",
        }}
      >
        {features.map(({ label }) => (
          <li key={label} style={{ display: "flex", alignItems: "center", gap: UI.spacing.xs }}>
            <MdCheck
              size={20}
              style={{ color: highlight ? UI.primary : UI.secondary, flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.bodyMd,
                color: highlight ? UI.onSurface : UI.onSurfaceVariant,
                fontWeight: highlight ? 500 : 400,
              }}
            >
              {label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        to={ctaTo}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: UI.spacing.xl,
          width: "100%",
          padding: "12px 16px",
          borderRadius: UI.radius.full,
          fontFamily: UI.font,
          fontSize: UI.fontSize.labelMd,
          fontWeight: UI.fontWeight.labelMd,
          textDecoration: "none",
          minHeight: 44,
          background: highlight ? UI.primary : "transparent",
          color: highlight ? UI.onPrimary : UI.primary,
          border: highlight ? "none" : `2px solid ${UI.primary}`,
          boxShadow: highlight ? "0 4px 12px rgba(53,37,205,0.2)" : "none",
          transition: highlight ? "background 0.2s" : "background 0.2s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (highlight) e.currentTarget.style.background = UI.surfaceTint;
          else e.currentTarget.style.background = UI.surfaceContainerLow;
        }}
        onMouseLeave={(e) => {
          if (highlight) e.currentTarget.style.background = UI.primary;
          else e.currentTarget.style.background = "transparent";
        }}
      >
        {cta}
      </Link>
    </div>
  );

  if (highlight) {
    return (
      <div
        style={{
          position: "relative",
          background: UI.goldGradient,
          padding: "2px",
          borderRadius: UI.radius.md,
          boxShadow: UI.shadow.proCard,
          transform: "translateY(-1rem)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Badge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: UI.goldGradient,
            color: UI.onPrimary,
            borderRadius: UI.radius.full,
            padding: "4px 16px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 1,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.labelSm,
              fontWeight: UI.fontWeight.labelSm,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {badge}
          </span>
        </div>
        {cardInner}
      </div>
    );
  }

  return (
    <div
      style={{
        background: UI.surfaceContainerLowest,
        borderRadius: UI.radius.md,
        border: `1px solid ${UI.outlineVariant}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = UI.shadow.cardHover)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)")}
    >
      {cardInner}
    </div>
  );
}

// ── FaqList ───────────────────────────────────────────────────────────
function FaqList({ items }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "48rem",
        margin: "5rem auto 0",
      }}
    >
      <h2
        style={{
          fontFamily: UI.font,
          fontSize: UI.fontSize.h2,
          fontWeight: UI.fontWeight.h2,
          color: UI.onSurface,
          textAlign: "center",
          margin: `0 0 ${UI.spacing.lg}`,
        }}
      >
        Câu hỏi thường gặp
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: UI.spacing.sm }}>
        {items.map(({ q, a }) => (
          <div
            key={q}
            style={{
              background: UI.surfaceContainerLowest,
              borderRadius: UI.radius.lg,
              border: `1px solid ${UI.outlineVariant}`,
              padding: UI.spacing.md,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <h4
              style={{
                fontFamily: UI.font,
                fontSize: "18px",
                fontWeight: UI.fontWeight.h3,
                color: UI.onSurface,
                margin: `0 0 ${UI.spacing.xs}`,
                lineHeight: UI.lineHeight.h3,
              }}
            >
              {q}
            </h4>
            <p
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.bodyMd,
                color: UI.onSurfaceVariant,
                margin: 0,
                lineHeight: UI.lineHeight.bodyMd,
              }}
            >
              {a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
