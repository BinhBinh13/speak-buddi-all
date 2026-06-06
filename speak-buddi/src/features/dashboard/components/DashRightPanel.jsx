import { useState } from "react";
import { COLORS, FONTS } from "../../../shared/constants/theme";

const RECENT_SESSIONS = [
  { topic: "Environment", score: 81, emoji: "🌱", date: "Hôm qua" },
  { topic: "Technology",  score: 74, emoji: "💻", date: "2 ngày trước" },
];

const QUICK_TOPICS = [
  { id: 1, label: "Work & Career", emoji: "💼", level: "B2", color: COLORS.sky,    bg: "#EAF4FD" },
  { id: 2, label: "Daily Life",    emoji: "🏠", level: "B1", color: COLORS.emerald, bg: COLORS.emeraldBg },
  { id: 3, label: "IELTS Part 2",  emoji: "🎓", level: "C1", color: "#8B5CF6",      bg: "#F3EFFE" },
  { id: 4, label: "Travel",        emoji: "✈️", level: "B1", color: COLORS.amber,   bg: COLORS.amberBg },
];

export default function DashRightPanel() {
  const [selected, setSelected] = useState(null);
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    if (!selected) return;
    setLaunching(true);
    setTimeout(() => setLaunching(false), 1500);
  };

  return (
    <>
      <style>{PANEL_CSS}</style>
      <aside className="dash-right-panel">

        {/* ── AI Coach preview card ── */}
        <div className="panel-ai-card">
          {/* Timer badge */}
          <div className="panel-ai-timer">05:00</div>
          {/* Robot illustration placeholder */}
          <div className="panel-ai-illustration">
            <div className="panel-ai-robot">🤖</div>
            <div className="panel-ai-glow" />
          </div>
        </div>

        {/* ── Gia sư section ── */}
        <a href="/speaking" className="panel-tutor-row">
          <div className="panel-tutor-avatar">🤖</div>
          <div className="panel-tutor-info">
            <div className="panel-tutor-label">GIA SƯ CỦA BẠN</div>
            <div className="panel-tutor-name">SpeakBuddi AI</div>
          </div>
          <span className="panel-tutor-arrow">›</span>
        </a>

        {/* ── Quick start ── */}
        <div className="panel-section-title">Luyện speaking nhanh</div>

        {/* AI question preview */}
        <div className="panel-question-card">
          <div className="panel-question-label">Câu hỏi gợi ý:</div>
          <div className="panel-question-text">
            "What are your long-term career goals and how are you working towards them?"
          </div>
          <div className="panel-question-status">
            <span className="panel-status-dot" />
            AI Coach đang chờ bạn
          </div>
        </div>

        {/* Topic chips */}
        <div className="panel-topics-grid">
          {QUICK_TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(selected === t.id ? null : t.id)}
              className="panel-topic-chip"
              style={{
                border: `1.5px solid ${selected === t.id ? t.color : COLORS.creamDark}`,
                background: selected === t.id ? t.bg : "white",
              }}
            >
              <span className="panel-topic-emoji">{t.emoji}</span>
              <div>
                <div className="panel-topic-label" style={{ color: selected === t.id ? t.color : COLORS.navy }}>
                  {t.label}
                </div>
                <div className="panel-topic-level">{t.level}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={!selected}
          className="panel-launch-btn"
          style={{
            background: selected
              ? `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.emeraldLight})`
              : COLORS.creamDark,
            color: selected ? "white" : COLORS.stoneLight,
            cursor: selected ? "pointer" : "not-allowed",
            boxShadow: selected ? `0 4px 16px ${COLORS.emerald}35` : "none",
          }}
        >
          {launching ? "Đang khởi động..." : "🎤 Bắt đầu luyện ngay"}
        </button>

        {/* Recent sessions */}
        <div className="panel-section-title" style={{ marginTop: 8 }}>Phiên gần đây</div>
        <div className="panel-recent">
          {RECENT_SESSIONS.map((s, i) => (
            <div key={i} className="panel-recent-item">
              <span className="panel-recent-emoji">{s.emoji}</span>
              <div className="panel-recent-info">
                <div className="panel-recent-topic">{s.topic}</div>
                <div className="panel-recent-date">{s.date}</div>
              </div>
              <div
                className="panel-recent-score"
                style={{ color: s.score >= 80 ? COLORS.emerald : COLORS.amber }}
              >
                {s.score}%
              </div>
            </div>
          ))}
        </div>

      </aside>
    </>
  );
}

