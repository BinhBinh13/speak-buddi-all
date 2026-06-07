// src/features/roadmap/components/TopicModal.jsx
// ─── Modal xem topic + Add to Vocab + navigate AI/Vocab (S2.5) ───────────────
//
// Mockup tham chiếu: lo_trinh_hoc_tap_snake_style (code.html + screen.png)
// Design system: DESIGN.md (primary #3525cd, secondary #006c49, amber #f59e0b)
//
// Props:
//   node     — roadmap node { id, name, slug, level_code?, word_count, status }
//   onClose  — callback đóng modal
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTopicSessionSummary,
  startSession,
  getTopicWords,
  addUserTopic,
  removeUserTopic,
  getUserTopics,
} from "../services/sessionService";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY   = "#3525cd";
const SECONDARY = "#006c49";
const AMBER     = "#f59e0b";
const FONT      = "'Be Vietnam Pro', system-ui, sans-serif";

// ── Level badge màu theo CEFR ─────────────────────────────────────────────────
function LevelBadge({ code }) {
  const colorMap = {
    A1: { bg: "#EEF2FF", color: PRIMARY },
    A2: { bg: "#EEF2FF", color: PRIMARY },
    B1: { bg: "#EEF2FF", color: PRIMARY },
    B2: { bg: "#ECFDF5", color: SECONDARY },
    C1: { bg: "#ECFDF5", color: SECONDARY },
    C2: { bg: "#EDE9FE", color: "#4C1D95" },
  };
  const { bg, color } = colorMap[code] ?? { bg: "#EEF2FF", color: PRIMARY };
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.05em",
        borderRadius: 999,
        padding: "4px 10px",
        whiteSpace: "nowrap",
      }}
    >
      {code}
    </span>
  );
}

