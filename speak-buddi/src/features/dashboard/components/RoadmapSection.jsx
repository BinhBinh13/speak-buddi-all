import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, FONTS } from "../../../shared/constants/theme";

const ROADMAP = [
  {
    level: "Beginner", color: COLORS.emerald,
    nodes: [
      { id: 1, color: "#FF6244", emoji: "👋", label: "Greetings",        state: "done",    xp: 120, lessons: 5, vocab: 8,  grammar: 2, words: ["hello","hi","hey","good morning","good evening","goodbye","see you","take care"], grammarTopics: ["Basic greetings structure"] },
      { id: 2,  color: "#00C0B4", emoji: "🗣️", label: "Introductions I",  state: "done",    xp: 110, lessons: 4, vocab: 6,  grammar: 1, words: ["my name is","I am","nice to meet you","where are you from","I'm from","pleased to meet you"], grammarTopics: ["Subject + to be"] },
      { id: 3,   color: "#ED5BAA", emoji: "🤝", label: "Introductions II", state: "done",    xp: 115, lessons: 4, vocab: 6,  grammar: 1, words: ["job","work","hobby","age","live","study"], grammarTopics: ["Yes/No questions"] },
      { id: 4, color: "#FFB617", emoji: "❓", label: "Who is She?",       state: "done",    xp: 100, lessons: 3, vocab: 5,  grammar: 1, words: ["she","he","they","friend","colleague","teacher"], grammarTopics: ["Pronouns"] },
      { id: 5,  color: "#7BC537", emoji: "🌿", label: "Everyday Things",  state: "done",    xp: 130, lessons: 6, vocab: 10, grammar: 1, words: ["bag","phone","keys","wallet","book","pen","cup","table","chair","door"], grammarTopics: ["Articles a/an/the"] },
      { id: 6,   color: "#00B1DF", emoji: "💬", label: "Get to Know You",  state: "current", xp: 0,   lessons: 5, vocab: 6,  grammar: 1, words: ["favorite","like","enjoy","prefer","hobby","weekend"], grammarTopics: ["Simple present"] },
      { id: 7, color: "#2B8CE3", emoji: "👨‍👩‍👧", label: "Family",          state: "locked",  xp: 0,   lessons: 5, vocab: 8,  grammar: 1, words: ["mother","father","sister","brother","grandma","grandpa","cousin","aunt"], grammarTopics: ["Possessives"] },
      { id: 8,  color: "#9B7AE2", emoji: "🌅", label: "Daily Routines",   state: "locked",  xp: 0,   lessons: 6, vocab: 8,  grammar: 2, words: ["wake up","brush teeth","have breakfast","go to work","come home","go to bed","cook","shower"], grammarTopics: ["Adverbs of frequency","Simple present"] },
      { id: 9,   color: "#C54CB9", emoji: "🕐", label: "Free Time",        state: "locked",  xp: 0,   lessons: 4, vocab: 6,  grammar: 1, words: ["movie","music","sport","read","travel","game"], grammarTopics: ["Like + verb-ing"] },
      { id: 10, color: "#ED3044", emoji: "🚶", label: "Going Out",        state: "locked",  xp: 0,   lessons: 5, vocab: 7,  grammar: 1, words: ["restaurant","cinema","park","mall","cafe","meet up","invite","plan"], grammarTopics: ["Making suggestions"] },
    ],
  }
];
const WAVE = ["left", "center", "right", "center"];

function getPos(indexWithinLevel) {
  return WAVE[indexWithinLevel % WAVE.length];
}
/* ── Geometry ── */
const NODE_R  = 33;
const GAP     = 10;
const CR      = 52;
const ROW_H   = 130;
const LEVEL_H = 52;

function buildItems() {
  const items = [];
  ROADMAP.forEach(lv => {
    items.push({ type: "header", level: lv.level, color: lv.color });
    lv.nodes.forEach((node, i) => 
      items.push({ type: "node", node: { ...node, pos: getPos(i) } })
    );
  });
  return items;
}

