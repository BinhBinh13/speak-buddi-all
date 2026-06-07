// speak-buddi/src/features/pronunciation/components/SyllableChips.jsx
// ─── Chip âm tiết tô màu theo điểm (ngưỡng từ mockup + DESIGN.md) ────────────
// Ngưỡng màu (từ mockup: "De"/"par" xanh, "ture" cam):
//   score >= 75 → secondary-container  bg:#6cf8bb  text:#00714d  (xanh)
//   score <  75 → tertiary-fixed-dim   bg:#ffb695  text:#7b2f00  (cam)

/**
 * @param {{ syllables: Array<{ text: string, score: number }> }} props
 */
export default function SyllableChips({ syllables }) {
  if (!syllables || syllables.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      {syllables.map((syl, idx) => {
        const isHigh = syl.score >= 75;
        return (
          <span
            key={idx}
            style={{
              ...styles.chip,
              background:  isHigh ? "#6cf8bb" : "#ffb695",
              color:       isHigh ? "#00714d" : "#7b2f00",
              borderColor: isHigh ? "rgba(0,108,73,0.2)" : "rgba(126,48,0,0.2)",
            }}
            title={`Điểm: ${Math.round(syl.score)}`}
          >
            {syl.text}
          </span>
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    display:        "flex",
    justifyContent: "center",
    flexWrap:       "wrap",
    gap:             8,
    marginBottom:    "1rem",
  },
  chip: {
    padding:       "6px 20px",
    borderRadius:   9999,
    fontFamily:    "'Be Vietnam Pro', sans-serif",
    fontSize:       20,
    fontWeight:     600,
    border:         "1px solid transparent",
    lineHeight:     1.4,
    // Touch target ≥ 44px (chip tuy nhỏ nhưng chỉ display, không cần tap)
    display:        "inline-block",
  },
};
