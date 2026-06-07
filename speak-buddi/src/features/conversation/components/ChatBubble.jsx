// src/features/conversation/components/ChatBubble.jsx
// ─── Chat bubble cho màn hội thoại AI (S7.1) ──────────────────────────────────
//
// Bám mockup hoi_thoai_ai_desktop + hoi_thoai_ai_mobile + DESIGN.md:
//   - User  : căn phải, bg primary #3525cd, text trắng, rounded-2xl rounded-tr-none
//   - AI    : căn trái, bg surface-container-lowest (desktop) / surface-container-highest (mobile)
//   - Dưới AI message: pill "▶ Nghe" + "🌐 Dịch"
//   - TTS   : badge 🔇 khi ttsError=true
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";

// ── Design tokens (DESIGN.md) ─────────────────────────────────────────────────
const C = {
  primary:             "#3525cd",
  onPrimary:           "#ffffff",
  surface:             "#fcf8ff",
  surfaceContainer:    "#f0ecf9",
  surfaceLowest:       "#ffffff",
  surfaceContainerHighest: "#e4e1ee",
  onSurface:           "#1b1b24",
  onSurfaceVariant:    "#464555",
  outlineVariant:      "#c7c4d8",
  secondary:           "#006c49",
  error:               "#ba1a1a",
  primaryContainer:    "#4f46e5",
  onPrimaryContainer:  "#dad7ff",
};

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

// ── Pill action button ────────────────────────────────────────────────────────
function PillButton({ icon, label, onClick, disabled = false }) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      style={{
        display:     "inline-flex",
        alignItems:  "center",
        gap:         4,
        padding:     "4px 12px",
        borderRadius: 9999,
        border:      `1px solid ${C.outlineVariant}`,
        background:  C.surfaceContainer,
        color:       disabled ? C.outlineVariant : C.onSurfaceVariant,
        fontSize:    12,
        fontWeight:  600,
        cursor:      disabled ? "default" : "pointer",
        fontFamily:  FONT,
        minHeight:   28,
        transition:  "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = C.surfaceContainerHighest;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = C.surfaceContainer;
      }}
    >
      {icon} {label}
    </button>
  );
}

// ── ChatBubble chính ──────────────────────────────────────────────────────────
/**
 * @param {{ role: "user"|"assistant", content: string, audioUrl?: string, ttsError?: boolean }} props
 */
export default function ChatBubble({ role, content, audioUrl, ttsError }) {
  const isUser = role === "user";
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const timestamp = new Date().toLocaleTimeString("vi-VN", {
    hour:   "2-digit",
    minute: "2-digit",
  });

  function handlePlayAudio() {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  }

  if (isUser) {
    // ── Bubble người dùng: căn phải ──────────────────────────────────────
    return (
      <div
        style={{
          display:       "flex",
          flexDirection: "row-reverse",
          gap:           12,
          maxWidth:      "75%",
          alignSelf:     "flex-end",
          fontFamily:    FONT,
        }}
      >
        <div
          style={{
            width:          40,
            height:         40,
            borderRadius:   "50%",
            background:     C.surfaceContainer,
            border:         `1px solid ${C.outlineVariant}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            fontSize:       18,
          }}
        >
          👤
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 8, flexDirection: "row-reverse", alignItems: "baseline" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>Bạn</span>
            <span style={{ fontSize: 12, color: C.onSurfaceVariant }}>{timestamp}</span>
          </div>
          <div
            style={{
              background:           C.primary,
              color:                C.onPrimary,
              padding:              "12px 16px",
              borderRadius:         "1rem",
              borderTopRightRadius: "4px",
              fontSize:             16,
              lineHeight:           1.6,
              boxShadow:            "0 8px 24px rgba(79,70,229,0.15)",
              wordBreak:            "break-word",
            }}
          >
            {content}
          </div>
        </div>
      </div>
    );
  }

  // ── Bubble AI: căn trái ─────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .sb-ai-bubble { background: #ffffff; }
        @media (max-width: 767px) { .sb-ai-bubble { background: #e4e1ee; } }
      `}</style>

      <div
        style={{
          display:    "flex",
          gap:        12,
          maxWidth:   "75%",
          alignSelf:  "flex-start",
          fontFamily: FONT,
        }}
      >
        {/* Avatar AI */}
        <div
          style={{
            width:          40,
            height:         40,
            borderRadius:   "50%",
            background:     C.primaryContainer,
            color:          C.onPrimaryContainer,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            fontSize:       20,
            border:         `1px solid ${C.outlineVariant}`,
            boxShadow:      "0 2px 8px rgba(79,70,229,0.12)",
          }}
        >
          🤖
        </div>

        {/* Nội dung */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>AI Tutor</span>
            <span style={{ fontSize: 12, color: C.onSurfaceVariant }}>{timestamp}</span>
          </div>

          <div
            className="sb-ai-bubble"
            style={{
              border:              `1px solid ${C.outlineVariant}22`,
              padding:             "12px 16px",
              borderRadius:        "1rem",
              borderTopLeftRadius: "4px",
              fontSize:            16,
              lineHeight:          1.6,
              color:               C.onSurface,
              boxShadow:           "0 4px 12px rgba(79,70,229,0.04)",
              wordBreak:           "break-word",
            }}
          >
            {content}

            {ttsError && (
              <div
                style={{
                  marginTop:    8,
                  padding:      "6px 10px",
                  borderRadius: 8,
                  background:   "#fff5f5",
                  border:       "1px solid #fecaca",
                  color:        C.error,
                  fontSize:     12,
                  fontWeight:   600,
                  display:      "flex",
                  alignItems:   "center",
                  gap:          6,
                }}
              >
                🔇 Không tạo được âm thanh. Đang hiển thị văn bản thay thế.
              </div>
            )}
          </div>

          {/* Audio element ẩn */}
          {audioUrl && !ttsError && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
          )}

          {/* Hàng action: Nghe + Dịch (luôn hiện dưới AI message) */}
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <PillButton
              icon={playing ? "⏸" : "▶"}
              label="Nghe"
              onClick={handlePlayAudio}
              disabled={!audioUrl || ttsError}
            />
            <PillButton icon="🌐" label="Dịch" disabled />
          </div>
        </div>
      </div>
    </>
  );
}
