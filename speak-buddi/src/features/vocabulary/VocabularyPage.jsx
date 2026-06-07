// src/features/vocabulary/VocabularyPage.jsx
// ─── Màn hình học từ vựng theo level/topic (S3.2) ────────────────────────────
//
// Bám mockup: hoc_tu_vung_desktop (speak-buddi-docs/ui/)
// Design system: DESIGN.md (primary #3525cd, secondary #006c49, font Be Vietnam Pro)
//
// Hai state chính:
//   1. Topic selector — dropdown level + grid TopicCard
//   2. Flashcard learn — header + flashcard + nav + action buttons
//
// State management: useState/useEffect cục bộ (pattern từ SpeakingPage)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../shared/components/AppLayout";
import TopicCard from "./components/TopicCard";
import Flashcard from "./components/Flashcard";
import { getWords, saveWordProgress, getTopicProgress } from "./services/vocabularyService";
import { getUserTopics } from "../roadmap/services/sessionService";
import { getTestsByTopic } from "../quiz/services/quizService";
import { BsArrowLeft, BsArrowRight, BsQuestionCircle } from "react-icons/bs";
import { authenticatedFetch } from "../../shared/api/authMiddleware";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: phát audio từ URL hoặc fallback /tts
// ─────────────────────────────────────────────────────────────────────────────

