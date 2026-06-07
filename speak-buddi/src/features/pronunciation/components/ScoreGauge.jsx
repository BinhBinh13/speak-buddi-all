// speak-buddi/src/features/pronunciation/components/ScoreGauge.jsx
// ─── SVG gauge hiển thị điểm tổng quát (0-100) ───────────────────────────────
// Port từ mockup luyen_phat_am_desktop (khối "Overall Score"):
//   - Vòng cung SVG path 36x36 viewBox, -rotate-90
//   - stroke-dasharray = score, 100
//   - Màu secondary #006c49 (đúng DESIGN.md)

/**
 * @param {{ score: number }} props  — score: 0..100
 */
export default function ScoreGauge({ score }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div style={styles.card}>
      <p style={styles.label}>Điểm tổng quát</p>
      <div style={styles.gaugeWrapper}>
        {/* SVG vòng cung — port từ mockup */}
        <svg
          viewBox="0 0 36 36"
          style={styles.svg}
          aria-label={`Điểm tổng quát: ${clamped}`}
        >
          {/* Track (nền vòng cung) */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#eae6f4"
            strokeWidth="3"
          />
          {/* Progress arc */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#006c49"
            strokeWidth="3"
            strokeDasharray={`${clamped}, 100`}
            strokeLinecap="round"
          />
        </svg>
        {/* Số điểm ở giữa */}
        <div style={styles.scoreText}>
          <span style={styles.scoreNum}>{clamped}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background:   "#ffffff",
    borderRadius:  12,
    padding:       "1.5rem",
    border:        "1px solid #c7c4d8",
    boxShadow:     "0 1px 4px rgba(0,0,0,0.06)",
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    justifyContent:"center",
    gap:            8,
  },
  label: {
    fontFamily:    "'Be Vietnam Pro', sans-serif",
    fontSize:       12,
    fontWeight:     600,
    letterSpacing: "0.05em",
    color:          "#464555",
    margin:          0,
  },
  gaugeWrapper: {
    position: "relative",
    width:      96,
    height:     96,
    display:   "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    width:     "100%",
    height:    "100%",
    transform: "rotate(-90deg)",
  },
  scoreText: {
    position: "absolute",
    display:  "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  scoreNum: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    24,
    fontWeight:  600,
    color:       "#006c49",
    lineHeight:  1.3,
  },
};