const PANEL_CSS = `
  .dash-right-panel {
    width: 280px;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* AI card */
  .panel-ai-card {
    border-radius: 18px;
    background: linear-gradient(135deg, #0D1F2D 0%, #1A3445 100%);
    padding: 20px;
    position: relative;
    overflow: hidden;
    min-height: 160px;
    display: flex; align-items: center; justify-content: center;
  }
  .panel-ai-timer {
    position: absolute; top: 14px; left: 14px;
    background: rgba(0,0,0,0.45);
    color: white; border-radius: 8px;
    padding: 4px 10px;
    font-family: ${FONTS.body}; font-size: 13px; font-weight: 700;
  }
  .panel-ai-robot {
    font-size: 64px; position: relative; z-index: 1;
    filter: drop-shadow(0 0 20px ${COLORS.emerald}60);
  }
  .panel-ai-glow {
    position: absolute; width: 120px; height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, ${COLORS.emerald}30 0%, transparent 70%);
    pointer-events: none;
  }

  /* Tutor row */
  .panel-tutor-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-radius: 14px;
    border: 1px solid ${COLORS.creamDark};
    background: white; text-decoration: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .panel-tutor-row:hover {
    border-color: ${COLORS.emeraldBg2};
    box-shadow: 0 2px 12px ${COLORS.emerald}15;
  }
  .panel-tutor-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: ${COLORS.navyMid};
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .panel-tutor-label {
    font-family: ${FONTS.body}; font-size: 10px;
    font-weight: 700; color: ${COLORS.stoneLight};
    letter-spacing: 0.06em;
  }
  .panel-tutor-name {
    font-family: ${FONTS.body}; font-size: 14px;
    font-weight: 700; color: ${COLORS.navy};
  }
  .panel-tutor-arrow { margin-left: auto; font-size: 20px; color: ${COLORS.stoneLight}; }

  /* Section title */
  .panel-section-title {
    font-family: ${FONTS.body}; font-size: 12px;
    font-weight: 700; color: ${COLORS.stone};
    letter-spacing: 0.04em; text-transform: uppercase;
  }

  /* Question card */
  .panel-question-card {
    background: ${COLORS.navy}; border-radius: 14px;
    padding: 14px 16px;
  }
  .panel-question-label {
    font-family: ${FONTS.body}; font-size: 11px;
    color: rgba(255,255,255,0.45); margin-bottom: 6px;
  }
  .panel-question-text {
    font-family: ${FONTS.body}; font-size: 13.5px;
    color: white; line-height: 1.5; margin-bottom: 10px;
  }
  .panel-question-status {
    display: flex; align-items: center; gap: 6px;
    font-family: ${FONTS.body}; font-size: 12px;
    color: ${COLORS.emeraldLight}; font-weight: 500;
  }
  .panel-status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: ${COLORS.emeraldLight};
    box-shadow: 0 0 6px ${COLORS.emeraldLight};
    flex-shrink: 0;
  }

  /* Topics grid */
  .panel-topics-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  }
  .panel-topic-chip {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 10px; border-radius: 10px;
    cursor: pointer; text-align: left;
    transition: all 0.15s;
  }
  .panel-topic-emoji { font-size: 18px; flex-shrink: 0; }
  .panel-topic-label {
    font-family: ${FONTS.body}; font-size: 12px; font-weight: 600;
  }
  .panel-topic-level {
    font-family: ${FONTS.body}; font-size: 10px; color: ${COLORS.stoneLight};
  }

  /* Launch button */
  .panel-launch-btn {
    width: 100%; padding: 13px;
    border-radius: 12px; border: none;
    font-family: ${FONTS.body}; font-size: 14px; font-weight: 600;
    transition: all 0.2s;
  }
  .panel-launch-btn:not(:disabled):hover { opacity: 0.9; transform: translateY(-1px); }

  /* Recent sessions */
  .panel-recent {
    display: flex; flex-direction: column; gap: 7px;
  }
  .panel-recent-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 10px;
    background: ${COLORS.creamDark};
  }
  .panel-recent-emoji { font-size: 16px; }
  .panel-recent-info { flex: 1; }
  .panel-recent-topic {
    font-family: ${FONTS.body}; font-size: 13px;
    font-weight: 500; color: ${COLORS.navy};
  }
  .panel-recent-date {
    font-family: ${FONTS.body}; font-size: 11px; color: ${COLORS.stoneLight};
  }
  .panel-recent-score {
    font-family: ${FONTS.display}; font-size: 15px; font-weight: 700;
  }

  /* Hide on mobile */
  @media (max-width: 1024px) {
    .dash-right-panel { display: none; }
  }
`;
