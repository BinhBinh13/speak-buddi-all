import { Link } from "react-router-dom";
import { MdCheckCircle } from "react-icons/md";
import { UI } from "../../../shared/constants/designTokens";

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
    // TODO: Đổi thành /register khi S1.4 hoàn thành
    ctaTo: "/pricing",
    highlight: true,
    badge: "Phổ biến nhất",
  },
];

export default function PricingSection() {
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
        `}</style>

        <div className="pricing-teaser-grid">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ name, price, priceUnit, features, cta, ctaTo, highlight, badge }) {
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
    </div>
  );
}
