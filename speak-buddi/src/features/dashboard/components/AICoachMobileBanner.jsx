import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, FONTS } from "../../../shared/constants/theme";

const SUGGESTIONS = [
  { emoji: "💬", text: "Tell me about your weekend plans" },
  { emoji: "🏠", text: "Mô tả ngôi nhà của bạn" },
  { emoji: "💼", text: "What are your career goals?" },
  { emoji: "✈️", text: "Kể về chuyến đi bạn muốn thực hiện" },
];

export default function AICoachMobileBanner() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    if (!prompt.trim()) return;
    setLaunching(true);
    setTimeout(() => {
      navigate("/speaking", {
        state: { freeTopic: { prompt: prompt.trim() } },
      });
    }, 300);
  };

  const handleSuggestion = (text) => {
    setPrompt(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLaunch();
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ai-mobile-banner">

        {/* Header */}
        <div className="ai-mb-header">
          <div className="ai-mb-icon">🤖</div>
          <div>
            <div className="ai-mb-title">Free Speaking</div>
            <div className="ai-mb-sub">
              <span className="ai-mb-dot" />
              Select any topic
            </div>
          </div>
          <a href="/speaking" className="ai-mb-full-btn">Speak</a>
        </div>

        {/* Input */}
        <div className="ai-mb-input-wrap">
          <input
            className="ai-mb-input"
            type="text"
            placeholder="Nhập chủ đề bằng tiếng Anh hoặc tiếng Việt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={120}
          />
        </div>

        {/* Suggestions */}
        <div className="ai-mb-topics">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(s.text)}
              className="ai-mb-chip"
              style={{
                border: `1.5px solid ${prompt === s.text ? COLORS.emerald : COLORS.creamDark}`,
                background: prompt === s.text ? COLORS.emeraldBg : "white",
                color: prompt === s.text ? COLORS.emeraldDark : COLORS.navy,
              }}
            >
              {s.emoji} {s.text}
            </button>
          ))}
        </div>

        {/* Launch */}
        <button
          onClick={handleLaunch}
          disabled={!prompt.trim()}
          className="ai-mb-launch"
          style={{
            background: prompt.trim()
              ? `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.emeraldLight})`
              : COLORS.creamDark,
            color: prompt.trim() ? "white" : COLORS.stoneLight,
            cursor: prompt.trim() ? "pointer" : "not-allowed",
            boxShadow: prompt.trim() ? `0 4px 14px ${COLORS.emerald}35` : "none",
          }}
        >
          {launching ? "Đang khởi động..." : " Bắt đầu nói ngay"}
        </button>

      </div>
    </>
  );
}

const CSS = `
  .ai-mobile-banner { display: none; }

  @media (max-width: 768px) {
    .ai-mobile-banner {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: white;
      border-radius: 20px;
      border: 1px solid ${COLORS.creamDark};
      padding: 16px;
      margin-bottom: 16px;
    }

    .ai-mb-header {
      display: flex; align-items: center; gap: 10px;
    }
    .ai-mb-icon {
      width: 40px; height: 40px; border-radius: 12px;
      background: ${COLORS.navy};
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .ai-mb-title {
      font-family: ${FONTS.body}; font-size: 14px;
      font-weight: 700; color: ${COLORS.navy};
    }
    .ai-mb-sub {
      display: flex; align-items: center; gap: 5px;
      font-family: ${FONTS.body}; font-size: 12px;
      color: ${COLORS.emeraldDark}; font-weight: 500;
    }
    .ai-mb-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: ${COLORS.emerald};
      box-shadow: 0 0 5px ${COLORS.emerald};
      flex-shrink: 0;
    }
    .ai-mb-full-btn {
      margin-left: auto; flex-shrink: 0;
      font-family: ${FONTS.body}; font-size: 12px;
      font-weight: 600; color: ${COLORS.emeraldDark};
      text-decoration: none;
      background: ${COLORS.emeraldBg};
      border-radius: 99px; padding: 5px 12px;
      white-space: nowrap;
    }

    /* Input */
    .ai-mb-input-wrap {
      position: relative;
    }
    .ai-mb-input {
      width: 100%;
      font-family: ${FONTS.body};
      font-size: 13.5px;
      color: ${COLORS.navy};
      background: ${COLORS.cream};
      border: 1.5px solid ${COLORS.creamDark};
      border-radius: 12px;
      padding: 11px 14px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .ai-mb-input:focus {
      border-color: ${COLORS.emerald};
      background: white;
    }
    .ai-mb-input::placeholder {
      color: ${COLORS.stoneLight};
    }

    /* Suggestions scroll */
    .ai-mb-topics {
      display: flex; gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .ai-mb-topics::-webkit-scrollbar { display: none; }

    .ai-mb-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 12px; border-radius: 99px;
      font-family: ${FONTS.body}; font-size: 12px; font-weight: 600;
      white-space: nowrap; flex-shrink: 0;
      cursor: pointer; transition: all 0.15s;
    }

    .ai-mb-launch {
      width: 100%; padding: 13px;
      border-radius: 12px; border: none;
      font-family: ${FONTS.body}; font-size: 14px; font-weight: 600;
      transition: all 0.2s;
    }
  }
`;
