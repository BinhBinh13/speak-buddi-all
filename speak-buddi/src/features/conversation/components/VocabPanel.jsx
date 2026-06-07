// src/features/conversation/components/VocabPanel.jsx
// ─── Panel từ vựng bên phải màn hội thoại (S7.1) ────────────────────────────
//
// Layout bám mockup hoi_thoai_ai_desktop: aside w-80 bên phải
// Mỗi item: từ tiếng Anh (bold) + icon 🔊 + ý nghĩa (on-surface-variant)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  primary:             "#3525cd",
  secondary:           "#006c49",
  onSurface:           "#1b1b24",
  onSurfaceVariant:    "#464555",
  surfaceLowest:       "#ffffff",
  surfaceBright:       "#fcf8ff",
  surfaceContainerLow: "#f5f2ff",
  outlineVariant:      "#c7c4d8",
};

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

export default function VocabPanel({ words = [] }) {
  return (
    <aside
      style={{
        width:         320,
        background:    C.surfaceContainerLow,
        borderLeft:    `1px solid ${C.outlineVariant}`,
        padding:       "24px 16px",
        overflowY:     "auto",
        display:       "flex",
        flexDirection: "column",
        gap:           16,
        fontFamily:    FONT,
        flexShrink:    0,
      }}
    >
      {/* Tiêu đề panel */}
      <div>
        <h3
          style={{
            fontSize:    20,
            fontWeight:  600,
            color:       C.onSurface,
            display:     "flex",
            alignItems:  "center",
            gap:         8,
            margin:      "0 0 4px",
          }}
        >
          📖 Từ vựng bài học
        </h3>
        <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: 0 }}>
          {words.length > 0
            ? `${words.length} từ trong phần này`
            : "Không có từ vựng"}
        </p>
      </div>

      {/* Danh sách từ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {words.map((item, i) => {
          const wordText = typeof item === "string" ? item : item.word ?? "";
          const definition =
            typeof item === "string"
              ? ""
              : item.meaning_vi ?? item.meaning ?? item.definition ?? item.phonetic ?? "";

          function handleSpeak() {
            if (!wordText) return;
            if ("speechSynthesis" in window) {
              const utt = new SpeechSynthesisUtterance(wordText);
              utt.lang = "en-US";
              speechSynthesis.speak(utt);
            }
          }

          return (
            <div
              key={i}
              style={{
                background:   C.surfaceLowest,
                border:       `1px solid ${C.outlineVariant}`,
                borderRadius: 12,
                padding:      "10px 14px",
                boxShadow:    "0 1px 4px rgba(0,0,0,0.04)",
                cursor:       "default",
                transition:   "box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
            >
              <div
                style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "flex-start",
                  marginBottom:   definition ? 4 : 0,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>
                  {wordText}
                </span>
                <button
                  onClick={handleSpeak}
                  title="Phát âm"
                  style={{
                    border:      "none",
                    background:  "transparent",
                    cursor:      "pointer",
                    padding:     "2px 4px",
                    borderRadius: 6,
                    color:       C.onSurfaceVariant,
                    fontSize:    16,
                    lineHeight:  1,
                    transition:  "color 0.15s",
                    flexShrink:  0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.onSurfaceVariant; }}
                >
                  🔊
                </button>
              </div>

              {definition && (
                <p
                  style={{
                    fontSize:   14,
                    color:      C.onSurfaceVariant,
                    margin:     0,
                    lineHeight: 1.5,
                  }}
                >
                  {definition}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Transcript placeholder */}
      <div
        style={{
          marginTop:     "auto",
          background:    C.surfaceBright,
          borderRadius:  16,
          padding:       "16px",
          border:        `1px solid ${C.outlineVariant}`,
          display:       "flex",
          flexDirection: "column",
          gap:           8,
          position:      "relative",
          overflow:      "hidden",
        }}
      >
        <div
          style={{
            position:     "absolute",
            right:        -16,
            top:          -16,
            width:        64,
            height:       64,
            borderRadius: "50%",
            background:   "#6cf8bb4d",
            filter:       "blur(16px)",
            pointerEvents: "none",
          }}
        />
        <h4
          style={{
            fontSize:    14,
            fontWeight:  700,
            color:       C.onSurface,
            margin:      0,
            display:     "flex",
            alignItems:  "center",
            gap:         6,
            position:    "relative",
            zIndex:      1,
          }}
        >
          📊 Live Transcript
        </h4>
        <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: 0, position: "relative", zIndex: 1 }}>
          Xem bản dịch hội thoại theo thời gian thực để theo dõi tiến trình.
        </p>
        <button
          style={{
            padding:      "8px 0",
            borderRadius: 8,
            border:       `1px solid ${C.outlineVariant}`,
            background:   C.surfaceLowest,
            color:        C.onSurface,
            fontSize:     14,
            fontWeight:   600,
            cursor:       "not-allowed",
            opacity:      0.6,
            fontFamily:   FONT,
            position:     "relative",
            zIndex:       1,
          }}
          disabled
          title="Tính năng đang phát triển"
        >
          Bật Transcript
        </button>
      </div>
    </aside>
  );
}
