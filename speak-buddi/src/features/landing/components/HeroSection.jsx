import { Link } from "react-router-dom";
import { UI } from "../../../shared/constants/designTokens";
import { MdMic } from "react-icons/md";

export default function HeroSection() {
  return (
    <section
      style={{
        maxWidth: UI.spacing.maxWidth,
        margin: "0 auto",
        padding: `${UI.spacing.xl} clamp(16px, 5vw, ${UI.spacing.marginDesktop}) 6rem`,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "3rem",
        flexWrap: "wrap",
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .hero-col-left  { width: 100% !important; }
          .hero-col-right { width: 100% !important; }
          .hero-cta-row   { flex-direction: column !important; }
          .hero-cta-row a, .hero-cta-row button { width: 100% !important; text-align: center; }
        }
      `}</style>

      {/* Left column */}
      <div className="hero-col-left" style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h1
          style={{
            fontFamily: UI.font,
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: UI.fontWeight.display,
            color: UI.onSurface,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Luyện nói tiếng Anh cùng AI — mọi lúc, mọi nơi
        </h1>

        <p
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.bodyLg,
            fontWeight: UI.fontWeight.bodyLg,
            color: UI.onSurfaceVariant,
            lineHeight: UI.lineHeight.bodyLg,
            margin: 0,
          }}
        >
          Nâng cao sự tự tin và trôi chảy với các cuộc hội thoại tương tác, phản hồi phát âm theo thời gian thực và lộ trình học được cá nhân hóa.
        </p>

        <div
          className="hero-cta-row"
          style={{ display: "flex", flexDirection: "row", gap: "1rem", marginTop: "1rem" }}
        >
          {/* TODO: Đổi thành /register khi S1.4 hoàn thành */}
          <Link
            to="/login"
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.labelMd,
              fontWeight: UI.fontWeight.labelMd,
              background: UI.primary,
              color: UI.onPrimary,
              textDecoration: "none",
              borderRadius: UI.radius.full,
              padding: "12px 32px",
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Bắt đầu miễn phí
          </Link>

          <Link
            to="/#pricing"
            style={{
              fontFamily: UI.font,
              fontSize: UI.fontSize.labelMd,
              fontWeight: UI.fontWeight.labelMd,
              background: "transparent",
              color: UI.primary,
              textDecoration: "none",
              border: `2px solid ${UI.primary}`,
              borderRadius: UI.radius.full,
              padding: "12px 32px",
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = UI.primaryFixed)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Xem bảng giá
          </Link>
        </div>
      </div>

      {/* Right column — image + badge */}
      <div className="hero-col-right" style={{ flex: "1 1 360px", position: "relative" }}>
        <div
          style={{
            borderRadius: "1.5rem",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            aspectRatio: "4/3",
            background: UI.surfaceContainerLow,
            position: "relative",
          }}
        >
          {/* Placeholder gradient khi không có ảnh thật */}
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${UI.primaryFixed} 0%, ${UI.surfaceContainerLow} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 72, opacity: 0.4 }}>📱</span>
          </div>

          {/* Pronunciation badge */}
          <div
            style={{
              position: "absolute",
              bottom: "1.5rem",
              left: "1.5rem",
              right: "1.5rem",
              background: "rgba(252,248,255,0.92)",
              backdropFilter: "blur(12px)",
              borderRadius: "0.75rem",
              border: `1px solid ${UI.outlineVariant}`,
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              boxShadow: UI.shadow.card,
            }}
          >
            <div
              style={{
                background: UI.secondaryContainer,
                color: UI.onSecondaryContainer,
                borderRadius: UI.radius.full,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdMic size={24} />
            </div>
            <div>
              <p
                style={{
                  fontFamily: UI.font,
                  fontSize: UI.fontSize.labelMd,
                  fontWeight: 600,
                  color: UI.onSurface,
                  margin: 0,
                }}
              >
                Phát âm xuất sắc!
              </p>
              <p
                style={{
                  fontFamily: UI.font,
                  fontSize: UI.fontSize.labelSm,
                  color: UI.onSurfaceVariant,
                  margin: 0,
                  letterSpacing: "0.05em",
                }}
              >
                Độ chính xác 98%
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
