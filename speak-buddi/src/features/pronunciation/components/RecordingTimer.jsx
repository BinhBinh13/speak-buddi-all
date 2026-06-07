// speak-buddi/src/features/pronunciation/components/RecordingTimer.jsx
// Hiển thị bộ đếm thời gian ghi âm (0:00 → 0:15)

/**
 * @param {{ elapsedMs: number }} props
 */
export default function RecordingTimer({ elapsedMs }) {
  const totalSec = Math.floor(elapsedMs / 1000);
  const minutes  = Math.floor(totalSec / 60);
  const seconds  = totalSec % 60;

  const display = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <div style={styles.wrapper}>
      <span style={styles.dot} />
      <span style={styles.time}>{display}</span>
      <span style={styles.label}>/ 0:15</span>
    </div>
  );
}

const styles = {
  wrapper: {
    display:    "flex",
    alignItems: "center",
    gap:         6,
    fontFamily: "'Be Vietnam Pro', sans-serif",
  },
  dot: {
    display:      "inline-block",
    width:         8,
    height:        8,
    borderRadius: "50%",
    background:   "#ba1a1a",
    animation:    "none",
  },
  time: {
    fontSize:   16,
    fontWeight: 600,
    color:      "#1b1b24",
    fontVariantNumeric: "tabular-nums",
  },
  label: {
    fontSize: 13,
    color:    "#777587",
  },
};
