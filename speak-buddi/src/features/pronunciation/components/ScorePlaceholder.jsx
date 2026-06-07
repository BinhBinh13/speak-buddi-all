// speak-buddi/src/features/pronunciation/components/ScorePlaceholder.jsx
// Skeleton "Đang chấm điểm..." — placeholder chờ S6.2 render điểm thật

export default function ScorePlaceholder() {
  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.label}>Đang chấm điểm...</p>
      <p style={styles.sub}>Kết quả chi tiết sẽ có ở phiên bản tới.</p>
    </div>
  );
}

const styles = {
  container: {
    width:        "100%",
    maxWidth:      560,
    border:       "2px dashed #c7c4d8",
    borderRadius:  12,
    padding:      "32px 24px",
    display:      "flex",
    flexDirection: "column",
    alignItems:   "center",
    gap:           10,
    background:   "#f5f2ff",
  },
  spinner: {
    width:  40,
    height: 40,
    borderRadius: "50%",
    border: "4px solid #e4e1ee",
    borderTopColor: "#3525cd",
    animation: "sb-spin 0.9s linear infinite",
  },
  label: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    18,
    fontWeight:  600,
    color:       "#1b1b24",
    margin:       0,
  },
  sub: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    14,
    color:       "#777587",
    margin:       0,
    textAlign:   "center",
  },
};
