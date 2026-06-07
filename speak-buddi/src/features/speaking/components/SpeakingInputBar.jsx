// Input bar — mic + textarea, bám layout /conversation
const C = {
  primary:          "#3525cd",
  onPrimary:        "#ffffff",
  surfaceContainer: "#f0ecf9",
  surfaceLowest:    "#ffffff",
  onSurface:        "#1b1b24",
  onSurfaceVariant: "#464555",
  outlineVariant:   "#c7c4d8",
  secondary:        "#006c49",
};

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

export default function SpeakingInputBar({
  input,
  onInputChange,
  onKeyDown,
  onSend,
  onMicToggle,
  isListening,
  loading,
  disabled,
  micError,
}) {
  const blocked = disabled || loading;

  return (
    <div
      style={{
        padding:        "16px 24px 24px",
        background:     "#fcf8fff2",
        backdropFilter: "blur(8px)",
        borderTop:      `1px solid ${C.outlineVariant}`,
        flexShrink:     0,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            12,
        fontFamily:     FONT,
      }}
    >
      {micError && (
        <p style={{ margin: 0, fontSize: 13, color: "#ba1a1a", textAlign: "center" }}>{micError}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 448 }}>
        <button
          onClick={onMicToggle}
          disabled={blocked}
          title={isListening ? "Nhấn để dừng ghi" : "Nhấn để nói (tiếng Anh hoặc tiếng Việt)"}
          aria-label={isListening ? "Dừng ghi âm" : "Ghi âm"}
          style={{
            width: 80, height: 80, borderRadius: "50%",
            border: isListening ? `3px solid ${C.secondary}` : "none",
            background: blocked ? C.outlineVariant : isListening ? C.secondary : C.primary,
            color: blocked ? C.onSurfaceVariant : "#ffffff",
            fontSize: 32,
            cursor: blocked ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: blocked ? "none" : isListening ? "0 8px 24px rgba(0,108,73,0.35)" : "0 8px 24px rgba(79,70,229,0.3)",
            transition: "transform 0.15s, background 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (!blocked) e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {isListening ? "⏹" : "🎤"}
        </button>

        <div
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            background: C.surfaceLowest, border: `1px solid ${C.outlineVariant}`,
            borderRadius: 9999, padding: "8px 8px 8px 16px",
            opacity: disabled ? 0.55 : 1,
          }}
        >
          <textarea
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder={disabled ? "Quota đã hết — nâng cấp Pro hoặc chờ reset" : "Nhập tin nhắn..."}
            rows={1}
            disabled={blocked}
            style={{
              flex: 1, border: "none", outline: "none", resize: "none",
              background: "transparent", fontSize: 14, lineHeight: 1.5,
              color: C.onSurface, fontFamily: FONT, padding: "4px 0",
              minHeight: 28, maxHeight: 72,
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 72) + "px";
            }}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || blocked}
            title="Gửi (Enter)"
            aria-label="Gửi tin nhắn"
            style={{
              width: 36, height: 36, borderRadius: "50%", border: "none",
              background: !input.trim() || blocked ? C.surfaceContainer : C.primary,
              color: !input.trim() || blocked ? C.onSurfaceVariant : C.onPrimary,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: !input.trim() || blocked ? "not-allowed" : "pointer",
              fontSize: 16, flexShrink: 0,
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
