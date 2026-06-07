// speak-buddi/src/features/pronunciation/components/FeedbackBox.jsx
// ─── Hộp feedback tiếng Việt với icon lightbulb (tertiary #7e3000) ────────────
// Port từ mockup: bg surface-container-low #f5f2ff, icon tertiary, text on-surface

/**
 * @param {{ feedback: string }} props
 */
export default function FeedbackBox({ feedback }) {
  if (!feedback) return null;

  return (
    <div style={styles.box}>
      {/* Icon lightbulb — dùng ký tự unicode vì không có Material Icons trong FE */}
      <span style={styles.icon} aria-hidden="true">💡</span>
      <p style={styles.text}>{feedback}</p>
    </div>
  );
}

const styles = {
  box: {
    background:   "#f5f2ff",
    borderRadius:  8,
    padding:      "0.75rem 1rem",
    display:      "flex",
    alignItems:   "flex-start",
    gap:           8,
  },
  icon: {
    fontSize:   18,
    flexShrink:  0,
    marginTop:   2,
    color:      "#7e3000",
  },
  text: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    16,
    fontWeight:  400,
    lineHeight:  1.6,
    color:       "#1b1b24",
    margin:       0,
  },
};