async function playWordAudio(word) {
  try {
    let audioUrl = word.audio_url;

    if (!audioUrl) {
      const res = await authenticatedFetch("/tts", {
        method: "POST",
        body: JSON.stringify({ text: word.word }),
      });
      if (!res || !res.ok) return;
      const blob = await res.blob();
      audioUrl = URL.createObjectURL(blob);
    }

    const audio = new Audio(audioUrl);
    audio.play().catch(() => {});
  } catch {
    // ignore audio errors — không critical
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton cho topic grid
// ─────────────────────────────────────────────────────────────────────────────
function TopicGridSkeleton() {
  return (
    <div className="row g-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="col-12 col-md-6">
          <div
            style={{
              background: "#e4e1ee",
              borderRadius: 16,
              height: 80,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VocabularyPage
// ─────────────────────────────────────────────────────────────────────────────
export default function VocabularyPage() {
  const navigate = useNavigate();
  // ── Route param: /learn/:topicSlug (S2.5) ───────────────────────────────
  const { topicSlug } = useParams();

  // ── Data state ──────────────────────────────────────────────────────────
  // S2.5: thay levels+topics bằng userTopics từ GET /api/user/topics
  const [userTopics, setUserTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Progress state (S3.3) ───────────────────────────────────────────────
  // progressMap: { [wordId]: 'known' | 'learning' } — hydrate từ API, cập nhật optimistic
  const [progressMap, setProgressMap] = useState({});
  // knownCount: số từ đã known trong topic hiện tại — dùng cho progress bar
  const [knownCount, setKnownCount] = useState(0);

  // ── UI state ────────────────────────────────────────────────────────────
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [error, setError] = useState(null);

  // Prevent double-fetch in StrictMode
  const fetchTopicsRef = useRef(null);

  // ── Open topic → load words + hydrate progress (S3.3) ───────────────────
  const handleSelectTopic = useCallback(async (topic) => {
    // topic từ UserTopicOut có topic_id thay vì id
    const topicId = topic.id ?? topic.topic_id;
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setWords([]);
    setProgressMap({});
    setKnownCount(0);
    setLoadingWords(true);
    setError(null);
    try {
      const [wordsData, progressData] = await Promise.allSettled([
        getWords(topicId),
        getTopicProgress(topicId),
      ]);

      const wordList = wordsData.status === "fulfilled" ? (wordsData.value ?? []) : [];
      setWords(wordList);

      if (wordsData.status === "rejected") {
        setError(wordsData.reason?.message || "Không thể tải từ vựng.");
        setSelectedTopic(null);
        return;
      }

      // Hydrate progressMap từ API response (S3.3)
      // progressData có thể thất bại (user mới, chưa có progress) → im lặng, không chặn UX
      if (progressData.status === "fulfilled" && progressData.value?.words) {
        const map = {};
        let known = 0;
        for (const w of progressData.value.words) {
          map[w.topic_word_id] = w.status;
          if (w.status === "known") known++;
        }
        setProgressMap(map);
        setKnownCount(known);
      }
    } finally {
      setLoadingWords(false);
    }
  }, []);

  // ── Load user topics on mount (S2.5) ────────────────────────────────────
  // Đặt sau handleSelectTopic để có thể gọi khi auto-select theo topicSlug
  useEffect(() => {
    let cancelled = false;
    fetchTopicsRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingTopics(true);

    getUserTopics()
      .then((data) => {
        if (cancelled) return;
        const topics = data ?? [];
        setUserTopics(topics);

        // Nếu có topicSlug từ route (/learn/:topicSlug) → auto-select
        if (topicSlug) {
          const matched = topics.find((t) => t.topic_slug === topicSlug);
          if (matched) handleSelectTopic(matched);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải danh sách chủ đề. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTopics(false);
      });
    return () => { cancelled = true; };
  }, [topicSlug, handleSelectTopic]);

  // ── Navigation handlers ──────────────────────────────────────────────────
  function handlePrev() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    setCurrentIndex((i) => Math.min(words.length - 1, i + 1));
  }

  // ── Progress action handlers (S3.3) ─────────────────────────────────────

  /**
   * Đánh dấu từ hiện tại là 'learning' (cần luyện thêm).
   * Optimistic update progressMap ngay lập tức; gọi API async (im lặng nếu lỗi).
   */
  function handleNeedPractice() {
    if (!currentWord || !selectedTopic) {
      handleNext();
      return;
    }
    const wordId = currentWord.id;
    const prevStatus = progressMap[wordId];

    // Optimistic update: cập nhật map + knownCount trước khi API trả lời
    setProgressMap((prev) => ({ ...prev, [wordId]: "learning" }));
    if (prevStatus === "known") {
      setKnownCount((c) => Math.max(0, c - 1));
    }

    // Gọi API async — không chặn UX học
    const topicId = selectedTopic.id ?? selectedTopic.topic_id;
    saveWordProgress(topicId, wordId, "learning").catch(() => {
      // Rollback optimistic update nếu API lỗi
      setProgressMap((prev) => {
        const next = { ...prev };
        if (prevStatus === undefined) {
          delete next[wordId];
        } else {
          next[wordId] = prevStatus;
        }
        return next;
      });
      if (prevStatus === "known") {
        setKnownCount((c) => c + 1);
      }
    });

    handleNext();
  }

  /**
   * Đánh dấu từ hiện tại là 'known' (đã thuộc).
   * Optimistic update progressMap ngay lập tức; gọi API async (im lặng nếu lỗi).
   */
  function handleKnow() {
    if (!currentWord || !selectedTopic) {
      handleNext();
      return;
    }
    const wordId = currentWord.id;
    const prevStatus = progressMap[wordId];

    // Optimistic update: cập nhật map + knownCount trước khi API trả lời
    setProgressMap((prev) => ({ ...prev, [wordId]: "known" }));
    if (prevStatus !== "known") {
      setKnownCount((c) => c + 1);
    }

    // Gọi API async — không chặn UX học
    const topicIdKnow = selectedTopic.id ?? selectedTopic.topic_id;
    saveWordProgress(topicIdKnow, wordId, "known").catch(() => {
      // Rollback optimistic update nếu API lỗi
      setProgressMap((prev) => {
        const next = { ...prev };
        if (prevStatus === undefined) {
          delete next[wordId];
        } else {
          next[wordId] = prevStatus;
        }
        return next;
      });
      if (prevStatus !== "known") {
        setKnownCount((c) => Math.max(0, c - 1));
      }
    });

    handleNext();
  }

  function handleBack() {
    setSelectedTopic(null);
    setWords([]);
    setCurrentIndex(0);
    setProgressMap({});
    setKnownCount(0);
    setError(null);
  }

  // ── Derive level code from selectedTopic (UserTopicOut has level_code) ──
  const levelCode = selectedTopic?.level_code ?? selectedTopic?.level ?? null;

  // ── Quiz navigation (S4.2) ───────────────────────────────────────────────
  async function handleGoToQuiz() {
    if (!selectedTopic || loadingWords || words.length === 0 || loadingQuiz) return;
    setLoadingQuiz(true);
    try {
      const topicId = selectedTopic.id ?? selectedTopic.topic_id;
      const tests = await getTestsByTopic(topicId);
      if (!tests || tests.length === 0) {
        alert("Chủ đề này chưa có bài kiểm tra. Vui lòng thử lại sau.");
        return;
      }
      navigate(`/quiz/${tests[0].id}`);
    } catch {
      alert("Không thể tải bài kiểm tra. Vui lòng thử lại.");
    } finally {
      setLoadingQuiz(false);
    }
  }

  // ── Current word ────────────────────────────────────────────────────────
  const currentWord = words[currentIndex] ?? null;
  const totalWords = words.length;
  // S3.3: progress bar dựa trên số từ đã known (AC-05-03) thay vì vị trí flashcard
  const progressPct = totalWords > 0 ? Math.round((knownCount / totalWords) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Flashcard learn mode
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedTopic) {
    return (
      <AppLayout>
        <div
          style={{
            minHeight: "calc(100vh - 60px)",
            padding: "24px 16px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              width: "100%",
              maxWidth: 672,
              marginBottom: 24,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Title row */}
            <div className="d-flex align-items-center justify-content-between">
              <button
                onClick={handleBack}
                aria-label="Quay lại"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e1ee",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  color: "#464555",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f0ecf9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
              >
                <BsArrowLeft size={18} />
              </button>

              <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
                <h1
                  style={{
                    fontSize: "clamp(20px, 4vw, 28px)",
                    fontWeight: 700,
                    color: "#1b1b24",
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {selectedTopic.name ?? selectedTopic.topic_name}
                </h1>
                <div className="d-flex align-items-center justify-content-center gap-2 mt-1">
                  {levelCode && (
                    <span
                      style={{
                        background: "#EEF2FF",
                        color: "#3525cd",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        borderRadius: 999,
                        padding: "3px 10px",
                      }}
                    >
                      {levelCode}
                    </span>
                  )}
                  {!loadingWords && totalWords > 0 && (
                    <span style={{ fontSize: 13, color: "#464555" }}>
                      {totalWords} từ
                    </span>
                  )}
                </div>
              </div>

              {/* Spacer to center title */}
              <div style={{ width: 44, flexShrink: 0 }} />
            </div>

            {/* Progress bar */}
            {!loadingWords && totalWords > 0 && (
              <>
                <div
                  style={{
                    width: "100%",
                    height: 10,
                    borderRadius: 999,
                    background: "#e4e1ee",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPct}%`,
                      height: "100%",
                      background: "#3525cd",
                      borderRadius: 999,
                      transition: "width 0.4s ease-out",
                    }}
                  />
                </div>
                <div
                  className="d-flex justify-content-between"
                  style={{ fontSize: 12, color: "#464555", fontWeight: 600, letterSpacing: "0.05em" }}
                >
                  {/* Vị trí hiện tại (điều hướng) */}
                  <span>{currentIndex + 1} / {totalWords} từ</span>
                  {/* Tiến độ thuộc (S3.3 AC-05-03) */}
                  <span>Đã thuộc: {knownCount}/{totalWords} ({progressPct}%)</span>
                </div>
              </>
            )}
          </div>

          {/* ── Loading words ── */}
          {loadingWords && (
            <div
              style={{
                width: "100%",
                maxWidth: 672,
                background: "#e4e1ee",
                borderRadius: 32,
                height: 320,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
            </div>
          )}

          {/* ── Error state ── */}
          {error && !loadingWords && (
            <div
              style={{
                color: "#ba1a1a",
                background: "#ffdad6",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 14,
                maxWidth: 672,
                width: "100%",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Empty words state ── */}
          {!loadingWords && !error && totalWords === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#464555",
                fontSize: 15,
                padding: "40px 20px",
                maxWidth: 400,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={{ margin: 0 }}>Chủ đề này chưa có từ vựng nào.</p>
            </div>
          )}

          {/* ── Flashcard ── */}
          {!loadingWords && !error && currentWord && (
            <>
              {/* Flashcard trung tâm */}
              <div style={{ width: "100%", maxWidth: 672 }}>
                <Flashcard
                  key={currentWord.id}
                  word={currentWord}
                  onAudioPlay={playWordAudio}
                  onPronunciation={(w) => navigate("/pronunciation", {
                    state: { word: w.word, phonetic: w.phonetic, meaning_vi: w.meaning_vi, meaning_en: w.meaning_en },
                  })}
                  progressStatus={progressMap[currentWord.id] ?? null}
                />
              </div>

              {/* Navigation prev/next */}
              <div
                className="d-flex align-items-center justify-content-center gap-3 w-100"
                style={{ maxWidth: 672, marginTop: 16 }}
              >
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 16px",
                    border: "1px solid #c7c4d8",
                    borderRadius: 12,
                    background: currentIndex === 0 ? "#f5f2ff" : "#ffffff",
                    color: currentIndex === 0 ? "#c7c4d8" : "#464555",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    minHeight: 44,
                    transition: "background 0.15s",
                  }}
                >
                  <BsArrowLeft size={16} />
                  Trước
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= totalWords - 1}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 16px",
                    border: "1px solid #c7c4d8",
                    borderRadius: 12,
                    background: currentIndex >= totalWords - 1 ? "#f5f2ff" : "#ffffff",
                    color: currentIndex >= totalWords - 1 ? "#c7c4d8" : "#464555",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: currentIndex >= totalWords - 1 ? "not-allowed" : "pointer",
                    minHeight: 44,
                    transition: "background 0.15s",
                  }}
                >
                  Tiếp theo
                  <BsArrowRight size={16} />
                </button>
              </div>

              {/* Action buttons: "Cần luyện thêm" + "Đã thuộc" — bám mockup */}
              <div
                className="row g-3 w-100"
                style={{ maxWidth: 672, marginTop: 8 }}
              >
                <div className="col-6">
                  <button
                    onClick={handleNeedPractice}
                    style={{
                      width: "100%",
                      padding: "16px 12px",
                      borderRadius: 16,
                      border: "2px solid #c7c4d8",
                      background: "transparent",
                      color: "#464555",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      minHeight: 44,
                      transition: "border-color 0.15s, background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#f59e0b";
                      e.currentTarget.style.background = "#fffbeb";
                      e.currentTarget.style.color = "#b45309";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#c7c4d8";
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#464555";
                    }}
                  >
                    <span style={{ fontSize: 20 }}>📚</span>
                    Cần luyện thêm
                  </button>
                </div>
                <div className="col-6">
                  <button
                    onClick={handleKnow}
                    style={{
                      width: "100%",
                      padding: "16px 12px",
                      borderRadius: 16,
                      border: "none",
                      background: "#059669",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      minHeight: 44,
                      boxShadow: "0 4px 14px rgba(5,150,105,0.39)",
                      transition: "background 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#047857";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(5,150,105,0.23)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#059669";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(5,150,105,0.39)";
                    }}
                  >
                    <span style={{ fontSize: 20 }}>✅</span>
                    Đã thuộc
                  </button>
                </div>
              </div>

              {/* Bottom CTA: Làm bài kiểm tra (S4.2) */}
              <div style={{ marginTop: 24, maxWidth: 672, width: "100%" }}>
                <div className="d-flex justify-content-center">
                  <button
                    onClick={handleGoToQuiz}
                    disabled={loadingWords || words.length === 0 || loadingQuiz}
                    title={
                      loadingWords || words.length === 0
                        ? "Cần có từ vựng để làm bài kiểm tra"
                        : "Làm bài kiểm tra cho chủ đề này"
                    }
                    style={{
                      padding: "12px 32px",
                      borderRadius: 999,
                      border: "none",
                      background:
                        loadingWords || words.length === 0 || loadingQuiz
                          ? "#e4e1ee"
                          : "#3525cd",
                      color:
                        loadingWords || words.length === 0 || loadingQuiz
                          ? "#777587"
                          : "#ffffff",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor:
                        loadingWords || words.length === 0 || loadingQuiz
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 48,
                      boxShadow:
                        loadingWords || words.length === 0 || loadingQuiz
                          ? "none"
                          : "0 4px 12px rgba(53,37,205,0.25)",
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingWords && words.length > 0 && !loadingQuiz) {
                        e.currentTarget.style.background = "#2a1fb0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingWords && words.length > 0 && !loadingQuiz) {
                        e.currentTarget.style.background = "#3525cd";
                      }
                    }}
                  >
                    <BsQuestionCircle size={18} />
                    {loadingQuiz ? "Đang tải..." : "Làm bài kiểm tra"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Topic selector mode (S2.5: hiện userTopics thay vì level dropdown)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div
        style={{
          minHeight: "calc(100vh - 60px)",
          padding: "24px 16px 48px",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        {/* ── Page header ── */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: "clamp(22px, 4vw, 30px)",
              fontWeight: 700,
              color: "#1b1b24",
              marginBottom: 6,
            }}
          >
            Từ vựng của tôi
          </h1>
          <p style={{ fontSize: 15, color: "#464555", margin: 0 }}>
            Các chủ đề bạn đã thêm từ lộ trình học.
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            style={{
              color: "#ba1a1a",
              background: "#ffdad6",
              borderRadius: 12,
              padding: "12px 20px",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Topic grid ── */}
        {loadingTopics ? (
          <TopicGridSkeleton />
        ) : userTopics.length === 0 && !error ? (
          /* Empty state (S2.5): CTA "Vào Lộ trình để thêm topic" */
          <div
            style={{
              textAlign: "center",
              color: "#464555",
              fontSize: 15,
              padding: "48px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 48 }}>📚</div>
            <p style={{ margin: 0, fontWeight: 500 }}>
              Bạn chưa thêm chủ đề nào.
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "#777587" }}>
              Vào lộ trình học để chọn chủ đề phù hợp với bạn.
            </p>
            <Link
              to="/roadmap"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 12,
                background: "#3525cd",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                minHeight: 44,
                boxShadow: "0 4px 14px rgba(53,37,205,0.30)",
              }}
            >
              Vào Lộ trình
            </Link>
          </div>
        ) : (
          <div className="row g-3">
            {userTopics.map((topic) => (
              <div key={topic.topic_id} className="col-12 col-md-6">
                <TopicCard
                  topic={{
                    id:          topic.topic_id,
                    name:        topic.topic_name,
                    slug:        topic.topic_slug,
                    word_count:  topic.total_words,
                    description: null,
                  }}
                  level={{ code: topic.level_code, name: topic.level_name }}
                  onClick={() => handleSelectTopic(topic)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
