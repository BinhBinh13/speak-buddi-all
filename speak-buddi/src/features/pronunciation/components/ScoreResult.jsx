// speak-buddi/src/features/pronunciation/components/ScoreResult.jsx
// ─── Wrapper "Score Display" đầy đủ sau khi chấm phát âm ─────────────────────
// Port từ mockup luyen_phat_am_desktop (khối Score Display):
//   - Bento 3 cột desktop / 1 cột mobile: gauge + 2 sub-scores
//   - Syllable chips + feedback box
//   - 2 nút: Thử lại (outline) + Từ tiếp theo (filled)
// Bám DESIGN.md màu/font/spacing.

import ScoreGauge    from "./ScoreGauge";
import SubScoreCard  from "./SubScoreCard";
import SyllableChips from "./SyllableChips";
import FeedbackBox   from "./FeedbackBox";

/**
 * @param {{
 *   result:        { overall, accuracy, fluency, syllables, feedback },
 *   onRetry:       () => void,
 *   onNext:        () => void,
 *   hasNext:       boolean,
 * }} props
 */
export default function ScoreResult({ result, onRetry, onNext, hasNext }) {
  return (
    <div style={styles.container}>
      {/* ── Bento: Gauge + Sub-scores ──────────────────────────────────────── */}
      <div style={styles.bentoGrid}>
        {/* Overall gauge — col-span-1 */}
        <div style={styles.gaugeCell}>
          <ScoreGauge score={result.overall} />
        </div>

        {/* Sub-scores — col-span-2, 2 cột */}
        <div style={styles.subScoreGrid}>
          <SubScoreCard
            label="Chính xác"
            value={result.accuracy}
            icon="accuracy"
          />
          <SubScoreCard
            label="Lưu loát"
            value={result.fluency}
            icon="fluency"
          />
        </div>
      </div>

      {/* ── Syllable breakdown + feedback ────────────────────────────────── */}
      <div style={styles.syllableCard}>
        <SyllableChips syllables={result.syllables} />
        <FeedbackBox   feedback={result.feedback} />
      </div>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div style={styles.actions}>
        <button
          onClick={onRetry}
          style={styles.retryBtn}
          aria-label="Thử lại từ này"
        >
          Thử lại
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          style={{
            ...styles.nextBtn,
            opacity: hasNext ? 1 : 0.5,
            cursor:  hasNext ? "pointer" : "not-allowed",
          }}
          aria-label="Từ tiếp theo"
        >
          Từ tiếp theo{" "}
          <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
        </button>
      </div>
    </div>
  );
}

/* ── Responsive styles ──────────────────────────────────────────────────────
   - desktop (> 600px): bento 3 cột (gauge 1 + sub-score 2)
   - mobile  (≤ 600px): stack 1 cột
   Dùng CSS inline với media queries qua style + viewport check sẽ không
   được — dùng flex-wrap thay thế để đơn giản + đủ responsive.
   Bento: minWidth gauge 160px, sub-score 200px; flex-wrap: wrap.
*/
const styles = {
  container: {
    width:    "100%",
    maxWidth:  720,
    display:   "flex",
    flexDirection: "column",
    gap:        16,
    marginTop:  8,
  },
  // Bento grid: gauge (flex 1) + sub-scores (flex 2), wrap ở mobile
  bentoGrid: {
    display:    "flex",
    flexWrap:   "wrap",
    gap:         16,
  },
  gaugeCell: {
    flex:      "1 1 160px",
    minWidth:   160,
  },
  subScoreGrid: {
    flex:       "2 1 260px",
    minWidth:   260,
    display:   "grid",
    gridTemplateColumns: "1fr 1fr",
    gap:         16,
  },
  syllableCard: {
    background:   "#ffffff",
    borderRadius:  12,
    padding:       "1.5rem",
    border:        "1px solid #c7c4d8",
    boxShadow:     "0 1px 4px rgba(0,0,0,0.06)",
    display:       "flex",
    flexDirection: "column",
    gap:            12,
  },
  actions: {
    display:        "flex",
    flexWrap:       "wrap",
    gap:             12,
    justifyContent: "flex-end",
    paddingTop:      8,
  },
  retryBtn: {
    padding:      "10px 32px",
    borderRadius:  8,
    border:       "2px solid #3525cd",
    background:   "transparent",
    color:        "#3525cd",
    fontFamily:  "'Be Vietnam Pro', sans-serif",
    fontSize:     14,
    fontWeight:   600,
    cursor:       "pointer",
    transition:   "background 0.15s, color 0.15s",
    minHeight:     44,       // touch target ≥ 44px
    minWidth:      100,
  },
  nextBtn: {
    padding:      "10px 32px",
    borderRadius:  8,
    border:       "none",
    background:   "#3525cd",
    color:        "#ffffff",
    fontFamily:  "'Be Vietnam Pro', sans-serif",
    fontSize:     14,
    fontWeight:   600,
    cursor:       "pointer",
    transition:   "opacity 0.15s",
    minHeight:     44,       // touch target ≥ 44px
    minWidth:      140,
    display:      "flex",
    alignItems:   "center",
    gap:           6,
    boxShadow:    "0 4px 12px rgba(53,37,205,0.25)",
  },
};
