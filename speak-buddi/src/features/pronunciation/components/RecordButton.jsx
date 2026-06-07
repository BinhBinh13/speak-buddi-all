// speak-buddi/src/features/pronunciation/components/RecordButton.jsx
// Nút mic tròn lớn + pulse-ring animation khi đang ghi
// Touch target ≥ 44px (nút 80px × 80px), bám mockup luyen_phat_am_desktop

/**
 * @param {{
 *   status: "idle"|"recording"|"processing"|"done"|"error",
 *   onStart: () => void,
 *   onStop: () => void,
 * }} props
 */
export default function RecordButton({ status, onStart, onStop }) {
  const isRecording  = status === "recording";
  const isProcessing = status === "processing";
  const isDisabled   = isProcessing;

  function handleClick() {
    if (isDisabled) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  }

  return (
    <>
      {/* Inject keyframes */}
      <style>{PULSE_CSS}</style>

      {/* Outer wrapper 128×128 để pulse ring không bị clip */}
      <div style={styles.wrapper}>
        {/* Pulse ring 1 — chỉ hiện khi đang ghi */}
        {isRecording && (
          <>
            <div style={styles.pulseRing1} />
            <div style={{ ...styles.pulseRing1, ...styles.pulseRing2 }} />
          </>
        )}

        {/* Nút mic */}
        <button
          onClick={handleClick}
          disabled={isDisabled}
          aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
          style={{
            ...styles.btn,
            ...(isRecording ? styles.btnRecording : {}),
            ...(isDisabled  ? styles.btnDisabled  : {}),
          }}
        >
          {/* Icon mic dạng SVG inline (không cần react-icons) */}
          {isRecording ? (
            // Stop icon khi đang ghi
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            // Mic icon khi idle/error
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-2 4v6a2 2 0 1 0 4 0V5a2 2 0 1 0-4 0z"/>
              <path d="M19 10a1 1 0 0 1 2 0 9 9 0 0 1-8 8.94V21h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.06A9 9 0 0 1 3 10a1 1 0 0 1 2 0 7 7 0 1 0 14 0z"/>
            </svg>
          )}
        </button>
      </div>
    </>
  );
}

const PULSE_CSS = `
@keyframes sb-pulse {
  0%   { transform: scale(1);   opacity: 0.5; }
  100% { transform: scale(1.55); opacity: 0;   }
}
`;

const styles = {
  wrapper: {
    position: "relative",
    display:  "flex",
    alignItems: "center",
    justifyContent: "center",
    width:  128,
    height: 128,
  },
  pulseRing1: {
    position:     "absolute",
    width:        "100%",
    height:       "100%",
    borderRadius: "50%",
    background:   "#4f46e5",
    opacity:      0.4,
    animation:    "sb-pulse 2s infinite",
  },
  pulseRing2: {
    animationDelay: "1s",
  },
  btn: {
    position:     "relative",
    zIndex:       10,
    width:         80,
    height:        80,
    borderRadius: "50%",
    border:       "none",
    background:   "#3525cd",
    color:        "#ffffff",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    cursor:       "pointer",
    boxShadow:    "0 4px 16px rgba(53,37,205,0.35)",
    transition:   "transform 0.15s, box-shadow 0.15s",
    // Ensure touch target ≥ 44px (nút 80px đã đủ)
    minWidth:     44,
    minHeight:    44,
  },
  btnRecording: {
    background: "#ba1a1a",
    boxShadow:  "0 4px 16px rgba(186,26,26,0.4)",
  },
  btnDisabled: {
    opacity:  0.55,
    cursor:   "not-allowed",
  },
};
