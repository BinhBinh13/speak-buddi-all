// speak-buddi/src/features/pronunciation/components/WordCard.jsx
// Hiển thị từ + phiên âm + nghĩa, bám mockup luyen_phat_am_desktop

/**
 * @param {{
 *   word: string,
 *   phonetic: string,
 *   meaningVi: string,
 *   onPlay: () => void,
 *   isPlaying: boolean
 * }} props
 */
export default function WordCard({ word, phonetic, meaningVi, onPlay, isPlaying = false }) {
  return (
    <div style={styles.card}>
      {/* Decorative background element — góc phải trên */}
      <div style={styles.decorCorner} />

      <div style={styles.textCenter}>
        {/* Tên từ — display size, màu on-surface */}
        <h2 style={styles.wordDisplay}>{word}</h2>

        {/* Phiên âm — monospace, surface-container-low background */}
        <p style={styles.phonetic}>{phonetic}</p>
      </div>

      {/* Nghĩa tiếng Việt */}
      <p style={styles.meaning}>{meaningVi}</p>

      {/* Nút "Nghe mẫu" — gọi ElevenLabs TTS qua /tts endpoint */}
      <button
        style={{ ...styles.listenBtn, ...(isPlaying ? styles.listenBtnLoading : {}) }}
        onClick={onPlay}
        disabled={isPlaying}
        title="Nghe phát âm mẫu"
      >
        {isPlaying ? (
          <>
            <span style={styles.spinner} />
            Đang phát...
          </>
        ) : (
          <>
            <span style={styles.volIcon}>🔊</span>
            Nghe mẫu
          </>
        )}
      </button>
    </div>
  );
}

const styles = {
  card: {
    width: "100%",
    maxWidth: 560,
    background: "#ffffff",
    borderRadius: 12,
    padding: "2.5rem 2rem",
    boxShadow: "0 8px 24px rgba(53,37,205,0.06)",
    border: "1px solid #c7c4d8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    textAlign: "center",
  },
  decorCorner: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 96,
    height: 96,
    background: "#4f46e5",
    borderBottomLeftRadius: "100%",
    opacity: 0.08,
    pointerEvents: "none",
  },
  textCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  wordDisplay: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    color: "#1b1b24",
    margin: 0,
  },
  phonetic: {
    fontFamily: "monospace",
    fontSize: 18,
    fontWeight: 400,
    lineHeight: 1.6,
    color: "#464555",
    background: "#f5f2ff",
    padding: "4px 12px",
    borderRadius: 6,
    display: "inline-block",
    margin: 0,
  },
  meaning: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    color: "#464555",
    marginTop: 8,
    marginBottom: 16,
  },
  listenBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#3525cd",
    background: "transparent",
    border: "1px solid rgba(53,37,205,0.2)",
    borderRadius: 9999,
    padding: "6px 18px",
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.15s, opacity 0.15s",
    minHeight: 36,
  },
  listenBtnLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  volIcon: {
    fontSize: 16,
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid rgba(53,37,205,0.25)",
    borderTopColor: "#3525cd",
    animation: "sb-spin 0.8s linear infinite",
  },
};
