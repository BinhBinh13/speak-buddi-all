// src/features/quiz/QuizResultPage.jsx
// ─── Trang kết quả bài kiểm tra (S4.4) ───────────────────────────────────────
//
// Route: /quiz/:testId/result/:attemptId (Protected)
// UI tham chiếu: speak-buddi-docs/ui/ket_qua_kiem_tra_desktop/code.html
// Design system: speak-buddi-docs/ui/speak_buddi/DESIGN.md
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiArrowRight } from "react-icons/fi";
import { getAttemptResult } from "./services/quizService";

// ── Design tokens (DESIGN.md) ─────────────────────────────────────────────────
const COLOR = {
  primary: "#3525cd",
  onPrimary: "#ffffff",
  primaryFixed: "#e2dfff",
  primaryContainer: "#4f46e5",
  onPrimaryFixedVariant: "#3323cc",
  secondary: "#006c49",
  secondaryContainer: "#6cf8bb",
  onSecondaryFixed: "#002113",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  surface: "#fcf8ff",
  surfaceContainerLow: "#f5f2ff",
  surfaceContainerHigh: "#eae6f4",
  surfaceContainerHighest: "#e4e1ee",
  onSurface: "#1b1b24",
  onSurfaceVariant: "#464555",
  outline: "#777587",
  outlineVariant: "#c7c4d8",
};

// ── Motivational message theo score ──────────────────────────────────────────
function getMotivationalMessage(score) {
  if (score >= 90) return "Xuất sắc! Bạn thành thạo chủ đề này rồi!";
  if (score >= 70) return "Làm tốt lắm! Bạn đang tiến bộ rất nhanh.";
  if (score >= 50) return "Khá tốt! Hãy ôn lại các câu sai.";
  return "Cần luyện thêm! Đừng nản nhé.";
}

// ── Format thời gian làm bài ──────────────────────────────────────────────────
function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}p ${s}s`;
}

// ── ScoreCircle: CSS conic-gradient ──────────────────────────────────────────
function ScoreCircle({ scorePercent }) {
  const angle = Math.round((scorePercent / 100) * 360);
  return (
    <div
      style={{
        width: 192,
        height: 192,
        borderRadius: "50%",
        background: `conic-gradient(${COLOR.secondary} ${angle}deg, ${COLOR.surfaceContainerHigh} 0deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(0,108,73,0.15)",
        animation: "popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      }}
    >
      {/* Inner white circle */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: COLOR.surface,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: COLOR.onSurface,
            lineHeight: 1.1,
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}
        >
          {Math.round(scorePercent)}%
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: COLOR.onSurfaceVariant,
            letterSpacing: "0.05em",
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}
        >
          Điểm số
        </span>
      </div>
    </div>
  );
}

