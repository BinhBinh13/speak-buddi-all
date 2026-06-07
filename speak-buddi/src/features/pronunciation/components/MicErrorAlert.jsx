// speak-buddi/src/features/pronunciation/components/MicErrorAlert.jsx
// Banner lỗi mic theo enum + nút "Thử lại" (SRS §5.2)

/**
 * @param {{
 *   error: { code: string, message: string },
 *   onRetry: () => void,
 * }} props
 */
export default function MicErrorAlert({ error, onRetry }) {
  if (!error) return null;

  return (
    <div style={styles.banner} role="alert">
      <p style={styles.message}>{error.message}</p>
      <button onClick={onRetry} style={styles.retryBtn}>
        Thử lại
      </button>
    </div>
  );
}

const styles = {
  banner: {
    width:        "100%",
    maxWidth:      560,
    background:   "#ffdad6",
    border:       "1px solid #ba1a1a",
    borderRadius:  8,
    padding:      "14px 16px",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "space-between",
    gap:           12,
    flexWrap:     "wrap",
  },
  message: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    14,
    fontWeight:  400,
    color:       "#93000a",
    margin:      0,
    flex:        1,
  },
  retryBtn: {
    background:   "#ba1a1a",
    color:        "#ffffff",
    border:       "none",
    borderRadius:  6,
    padding:      "8px 16px",
    fontFamily:  "'Be Vietnam Pro', sans-serif",
    fontSize:     14,
    fontWeight:   600,
    cursor:       "pointer",
    whiteSpace:   "nowrap",
    // Touch target ≥ 44px
    minHeight:    44,
    transition:   "opacity 0.15s",
  },
};
