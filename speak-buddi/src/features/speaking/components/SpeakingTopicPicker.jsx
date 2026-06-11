// Màn chọn chủ đề khi vào /speaking (chưa có session)
import { useState } from "react";

const PRIMARY   = "#3525cd";
const SECONDARY = "#006c49";
const FONT      = "'Be Vietnam Pro', system-ui, sans-serif";

const SUGGESTIONS = [
  { emoji: "💬", text: "Tell me about your weekend plans" },
  { emoji: "🏠", text: "Mô tả ngôi nhà của bạn" },
  { emoji: "💼", text: "What are your career goals?" },
  { emoji: "✈️", text: "Kể về chuyến đi bạn muốn thực hiện" },
];

export default function SpeakingTopicPicker({ onStart, onShowHistory }) {
  const [prompt, setPrompt] = useState("");

  function handleStart() {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onStart(trimmed);
  }

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 40px) clamp(16px, 4vw, 24px)",
        fontFamily: FONT,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
        <h1 style={{ margin: "0 0 8px", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 700, color: "#1b1b24" }}>
          Free Speaking
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#464555", lineHeight: 1.6 }}>
          Chọn hoặc nhập chủ đề bạn muốn luyện nói. AI sẽ trò chuyện cùng bạn bằng tiếng Anh hoặc tiếng Việt.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor="speaking-topic-input"
          style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#464555", marginBottom: 8 }}
        >
          Chủ đề của bạn
        </label>
        <input
          id="speaking-topic-input"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
          placeholder="Nhập chủ đề bằng tiếng Anh hoặc tiếng Việt..."
          maxLength={120}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid #c7c4d8",
            fontSize: 15,
            fontFamily: FONT,
            outline: "none",
            background: "#ffffff",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = "#c7c4d8"; }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            type="button"
            onClick={() => setPrompt(s.text)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 999,
              border: `1.5px solid ${prompt === s.text ? SECONDARY : "#e4e1ee"}`,
              background: prompt === s.text ? "#ecfdf5" : "#ffffff",
              color: prompt === s.text ? "#065f46" : "#1b1b24",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            {s.emoji} {s.text}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!prompt.trim()}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: 14,
          border: "none",
          background: prompt.trim() ? PRIMARY : "#c7c4d8",
          color: "#ffffff",
          fontSize: 15,
          fontWeight: 700,
          cursor: prompt.trim() ? "pointer" : "not-allowed",
          fontFamily: FONT,
          minHeight: 48,
          boxShadow: prompt.trim() ? "0 4px 16px rgba(53,37,205,0.25)" : "none",
        }}
      >
        Bắt đầu nói ngay
      </button>

      {onShowHistory && (
        <button
          type="button"
          onClick={onShowHistory}
          style={{
            display: "block",
            width: "100%",
            marginTop: 12,
            padding: "12px 20px",
            borderRadius: 14,
            border: "1.5px solid #c7c4d8",
            background: "#ffffff",
            color: "#464555",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONT,
            minHeight: 44,
          }}
        >
          📋 Xem lịch sử hội thoại
        </button>
      )}
    </div>
  );
}