// ── StatsRow: 3 cột đúng / sai / tổng ────────────────────────────────────────
function StatsRow({ correct, wrong, total }) {
  const stats = [
    { icon: <FiCheckCircle size={22} color={COLOR.secondary} />, value: correct, label: "Đúng", iconColor: COLOR.secondary },
    { icon: <FiXCircle size={22} color={COLOR.error} />, value: wrong, label: "Sai", iconColor: COLOR.error },
    { icon: <span style={{ fontSize: 20, color: COLOR.primary, fontWeight: 700 }}>≡</span>, value: total, label: "Tổng", iconColor: COLOR.primary },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12,
        width: "100%",
        maxWidth: 448,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: COLOR.surfaceContainerLow,
            borderRadius: 12,
            padding: "16px 8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          {s.icon}
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: COLOR.onSurface,
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            {s.value}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLOR.onSurfaceVariant,
              letterSpacing: "0.05em",
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── ReviewCard: 1 câu hỏi trong review list ───────────────────────────────────
function ReviewCard({ answer }) {
  const isCorrect = answer.is_correct;
  const isFlashcard = answer.question_type === "flashcard";
  const isFillBlank = answer.question_type === "fill_blank";

  const borderColor = isCorrect ? COLOR.secondaryContainer : COLOR.errorContainer;
  const accentColor = isCorrect ? COLOR.secondary : COLOR.error;

  // Nội dung đáp án hiển thị
  const renderAnswerSection = () => {
    if (isFlashcard) {
      return (
        <span
          style={{
            fontSize: 13,
            color: COLOR.onSurfaceVariant,
            fontStyle: "italic",
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}
        >
          Tự đánh giá
        </span>
      );
    }

    if (isCorrect) {
      // Hiển thị đáp án đúng
      const displayText = isFillBlank
        ? (answer.user_text_answer || answer.correct_answer_text)
        : answer.correct_answer_text;

      return (
        <div
          style={{
            background: `${COLOR.secondaryContainer}33`,
            borderRadius: 8,
            padding: "8px 12px",
            display: "inline-block",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: COLOR.onSecondaryFixed,
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            {displayText || "—"}
          </span>
        </div>
      );
    }

    // Sai: hiển thị user answer (gạch đỏ) → correct answer (xanh)
    const userDisplay = isFillBlank
      ? answer.user_text_answer
      : null; // multiple_choice: không có text dễ đọc, bỏ qua user choice text

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {userDisplay && (
          <>
            <div
              style={{
                background: `${COLOR.errorContainer}4d`,
                borderRadius: 8,
                padding: "8px 12px",
                textDecoration: "line-through",
                opacity: 0.7,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: COLOR.onErrorContainer,
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                }}
              >
                {userDisplay}
              </span>
            </div>
            <FiArrowRight size={16} color={COLOR.outline} />
          </>
        )}
        {answer.correct_answer_text && (
          <div
            style={{
              background: `${COLOR.secondaryContainer}33`,
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: COLOR.onSecondaryFixed,
                fontFamily: "'Be Vietnam Pro', sans-serif",
              }}
            >
              {answer.correct_answer_text}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        background: COLOR.surface,
        borderRadius: 16,
        border: `1px solid ${borderColor}`,
        padding: "20px 20px 20px 24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: isCorrect
          ? "0 4px 12px rgba(0,108,73,0.04)"
          : "0 4px 12px rgba(186,26,26,0.04)",
      }}
    >
      {/* Border left accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          background: accentColor,
          borderRadius: "4px 0 0 4px",
        }}
      />

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Icon */}
        <div style={{ marginTop: 2, flexShrink: 0 }}>
          {isCorrect
            ? <FiCheckCircle size={22} color={COLOR.secondary} />
            : <FiXCircle size={22} color={COLOR.error} />
          }
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: COLOR.onSurface,
              margin: "0 0 12px",
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            {answer.question_text}
          </p>
          {renderAnswerSection()}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const pulse = {
    background: COLOR.surfaceContainerHigh,
    borderRadius: 8,
    animation: "pulse 1.4s ease-in-out infinite",
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        width: "100%",
        maxWidth: 480,
        padding: "40px 0",
      }}
    >
      <div style={{ ...pulse, width: 192, height: 192, borderRadius: "50%" }} />
      <div style={{ ...pulse, width: "60%", height: 24 }} />
      <div style={{ ...pulse, width: "80%", height: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, width: "100%", maxWidth: 448 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...pulse, height: 80, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QuizResultPage() {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // retryKey được tăng khi user nhấn "Thử lại" → trigger useEffect fetch lại
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => setRetryKey((k) => k + 1);

  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAttemptResult(attemptId);
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Không thể tải kết quả. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [attemptId, retryKey]);

  return (
    <>
      {/* keyframe animations */}
      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: COLOR.surface,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 16px 64px",
          fontFamily: "'Be Vietnam Pro', sans-serif",
          position: "relative",
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: "fixed",
            top: "-20%",
            left: "-10%",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background: "#e2dfff",
            opacity: 0.4,
            filter: "blur(100px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "fixed",
            bottom: "-20%",
            right: "-10%",
            width: "40vw",
            height: "40vw",
            borderRadius: "50%",
            background: "#ffdbcc",
            opacity: 0.3,
            filter: "blur(80px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Main content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 640,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          {/* Page heading */}
          <div
            style={{
              width: "100%",
              background: `${COLOR.surfaceContainerLow}`,
              borderRadius: 16,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 56, lineHeight: 1 }}>🎉</div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: COLOR.primary,
                margin: 0,
                textAlign: "center",
              }}
            >
              Hoàn thành!
            </h1>
          </div>

          {/* Loading / Error / Result */}
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div
              style={{
                background: COLOR.errorContainer,
                borderRadius: 12,
                padding: "20px 24px",
                textAlign: "center",
                width: "100%",
                maxWidth: 448,
              }}
            >
              <p style={{ color: COLOR.onErrorContainer, margin: "0 0 16px", fontSize: 15 }}>
                {error}
              </p>
              <button
                onClick={handleRetry}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: `1px solid ${COLOR.error}`,
                  background: "transparent",
                  color: COLOR.error,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                }}
              >
                Thử lại
              </button>
            </div>
          ) : result ? (
            <>
              {/* Score circle */}
              <ScoreCircle scorePercent={result.score_percent} />

              {/* Motivational message */}
              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.6,
                  color: COLOR.onSurface,
                  textAlign: "center",
                  margin: 0,
                  maxWidth: 400,
                }}
              >
                {getMotivationalMessage(result.score_percent)}
              </p>

              {/* Duration (optional) */}
              {result.duration_seconds != null && (
                <p
                  style={{
                    fontSize: 13,
                    color: COLOR.onSurfaceVariant,
                    margin: 0,
                  }}
                >
                  Thời gian: {formatDuration(result.duration_seconds)}
                </p>
              )}

              {/* Stats row */}
              <StatsRow
                correct={result.correct_answers}
                wrong={result.wrong_answers}
                total={result.total_questions}
              />

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                  width: "100%",
                  maxWidth: 448,
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => navigate(`/quiz/${testId}`)}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: `2px solid ${COLOR.primary}`,
                    background: "transparent",
                    color: COLOR.primary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 52,
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = COLOR.primaryFixed)}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <FiRefreshCw size={16} />
                  Làm lại
                </button>
                <button
                  onClick={() => navigate(-2)}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: COLOR.primary,
                    color: COLOR.onPrimary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 52,
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    boxShadow: "0 8px 24px rgba(53,37,205,0.2)",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = COLOR.onPrimaryFixedVariant)}
                  onMouseOut={(e) => (e.currentTarget.style.background = COLOR.primary)}
                >
                  <FiArrowRight size={16} />
                  Tiếp tục học
                </button>
              </div>

              {/* Link về lộ trình */}
              <button
                onClick={() => navigate("/roadmap")}
                style={{
                  background: "none",
                  border: "none",
                  color: COLOR.primary,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                }}
              >
                Về lộ trình
              </button>

              {/* Review list */}
              {result.answers && result.answers.length > 0 && (
                <div style={{ width: "100%", maxWidth: 640 }}>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: COLOR.onSurface,
                      margin: "0 0 16px",
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                    }}
                  >
                    Xem lại câu hỏi
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {result.answers.map((a, idx) => (
                      <ReviewCard key={`${a.question_id}-${idx}`} answer={a} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
