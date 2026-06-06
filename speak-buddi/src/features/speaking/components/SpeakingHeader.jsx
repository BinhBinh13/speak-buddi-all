import { useNavigate } from "react-router-dom";

export default function SpeakingHeader({ topic, freeTopic }) {
  const navigate = useNavigate();

  // freeTopic: { prompt } — từ free speak banner
  // topic:     { label, emoji, vocab, grammar } — từ roadmap node

  return (
    <div style={styles.header}>
      <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M5 12l7-7M5 12l7 7" />
        </svg>
        Dashboard
      </button>

      <div style={styles.center}>
        <span style={styles.title}>Speaking practice</span>

        {freeTopic ? (
          <div style={styles.promptRow}>
            <span style={styles.promptBadge}>Free speak</span>
            <span style={styles.promptText} title={freeTopic.prompt}>
              {freeTopic.prompt.length > 32
                ? freeTopic.prompt.slice(0, 32) + "…"
                : freeTopic.prompt}
            </span>
          </div>
        ) : topic ? (
          <div style={styles.topicRow}>
            <span style={styles.topicBadge}>{topic.emoji} {topic.label}</span>
            <span style={styles.topicMeta}>{topic.vocab} words · {topic.grammar} grammar</span>
          </div>
        ) : (
          <span style={styles.sub}>Daily conversation</span>
        )}
      </div>

      <div style={styles.liveBadge}>
        <span style={styles.liveDot} />
        Live
      </div>

      <style>{`@keyframes blink-dot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.875rem 1.25rem",
    borderBottom: "0.5px solid #e5e7eb",
    flexShrink: 0,
    gap: 8,
    background: "white",
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "none", border: "none", cursor: "pointer",
    color: "#6b7280", fontSize: 13, padding: "4px 0",
    whiteSpace: "nowrap", flexShrink: 0,
  },
  center: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 3, flex: 1, minWidth: 0,
  },
  title: { fontSize: 14, fontWeight: 500, color: "#111827" },
  sub:   { fontSize: 11, color: "#9ca3af" },

  // free speak
  promptRow: { display: "flex", alignItems: "center", gap: 6 },
  promptBadge: {
    fontSize: 11, padding: "2px 8px", borderRadius: 20,
    background: "#fef2f2", color: "#b91c1c",
    border: "0.5px solid #fecaca", fontWeight: 500, whiteSpace: "nowrap",
  },
  promptText: {
    fontSize: 11, color: "#6b7280",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },

  // roadmap topic
  topicRow: { display: "flex", alignItems: "center", gap: 6 },
  topicBadge: {
    fontSize: 11, padding: "2px 8px", borderRadius: 20,
    background: "#fef2f2", color: "#b91c1c",
    border: "0.5px solid #fecaca", fontWeight: 500, whiteSpace: "nowrap",
  },
  topicMeta: { fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" },

  liveBadge: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 11, padding: "3px 10px", borderRadius: 20,
    background: "#f0fdf4", color: "#16a34a",
    border: "0.5px solid #bbf7d0", whiteSpace: "nowrap", flexShrink: 0,
  },
  liveDot: {
    display: "inline-block", width: 6, height: 6,
    borderRadius: "50%", background: "currentColor",
    animation: "blink-dot 1.5s infinite",
  },
};
