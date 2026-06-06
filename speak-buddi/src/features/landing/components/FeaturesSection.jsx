import { MdChat, MdGraphicEq, MdMenuBook, MdMap, MdQuiz, MdTranslate } from "react-icons/md";
import { UI } from "../../../shared/constants/designTokens";

const FEATURES = [
  {
    Icon: MdChat,
    iconBg: UI.primaryContainer,
    iconColor: UI.primary,
    title: "Hội thoại AI",
    desc: "Thực hành nói chuyện với các nhân vật AI thông minh trong các tình huống thực tế.",
  },
  {
    Icon: MdGraphicEq,
    iconBg: UI.secondaryContainer,
    iconColor: UI.secondary,
    title: "Luyện phát âm",
    desc: "Nhận phản hồi ngay lập tức, chi tiết về cách phát âm của bạn để cải thiện ngữ điệu.",
  },
  {
    Icon: MdMenuBook,
    iconBg: UI.tertiaryContainer,
    iconColor: UI.tertiary,
    title: "Từ vựng theo cấp độ",
    desc: "Học các từ vựng phù hợp với trình độ CEFR của bạn, từ A1 đến C2.",
  },
  {
    Icon: MdMap,
    iconBg: UI.primaryContainer,
    iconColor: UI.primary,
    title: "Lộ trình chủ đề",
    desc: "Làm theo lộ trình học tập có cấu trúc được thiết kế để bao quát mọi tình huống hàng ngày.",
  },
  {
    Icon: MdQuiz,
    iconBg: UI.secondaryContainer,
    iconColor: UI.secondary,
    title: "Bài kiểm tra từ vựng",
    desc: "Củng cố trí nhớ của bạn bằng các câu đố tương tác và bài kiểm tra tiến độ.",
  },
  {
    Icon: MdTranslate,
    iconBg: UI.tertiaryContainer,
    iconColor: UI.tertiary,
    title: "Dịch từ vựng",
    desc: "Dịch tức thời trong ngữ cảnh giúp bạn hiểu cách sử dụng sắc thái của các từ mới.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      style={{
        maxWidth: UI.spacing.maxWidth,
        margin: "0 auto",
        padding: `6rem clamp(16px, 5vw, ${UI.spacing.marginDesktop})`,
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
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
          Mọi thứ bạn cần để nói tiếng Anh lưu loát
        </h2>
        <p
          style={{
            fontFamily: UI.font,
            fontSize: UI.fontSize.bodyLg,
            color: UI.onSurfaceVariant,
            margin: "0 auto",
            maxWidth: 640,
            lineHeight: UI.lineHeight.bodyLg,
          }}
        >
          Các công cụ toàn diện được thiết kế để đẩy nhanh hành trình ngôn ngữ của bạn.
        </p>
      </div>

      {/* Grid */}
      <style>{`
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 768px)  { .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .features-grid { grid-template-columns: repeat(3, 1fr); } }

        .feature-card {
          background: ${UI.surfaceContainerLowest};
          border-radius: 1.5rem;
          border: 1px solid rgba(199,196,216,0.2);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          box-shadow: ${UI.shadow.card};
          transition: box-shadow 0.2s;
        }
        .feature-card:hover { box-shadow: ${UI.shadow.cardHover}; }
      `}</style>

      <div className="features-grid">
        {FEATURES.map(({ Icon, iconBg, iconColor, title, desc }) => (
          <div key={title} className="feature-card">
            <div
              style={{
                background: iconBg,
                color: iconColor,
                borderRadius: UI.radius.md,
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.5rem",
                flexShrink: 0,
              }}
            >
              <Icon size={28} />
            </div>
            <h3
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.h3,
                fontWeight: UI.fontWeight.h3,
                color: UI.onSurface,
                margin: "0 0 0.5rem",
                lineHeight: UI.lineHeight.h3,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontFamily: UI.font,
                fontSize: UI.fontSize.bodyMd,
                color: UI.onSurfaceVariant,
                margin: 0,
                lineHeight: UI.lineHeight.bodyMd,
              }}
            >
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
