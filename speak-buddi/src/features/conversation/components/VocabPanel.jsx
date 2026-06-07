// src/features/conversation/components/VocabPanel.jsx
// ─── Panel từ vựng + tiến độ word detection (S7.1) ─────────────────────────

const C = {
  primary:             "#3525cd",
  secondary:           "#006c49",
  onSurface:           "#1b1b24",
  onSurfaceVariant:    "#464555",
  surfaceLowest:       "#ffffff",
  surfaceBright:       "#fcf8ff",
  surfaceContainerLow: "#f5f2ff",
  outlineVariant:      "#c7c4d8",
  warning:             "#f59e0b",
};

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

function wordKey(item) {
  const w = typeof item === "string" ? item : item.word ?? "";
  return w.toLowerCase();
}

/**
 * @param {{
 *   words?: Array,
 *   coveredWords?: Set<string>,
 *   mentionedWords?: Set<string>,
 *   completionThreshold?: number,
 * }} props
 */
export default function VocabPanel({
  words = [],
  coveredWords = new Set(),
  mentionedWords = new Set(),
  completionThreshold = 0.8,
}) {
  const needed = words.length > 0 ? Math.ceil(words.length * completionThreshold) : 0;
  const usedCount = coveredWords.size;
  const pct = words.length > 0 ? Math.round((usedCount / words.length) * 100) : 0;

  return (
    <aside
      style={{
        width:         320,
        height:        "100%",
        background:    C.surfaceContainerLow,
        borderLeft:    `1px solid ${C.outlineVariant}`,
        padding:       "24px 16px",
        overflowY:     "auto",
        display:       "flex",
        flexDirection: "column",
        gap:           16,
        fontFamily:    FONT,
        flexShrink:    0,
        boxSizing:     "border-box",
      }}
    >
      {/* Tiêu đề + progress word detection */}
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
        <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: "0 0 10px" }}>
          {words.length > 0
            ? `${words.length} từ trong phần này`
            : "Không có từ vựng"}
        </p>

        {words.length > 0 && (
          <div
            style={{
              background:   C.surfaceLowest,
              border:       `1px solid ${C.outlineVariant}`,
              borderRadius: 12,
              padding:      "12px 14px",
            }}
          >
            <div
              style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "center",
                marginBottom:   8,
                fontSize:       13,
              }}
            >
              <span style={{ fontWeight: 700, color: C.onSurface }}>
                🎯 Bạn đã dùng
              </span>
              <span style={{ fontWeight: 700, color: usedCount >= needed ? C.secondary : C.primary }}>
                {usedCount}/{words.length}
                {needed < words.length && (
                  <span style={{ fontWeight: 500, color: C.onSurfaceVariant, fontSize: 12 }}>
                    {" "}(cần {needed} để qua phần)
                  </span>
                )}
              </span>
            </div>
            <div
              style={{
                height:       8,
                borderRadius: 4,
                background:   C.outlineVariant,
                overflow:     "hidden",
              }}
            >
              <div
                style={{
                  height:       "100%",
                  width:        `${Math.min(pct, 100)}%`,
                  background:   usedCount >= needed ? C.secondary : C.primary,
                  borderRadius: 4,
                  transition:   "width 0.35s ease",
                }}
              />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: C.onSurfaceVariant, lineHeight: 1.4 }}>
              ✅ xanh = bạn đã nói từ đó · 🔵 viền = AI đã dùng · ⬜ chưa xuất hiện
            </p>
          </div>
        )}
      </div>

      {/* Danh sách từ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {words.map((item, i) => {
          const wordText = typeof item === "string" ? item : item.word ?? "";
          const key = wordKey(item);
          const definition =
            typeof item === "string"
              ? ""
              : item.meaning_vi ?? item.meaning ?? item.definition ?? item.phonetic ?? "";

          const isUsed = coveredWords.has(key);
          const isMentioned = mentionedWords.has(key);

          let borderColor = C.outlineVariant;
          let bg = C.surfaceLowest;
          if (isUsed) {
            borderColor = C.secondary;
            bg = "#ecfdf5";
          } else if (isMentioned) {
            borderColor = C.primary;
            bg = "#eef2ff";
          }

          function handleSpeak() {
            if (!wordText) return;
            if ("speechSynthesis" in window) {
              speechSynthesis.cancel();
              const utt = new SpeechSynthesisUtterance(wordText);
              utt.lang = "en-US";
              speechSynthesis.speak(utt);
            }
          }

          return (
            <div
              key={key || i}
              style={{
                background:   bg,
                border:       `2px solid ${borderColor}`,
                borderRadius: 12,
                padding:      "10px 14px",
                boxShadow:    "0 1px 4px rgba(0,0,0,0.04)",
                transition:   "border-color 0.2s, background 0.2s",
              }}
            >
              <div
                style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "flex-start",
                  marginBottom:   definition ? 4 : 0,
                  gap:            8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {isUsed && (
                    <span title="Bạn đã dùng từ này" style={{ fontSize: 14 }}>✅</span>
                  )}
                  {!isUsed && isMentioned && (
                    <span title="AI đã dùng trong hội thoại" style={{ fontSize: 14 }}>🔵</span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>
                    {wordText}
                  </span>
                </div>
                <button
                  onClick={handleSpeak}
                  title="Phát âm"
                  type="button"
                  style={{
                    border:       "none",
                    background:   "transparent",
                    cursor:       "pointer",
                    padding:      "2px 4px",
                    borderRadius: 6,
                    color:        C.onSurfaceVariant,
                    fontSize:     16,
                    lineHeight:   1,
                    flexShrink:   0,
                  }}
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

      {/* Gợi ý tiếp tục */}
      {words.length > 0 && usedCount < needed && (
        <div
          style={{
            background:   "#fffbeb",
            border:       `1px solid ${C.warning}`,
            borderRadius: 12,
            padding:      "12px 14px",
            fontSize:     13,
            color:        "#78350f",
            lineHeight:   1.5,
          }}
        >
          💡 Hãy trả lời AI bằng câu có chứa các từ còn ⬜ — khi đủ {needed} từ bạn sẽ hoàn thành phần này.
        </div>
      )}
    </aside>
  );
}
