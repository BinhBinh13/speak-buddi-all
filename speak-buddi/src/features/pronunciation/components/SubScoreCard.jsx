// speak-buddi/src/features/pronunciation/components/SubScoreCard.jsx
// ─── Card sub-score (Chính xác / Lưu loát) với progress bar ─────────────────
// Port từ mockup luyen_phat_am_desktop (sub-scores bento):
//   - Chính xác: icon check_circle, màu secondary #006c49
//   - Lưu loát:  icon speed,        màu primary  #3525cd
//   - Progress bar chiều rộng = score%

/**
 * @param {{
 *   label:    string,
 *   value:    number,      // 0..100
 *   icon:     string,      // "accuracy" | "fluency"
 * }} props
 */
export default function SubScoreCard({ label, value, icon }) {
  const clamped  = Math.max(0, Math.min(100, Math.round(value)));
  const isAccuracy = icon === "accuracy";
  const accentColor = isAccuracy ? "#006c49" : "#3525cd";
  const iconChar    = isAccuracy ? "✓" : "≫";

  return (
    <div style={styles.card}>
      {/* Tiêu đề + icon */}
      <div style={styles.header}>
        <span style={{ ...styles.icon, color: accentColor }}>{iconChar}</span>
        <p style={styles.label}>{label}</p>
      </div>
      {/* Giá trị phần trăm */}
      <p style={styles.value}>{clamped}%</p>
      {/* Progress bar */}
      <div style={styles.trackWrapper}>
        <div
          style={{
            ...styles.progressBar,
            width:      `${clamped}%`,
            background:  accentColor,
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  card: {
    background:    "#ffffff",
    borderRadius:   12,
    padding:        "1.5rem",
    border:         "1px solid #c7c4d8",
    boxShadow:      "0 1px 4px rgba(0,0,0,0.06)",
    display:        "flex",
    flexDirection:  "column",
    justifyContent: "center",
    gap:             6,
  },
  header: {
    display:    "flex",
    alignItems: "center",
    gap:         6,
    marginBottom: 2,
  },
  icon: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    16,
    fontWeight:  700,
  },
  label: {
    fontFamily:    "'Be Vietnam Pro', sans-serif",
    fontSize:       12,
    fontWeight:     600,
    letterSpacing: "0.05em",
    color:          "#464555",
    margin:          0,
  },
  value: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    20,
    fontWeight:  600,
    color:       "#1b1b24",
    margin:       0,
    lineHeight:   1.4,
  },
  trackWrapper: {
    width:        "100%",
    height:        8,
    background:   "#eae6f4",
    borderRadius:  4,
    overflow:     "hidden",
  },
  progressBar: {
    height:       "100%",
    borderRadius:  4,
    transition:   "width 0.6s ease",
  },
};