export default function TopicModal({ node, onClose }) {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────────
  const [batchSummary, setBatchSummary] = useState(null);
  const [isAdded, setIsAdded] = useState(false);
  const [words, setWords] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch summary + check added + words on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingInit(true);

    Promise.allSettled([
      getTopicSessionSummary(node.id),
      getUserTopics(),
      getTopicWords(node.id),
    ]).then(([summaryRes, topicsRes, wordsRes]) => {
      if (cancelled) return;

      if (summaryRes.status === "fulfilled") {
        setBatchSummary(summaryRes.value);
      }
      if (topicsRes.status === "fulfilled" && Array.isArray(topicsRes.value)) {
        setIsAdded(topicsRes.value.some((t) => t.topic_id === node.id));
      }
      if (wordsRes.status === "fulfilled" && Array.isArray(wordsRes.value)) {
        setWords(wordsRes.value);
      }
    }).finally(() => {
      if (!cancelled) setLoadingInit(false);
    });

    return () => { cancelled = true; };
  }, [node.id]);

  // ── Đóng modal bằng Esc ───────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Toggle Add/Remove ─────────────────────────────────────────────────────────
  const handleToggleAdd = useCallback(async () => {
    if (loadingAdd) return;
    const prev = isAdded;
    setIsAdded(!prev);          // optimistic update
    setLoadingAdd(true);
    try {
      if (prev) {
        await removeUserTopic(node.id);
      } else {
        await addUserTopic(node.id);
      }
    } catch {
      setIsAdded(prev);         // rollback nếu lỗi
    } finally {
      setLoadingAdd(false);
    }
  }, [isAdded, loadingAdd, node.id]);

  // ── Navigate Học từ vựng ──────────────────────────────────────────────────────
  function handleLearnVocab() {
    navigate(`/learn/${node.slug}`, { state: { topicId: node.id, topicName: node.name } });
  }

  // ── Navigate Luyện với AI ─────────────────────────────────────────────────────
  async function handlePracticeAI(forceBatchIndex = null) {
    if (loadingAI) return;
    setLoadingAI(true);
    setError(null);
    try {
      const summary = batchSummary ?? await getTopicSessionSummary(node.id);
      const batchSize  = summary.batch_size;
      const batchIndex = forceBatchIndex ?? summary.resume_batch_index ?? 0;
      const allWords   = await getTopicWords(node.id);
      const batchWords = allWords
        .slice(batchIndex * batchSize, (batchIndex + 1) * batchSize)
        .map((w) => ({
          word:             w.word,
          phonetic:         w.phonetic,
          meaning_vi:       w.meaning_vi,
          meaning_en:       w.meaning_en,
          example_sentence: w.example_sentence,
        }));

      await startSession(node.id, { batchIndex, batchSize });

      navigate("/conversation", {
        state: { topicId: node.id, topicName: node.name, batchIndex, words: batchWords },
      });
    } catch (err) {
      setError(err?.message || "Không thể bắt đầu luyện tập. Vui lòng thử lại.");
    } finally {
      setLoadingAI(false);
    }
  }

  const hasResume = batchSummary?.resume_batch_index != null;
  const totalWords = words.length || node.word_count || 0;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.48)",
          zIndex: 1040,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          fontFamily: FONT,
        }}
        aria-modal="true"
        role="dialog"
        aria-label={`Chi tiết topic: ${node.name}`}
      >
        {/* Modal card — click không bubble lên backdrop */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#ffffff",
            borderRadius: 24,
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            width: "100%",
            maxWidth: 560,
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "clamp(20px, 5vw, 32px)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "clamp(18px, 4vw, 22px)",
                    fontWeight: 700,
                    color: "#1b1b24",
                    lineHeight: 1.3,
                  }}
                >
                  {node.name}
                </h2>
                {node.level_code && <LevelBadge code={node.level_code} />}
              </div>
              <span style={{ fontSize: 13, color: "#777587" }}>
                {totalWords} từ
              </span>
            </div>

            {/* Nút X */}
            <button
              onClick={onClose}
              aria-label="Đóng"
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid #e4e1ee",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#464555",
                fontSize: 18,
                lineHeight: 1,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f0ecf9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
            >
              ×
            </button>
          </div>

          {/* ── Word list ── */}
          <div
            style={{
              maxHeight: 260,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              paddingRight: 4,
            }}
          >
            {loadingInit ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 52,
                    borderRadius: 10,
                    background: "#e4e1ee",
                    animation: "pulse 1.5s ease-in-out infinite",
                    opacity: 1 - i * 0.2,
                  }}
                />
              ))
            ) : words.length === 0 ? (
              <p style={{ fontSize: 13, color: "#777587", margin: 0, textAlign: "center", padding: "12px 0" }}>
                Chủ đề này chưa có từ vựng.
              </p>
            ) : (
              words.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#f8f7fc",
                    border: "1px solid #e4e1ee",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1b1b24", minWidth: 80 }}>
                    {w.word}
                  </span>
                  {w.phonetic && (
                    <span style={{ fontSize: 12, color: "#777587", fontStyle: "italic" }}>
                      {w.phonetic}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: "#464555", flex: 1, textAlign: "right" }}>
                    {w.meaning_vi || w.meaning_en || ""}
                  </span>
                  <button
                    onClick={() => navigate("/pronunciation", {
                      state: { word: w.word, phonetic: w.phonetic, meaning_vi: w.meaning_vi, meaning_en: w.meaning_en },
                    })}
                    title={`Luyện phát âm: ${w.word}`}
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid #c7c4d8",
                      background: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#EEF2FF";
                      e.currentTarget.style.borderColor = "#3525cd";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.borderColor = "#c7c4d8";
                    }}
                  >
                    🎙
                  </button>
                </div>
              ))
            )}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
          </div>

          {/* ── Resume banner (chỉ hiện khi có session in_progress) ── */}
          {!loadingInit && hasResume && (
            <button
              onClick={() => handlePracticeAI(batchSummary.resume_batch_index)}
              disabled={loadingAI}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 12,
                border: `2px solid ${AMBER}`,
                background: "#fffbeb",
                color: "#92400e",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                minHeight: 44,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fef3c7"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fffbeb"; }}
            >
              <span style={{ fontSize: 16 }}>▶</span>
              Tiếp tục — Phần {batchSummary.resume_batch_index + 1}
            </button>
          )}

          {/* ── Error ── */}
          {error && (
            <div
              role="alert"
              style={{
                color: "#ba1a1a",
                background: "#ffdad6",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* ── Action row ── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* Lưu topic */}
            <button
              onClick={handleToggleAdd}
              disabled={loadingAdd || loadingInit}
              style={{
                flex: 1,
                minWidth: 140,
                padding: "14px 20px",
                borderRadius: 14,
                border: isAdded ? "none" : "1px solid #e4e1ee",
                background: isAdded ? SECONDARY : "#ffffff",
                color: isAdded ? "#ffffff" : "#1b1b24",
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingAdd || loadingInit ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 48,
                opacity: loadingAdd || loadingInit ? 0.75 : 1,
                boxShadow: isAdded ? "0 4px 16px rgba(0,108,73,0.25)" : "0 2px 8px rgba(0,0,0,0.06)",
                transition: "background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loadingAdd && !loadingInit) {
                  e.currentTarget.style.background = isAdded ? "#005a3c" : "#f5f2ff";
                  if (!isAdded) e.currentTarget.style.borderColor = "#c3c0ff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isAdded ? SECONDARY : "#ffffff";
                if (!isAdded) e.currentTarget.style.borderColor = "#e4e1ee";
              }}
            >
              {isAdded ? "Đã lưu" : "Lưu topic"}
            </button>

            {/* Luyện với AI */}
            <button
              onClick={() => handlePracticeAI()}
              disabled={loadingAI}
              style={{
                flex: 1,
                minWidth: 140,
                padding: "14px 20px",
                borderRadius: 14,
                border: "none",
                background: loadingAI ? "#c7c4d8" : PRIMARY,
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingAI ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 48,
                boxShadow: loadingAI ? "none" : "0 4px 16px rgba(53,37,205,0.30)",
                transition: "background 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!loadingAI) {
                  e.currentTarget.style.background = "#2518a8";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(53,37,205,0.20)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loadingAI) {
                  e.currentTarget.style.background = PRIMARY;
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(53,37,205,0.30)";
                }
              }}
            >
              {loadingAI ? (
                <span style={{ opacity: 0.7 }}>Đang tải...</span>
              ) : (
                "Luyện với AI"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