function computeLayout(items) {
  let y = 0;
  const result = items.map(item => {
    if (item.type === "header") {
      const cy = y + LEVEL_H / 2;
      y += LEVEL_H;
      return { ...item, cy };
    } else {
      const cy = y + ROW_H / 2;
      y += ROW_H;
      return { ...item, cy };
    }
  });
  return { layout: result, totalH: y };
}

function getCX(pos, trackW) {
  const L = trackW * 0.25;
  const C = trackW * 0.5;
  const R = trackW * 0.75;
  if (pos === "left")  return L;
  if (pos === "right") return R;
  return C;
}

function buildPath(x1, cy1, x2, cy2) {
  const sy = cy1 + NODE_R + GAP;
  const ey = cy2 - NODE_R - GAP;

  // nếu cùng cột thì vẽ thẳng
  if (Math.abs(x1 - x2) < 1) {
    return `M ${x1} ${sy} L ${x2} ${ey}`;
  }

  const midY = (sy + ey) / 2;

  return `
    M ${x1} ${sy}
    C ${x1} ${midY},
      ${x2} ${midY},
      ${x2} ${ey}
  `;
}

/* ── Lesson Detail Modal (like image 2) ── */
function LessonModal({ node, onClose }) {
  if (!node) return null;
  const navigate  = useNavigate();
  const isDone    = node.state === "done";
  const isCurrent = node.state === "current";
  const isLocked  = node.state === "locked";

  function goToSpeaking() {
    onClose();
    navigate("/speaking", {
      state: {
        topic: {
          id:           node.id,
          label:        node.label,
          emoji:        node.emoji,
          color:        node.color,
          vocab:        node.vocab,
          grammar:      node.grammar,
          words:        node.words,
          grammarTopics: node.grammarTopics,
        },
      },
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(13,31,45,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(400px, 92vw)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          fontFamily: FONTS.body,
          background: "white",
        }}
      >
        {/* Header banner — màu theo node */}
        <div style={{
          background: node.color,
          padding: "28px 24px 24px",
          textAlign: "center",
          position: "relative",
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.25)", border: "none",
              color: "white", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>

          <div style={{ fontSize: 40, marginBottom: 10 }}>{node.emoji}</div>
          <h2 style={{
            fontFamily: FONTS.display,
            fontSize: 22, fontWeight: 700,
            color: "white", margin: "0 0 6px",
          }}>{node.label}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "0 0 14px" }}>
Learn how to communicate naturally about this topic.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <span style={{
              background: "rgba(255,255,255,0.22)", color: "white",
              borderRadius: 99, padding: "4px 14px",
              fontSize: 13, fontWeight: 600,
            }}>📚 {node.vocab} Words</span>
            <span style={{
              background: "rgba(255,255,255,0.22)", color: "white",
              borderRadius: 99, padding: "4px 14px",
              fontSize: 13, fontWeight: 600,
            }}>📝 {node.grammar} Grammar</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>

          {/* Bài tập */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: node.color, letterSpacing: 0.8, marginBottom: 10 }}>
              Lessons
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                border: `1.5px solid ${node.color}`, borderRadius: 99,
                padding: "7px 14px", cursor: "pointer",
              }}>
                <span style={{ fontSize: 16 }}>📖</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: node.color }}>Lesson</span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                border: "1.5px solid #8B5CF6", borderRadius: 99,
                padding: "7px 14px", cursor: "pointer",
              }}>
                <span style={{ fontSize: 16 }}>🎯</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#8B5CF6" }}>Practice</span>
              </div>
            </div>
          </div>

          {/* Ngữ pháp */}
          {node.grammarTopics && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: node.color, letterSpacing: 0.8, marginBottom: 8 }}>
                GRAMMAR PRACTICE
              </p>
              {node.grammarTopics.map((g, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  border: "1px solid #EEEEE8", borderRadius: 12,
                  marginBottom: 6,
                }}>
                  <span style={{ fontSize: 18 }}>📗</span>
                  <span style={{ fontSize: 13, color: COLORS.navyMid }}>{g}</span>
                </div>
              ))}
            </div>
          )}

          {/* Từ vựng */}
          {node.words && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: node.color, letterSpacing: 0.8, marginBottom: 8 }}>
                VOCABULARY PRACTICE
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}>
                {node.words.slice(0, 6).map((w, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px",
                    border: "1px solid #EEEEE8", borderRadius: 12,
                  }}>
                    <span style={{ fontSize: 14, color: node.color }}>🔊</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy }}>{w}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA button */}
          {isLocked ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: "#F5F5F0", borderRadius: 16,
                padding: "14px 20px", marginBottom: 12,
              }}>
                <p style={{ fontSize: 13, color: COLORS.stone, margin: "0 0 4px" }}>
                  🦘 Are you sure you want to jump to this lesson?
                </p>
                <p style={{ fontSize: 12, color: COLORS.stone, margin: 0, lineHeight: 1.5 }}>
                  Following your personalized path helps you improve faster, but you can still choose this lesson.
                </p>
              </div>
              <button
                onClick={goToSpeaking}
                style={{
                  width: "100%", padding: "14px 0",
                  borderRadius: 16, border: "none",
                  background: node.color, color: "white",
                  fontFamily: FONTS.body, fontSize: 15, fontWeight: 700,
                  cursor: "pointer", boxShadow: `0 -4px 0 0 rgba(0,0,0,0.18) inset`,
                }}>Go to Speaking</button>
            </div>
          ) : (
            <button
              onClick={goToSpeaking}
              style={{
                width: "100%", padding: "14px 0",
                borderRadius: 16, border: "none",
                background: node.color, color: "white",
                fontFamily: FONTS.body, fontSize: 15, fontWeight: 700,
                cursor: "pointer", boxShadow: `0 -4px 0 0 rgba(0,0,0,0.18) inset`,
              }}>
              {isDone ? "Review with Speaking" : "Start Speaking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Node Button ── */
function NodeButton({ node, cx, cy, onOpen }) {
  const [hovered, setHovered] = useState(false);
  const isLocked  = node.state === "locked";
  const isDone    = node.state === "done";
  const isCurrent = node.state === "current";
  const fill = isLocked ? "#C8C8C0" : node.color;
  const D = NODE_R * 2;

  return (
    <div style={{ position: "absolute", left: cx - NODE_R, top: cy - NODE_R, width: D, height: D, zIndex: 10 }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => onOpen(node)}
          style={{
            width: D, height: D, borderRadius: "50%", border: "none",
            background: fill, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, position: "relative",
            boxShadow: `0 -5px 0 0 rgba(0,0,0,${isLocked ? 0.08 : 0.20}) inset`,
            transform: hovered && !isLocked ? "translateY(-2px) scale(1.06)" : "translateY(0)",
            transition: "transform 0.12s",
            ...(isCurrent && { outline: "5px solid rgba(14,165,233,0.22)", outlineOffset: 3 }),
          }}
        >
          <span style={{ filter: isLocked ? "grayscale(1) opacity(.5)" : "none", lineHeight: 1 }}>
            {node.emoji}
          </span>
          {isDone && (
            <div style={{
              position: "absolute", top: -2, right: -4,
              width: 20, height: 20, borderRadius: "50%",
              background: COLORS.emerald, border: "2.5px solid white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: "white", fontWeight: 800,
            }}>✓</div>
          )}
          {isLocked && (
            <div style={{
              position: "absolute", top: -2, right: -4,
              width: 20, height: 20, borderRadius: "50%",
              background: COLORS.navyMid, border: "2px solid white",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8,
            }}>🔒</div>
          )}
        </button>
        <p style={{
          position: "absolute", top: D + 6, left: "50%",
          transform: "translateX(-50%)",
          fontFamily: FONTS.body, fontSize: 11, fontWeight: 700,
          color: isLocked ? COLORS.stone : COLORS.navy,
          textAlign: "center", width: 82, margin: 0,
          lineHeight: 1.3, whiteSpace: "normal", pointerEvents: "none",
        }}>{node.label}</p>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function RoadmapSection() {
  const [activeNode, setActiveNode]   = useState(null);
  const [trackW, setTrackW]           = useState(320);
  const containerRef                   = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setTrackW(Math.min(w, 480));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const items = buildItems();
  const { layout, totalH } = computeLayout(items);
  const nodeItems = layout.filter(i => i.type === "node");

  const trackPaths = [];
  for (let i = 0; i < nodeItems.length - 1; i++) {
    const a = nodeItems[i];
    const b = nodeItems[i + 1];
    const active = a.node.state === "done" || a.node.state === "current";
    trackPaths.push({
      d: buildPath(getCX(a.node.pos, trackW), a.cy, getCX(b.node.pos, trackW), b.cy),
      color: active ? `${COLORS.emerald}70` : "#DEDED8",
    });
  }

  const allNodes  = ROADMAP.flatMap(l => l.nodes);
  const doneCount = allNodes.filter(n => n.state === "done").length;
  const totalXP   = allNodes.filter(n => n.state === "done").reduce((s, n) => s + n.xp, 0);
  const progress  = Math.round(doneCount / allNodes.length * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        .rm-section { padding: 4px 0 60px; }
        .rm-hdr h2 { font-family:'Playfair Display',Georgia,serif; font-size:22px; color:#0D1F2D; margin:0 0 4px; }
        .rm-hdr p  { font-family:'DM Sans',sans-serif; font-size:13px; color:#8A8A82; margin:0; }
        .rm-stats  { display:flex; gap:10px; margin:16px 0 28px; }
        .rm-stat   { flex:1; background:white; border:1px solid #EDEDEA; border-radius:14px; padding:10px 14px; text-align:center; }
        .rm-stat .val { font-family:'DM Sans',sans-serif; font-size:20px; font-weight:700; color:#0D1F2D; display:block; }
        .rm-stat .lbl { font-family:'DM Sans',sans-serif; font-size:11px; color:#8A8A82; display:block; margin-top:2px; }
      `}</style>

      <div className="rm-section" ref={containerRef}>
        <div className="rm-hdr">
          <h2>Learning Path</h2>
          <p>{allNodes.length} lessons</p>
        </div>



        <div style={{ position: "relative", width: trackW, height: totalH + 80, margin: "0 auto" }}>
          <svg width={trackW} height={totalH + 80} viewBox={`0 0 ${trackW} ${totalH + 80}`}
            style={{ position: "absolute", top: 0, left: 0 }}>

            {trackPaths.map((tp, i) => (
              <path key={i} d={tp.d} stroke={tp.color} strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}

            {layout.map((item, i) => {
              if (item.type !== "header") return null;
              const cy = item.cy;
              const cx = trackW / 2;
              return (
                <g key={i}>
                  <line x1={10} y1={cy} x2={cx - 58} y2={cy} stroke="rgba(11,73,131,0.15)" strokeWidth="1" />
                  <line x1={cx + 58} y1={cy} x2={trackW - 10} y2={cy} stroke="rgba(11,73,131,0.15)" strokeWidth="1" />
                  <rect x={cx - 54} y={cy - 13} width={108} height={26} rx={13}
                    fill="white" stroke={`${item.color}40`} strokeWidth="1.5" />
                  <circle cx={cx - 34} cy={cy} r={4} fill={item.color} />
                  <text x={cx - 24} y={cy + 4}
                    fontFamily="'DM Sans',sans-serif" fontSize="11" fontWeight="700"
                    fill={COLORS.navyMid}>
                    {item.level}
                  </text>
                </g>
              );
            })}

            <g transform={`translate(${trackW / 2}, ${totalH + 36})`}>
              <circle r="28" fill="#FFF7E0" stroke="#FFD70055" strokeWidth="2" />
              <circle r="22" fill="#FFD700" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="20">🏆</text>
            </g>
          </svg>

          {nodeItems.map(({ node, cy }) => (
            <NodeButton
              key={node.id}
              node={node}
              cx={getCX(node.pos, trackW)}
              cy={cy}
              onOpen={setActiveNode}
            />
          ))}
        </div>
      </div>

      {activeNode && <LessonModal node={activeNode} onClose={() => setActiveNode(null)} />}
    </>
  );
}