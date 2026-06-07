// src/features/conversation/ConversationPlaceholder.jsx
// ─── Placeholder màn hội thoại AI (S2.5) ─────────────────────────────────────
//
// Màn hình tạm: hiển thị data contract từ location.state (topicId, topicName,
// batchIndex, words[]) để dev verify data flow từ TopicModal → /conversation.
// Epic 7 sẽ thay thế bằng màn hội thoại AI thật.
//
// Design tokens: primary #3525cd, font Be Vietnam Pro
// ─────────────────────────────────────────────────────────────────────────────

import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../shared/components/AppLayout";

const PRIMARY = "#3525cd";
const FONT    = "'Be Vietnam Pro', system-ui, sans-serif";

export default function ConversationPlaceholder() {
  const location = useLocation();
  const navigate  = useNavigate();
  const state     = location.state ?? {};

  const { topicName, batchIndex, words = [] } = state;

  return (
    <AppLayout>
      <div
        style={{
          minHeight: "calc(100vh - 60px)",
          padding: "clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px)",
          maxWidth: 640,
          margin: "0 auto",
          fontFamily: FONT,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Header */}
        <div>
          <div
            style={{
              display: "inline-block",
              background: "#EEF2FF",
              color: PRIMARY,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              borderRadius: 999,
              padding: "4px 12px",
              marginBottom: 12,
            }}
          >
            EPIC 7 — SẮP RA MẮT
          </div>
          <h1
            style={{
              fontSize: "clamp(22px, 4vw, 28px)",
              fontWeight: 700,
              color: "#1b1b24",
              margin: 0,
            }}
          >
            Luyện hội thoại với AI
          </h1>
          {topicName && (
            <p style={{ fontSize: 15, color: "#464555", marginTop: 8, marginBottom: 0 }}>
              Chủ đề: <strong>{topicName}</strong>
              {batchIndex != null ? ` — Phần ${batchIndex + 1}` : ""}
            </p>
          )}
        </div>

        {/* Words preview */}
        {words.length > 0 && (
          <div
            style={{
              background: "#f8f7ff",
              border: "1px solid #e4e1ee",
              borderRadius: 16,
              padding: "20px 24px",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#464555",
                letterSpacing: "0.04em",
                marginBottom: 12,
              }}
            >
              {words.length} TỪ TRONG PHẦN NÀY
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {words.map((w, i) => (
                <span
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #c7c4d8",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#1b1b24",
                  }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Coming soon message */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e4e1ee",
            borderRadius: 16,
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
          <p style={{ fontSize: 15, color: "#464555", margin: "0 0 8px" }}>
            Tính năng hội thoại AI đang được phát triển.
          </p>
          <p style={{ fontSize: 13, color: "#777587", margin: 0 }}>
            Sẽ ra mắt trong Epic 7 — AI Conversation.
          </p>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate("/roadmap")}
          style={{
            alignSelf: "flex-start",
            padding: "12px 24px",
            borderRadius: 12,
            border: "1px solid #e4e1ee",
            background: "#ffffff",
            color: "#1b1b24",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            minHeight: 44,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f0ecf9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
        >
          Quay lại lộ trình
        </button>
      </div>
    </AppLayout>
  );
}
