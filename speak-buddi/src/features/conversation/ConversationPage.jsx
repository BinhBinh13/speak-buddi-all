// src/features/conversation/ConversationPage.jsx
// ─── Màn hội thoại AI thật (S7.1) ────────────────────────────────────────────
//
// Nhận từ location.state (từ TopicModal / S2.5):
//   { topicName, batchIndex, words[], topicId }
//
// Flow:
//   1. Mount → auto gọi /speak với context GREETING_MODE để AI chào.
//   2. User nhập text → gửi → push user message → gọi API → push AI message.
//   3. Lỗi Anthropic 502 → banner đỏ + giữ message + nút "Thử lại".
//   4. TTS lỗi (200 JSON) → push AI message bình thường + ttsError=true.
//
// UI bám mockup hoi_thoai_ai_desktop + DESIGN.md:
//   - Header: tên topic + nút quay lại
//   - Vùng chat scroll dọc (user phải, AI trái)
//   - Vocab panel bên phải (ẩn <1024px)
//   - Input area cuối màn
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { sendMessage } from "./services/conversationService";
import { getQuotaStatus } from "./services/quotaService";
import {
  loadConversationState,
  saveConversationState,
  clearConversationState,
  flushConversationState,
} from "./services/conversationStorage";
import { completeSession, getTopicWords, startSession } from "../roadmap/services/sessionService";
import { createSpeechRecognizer, detectSpeechLang } from "../speaking/services/speechService";
import ChatBubble from "./components/ChatBubble";
import VocabPanel from "./components/VocabPanel";

// ── Design tokens (DESIGN.md) ─────────────────────────────────────────────────
const C = {
  primary:             "#3525cd",
  onPrimary:           "#ffffff",
  surface:             "#fcf8ff",
  surfaceContainer:    "#f0ecf9",
  surfaceLowest:       "#ffffff",
  onSurface:           "#1b1b24",
  onSurfaceVariant:    "#464555",
  outline:             "#777587",
  outlineVariant:      "#c7c4d8",
  secondary:           "#006c49",
  error:               "#ba1a1a",
  errorContainer:      "#ffdad6",
  primaryContainer:    "#4f46e5",
  onPrimaryContainer:  "#dad7ff",
  warning:             "#f59e0b",
  warningContainer:    "#fef3c7",
  onWarning:           "#78350f",
};

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

const HEADER_H = 64; // px — chiều cao header cố định

// ── Util: build topic payload cho /speak ──────────────────────────────────────
function buildTopicPayload(topicName, words) {
  if (!topicName) return null;
  const wordStrings = words.map((w) => (typeof w === "string" ? w : w.word ?? ""));
  const wordDetails = words
    .filter((w) => typeof w === "object" && w !== null)
    .map((w) => ({
      word:       w.word       ?? "",
      meaning_vi: w.meaning_vi ?? null,
      example:    w.example_sentence ?? null,
    }));
  return {
    label: topicName,
    words: wordStrings,
    ...(wordDetails.length > 0 && { word_details: wordDetails }),
  };
}

// ── Util: scan messages tìm từ đã được nhắc (case-insensitive, whole-word) ────
const WORD_BOUNDARY = (w) => new RegExp(`(?<![a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`, "i");

function detectCoveredWords(messages, batchWords) {
  const allText = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ");
  return new Set(
    batchWords
      .map((w) => (typeof w === "string" ? w : w.word ?? "").toLowerCase())
      .filter((w) => w && WORD_BOUNDARY(w).test(allText))
  );
}

/** Từ xuất hiện trong toàn bộ hội thoại (user + AI) — hiển thị tracking */
function detectMentionedWords(messages, batchWords) {
  const allText = messages.map((m) => m.content).join(" ");
  return new Set(
    batchWords
      .map((w) => (typeof w === "string" ? w : w.word ?? "").toLowerCase())
      .filter((w) => w && WORD_BOUNDARY(w).test(allText))
  );
}

const COMPLETION_THRESHOLD = 0.8; // 80% từ xuất hiện → batch done

// ── Loading dots indicator ────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div
      style={{
        alignSelf:           "flex-start",
        display:             "flex",
        gap:                 6,
        padding:             "12px 16px",
        background:          C.surfaceLowest,
        border:              `1px solid ${C.outlineVariant}`,
        borderRadius:        "1rem",
        borderTopLeftRadius: "4px",
        marginLeft:          52,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display:      "block",
            width:        8,
            height:       8,
            borderRadius: "50%",
            background:   C.primary,
            animation:    `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%           { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}

// ── ConversationPage ──────────────────────────────────────────────────────────
export default function ConversationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state    = location.state ?? {};

  // Dữ liệu truyền từ TopicModal (S2.5)
  const { topicName = "", words = [], topicId = null, batchIndex = 0 } = state;
  const batchSize = words.length;

  // ── State ─────────────────────────────────────────────────────────────────
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [errorBanner,   setErrorBanner]   = useState(null);
  const [retryPayload,  setRetryPayload]  = useState(null);
  // S7.2: quota state
  const [quota,         setQuota]         = useState(null);
  const [quotaBanner,   setQuotaBanner]   = useState(null);
  // Batch completion tracking
  const [coveredWords,  setCoveredWords]  = useState(new Set());
  const [mentionedWords, setMentionedWords] = useState(new Set());
  const [batchDone,     setBatchDone]     = useState(false);
  const completionCalled = useRef(false);

  const chatEndRef           = useRef(null);
  const activeAudioRef       = useRef(null);
  const recognitionRef       = useRef(null);
  const micTranscriptRef     = useRef("");
  const micInterimRef        = useRef("");
  const messagesRef          = useRef([]);
  const loadingRef           = useRef(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [greetingRetry, setGreetingRetry] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const [restoring, setRestoring] = useState(true);

  function stopActiveAudio() {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
  }

  function stopSpeechRecognition() {
    const rec = recognitionRef.current;
    if (rec) {
      rec.manualStopRequested = true;
      try {
        rec.stopManually?.();
      } catch {
        try { rec.stop(); } catch { /* ignore */ }
      }
    }
    recognitionRef.current = null;
    setIsListening(false);
  }

  function stopAllMedia() {
    stopActiveAudio();
    stopSpeechRecognition();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  function playAiAudio(url) {
    stopActiveAudio();
    const audio = new Audio(url);
    activeAudioRef.current = audio;
    audio.onended = () => {
      if (activeAudioRef.current === audio) activeAudioRef.current = null;
    };
    audio.play().catch(() => {});
  }

  // Dọn audio/mic khi rời màn
  useEffect(() => () => stopAllMedia(), []);

  // ── Auto-scroll khi có tin nhắn / đang loading ───────────────────────────
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, batchDone]);

  // ── Fetch quota khi mount (S7.2) ──────────────────────────────────────────
  useEffect(() => {
    getQuotaStatus()
      .then((data) => setQuota(data))
      .catch(() => {
        // Không có quota (user chưa đăng nhập hoặc lỗi) — bỏ qua, không block UI
      });
  }, []);

  // ── Theo dõi từ + lưu hội thoại ───────────────────────────────────────────
  useEffect(() => {
    if (words.length === 0 || messages.length === 0) return;

    const covered = detectCoveredWords(messages, words);
    const mentioned = detectMentionedWords(messages, words);
    setCoveredWords(covered);
    setMentionedWords(mentioned);

    if (topicId) {
      saveConversationState(topicId, batchIndex, {
        messages,
        coveredWords: covered,
        batchDone,
      });
    }

    if (batchDone || completionCalled.current) return;
    const needed = Math.ceil(words.length * COMPLETION_THRESHOLD);
    if (covered.size >= needed && topicId) {
      completionCalled.current = true;
      completeSession(topicId, { batchIndex, batchSize }).catch(() => {});
      setBatchDone(true);
    }
  }, [messages, batchDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build history array để gửi lên API ────────────────────────────────────
  function buildHistory(msgs) {
    return msgs.map((m) => ({
      role:    m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));
  }

  // ── Gọi sendMessage, nhận kết quả và cập nhật state ─────────────────────────
  async function processResult(payload, { isGreeting = false, currentMessages, getIsActive = () => true }) {
    if (!getIsActive()) return;
    setLoading(true);
    setErrorBanner(null);
    try {
      const result = await sendMessage(payload);
      if (!getIsActive()) return;

      const aiMsg = {
        id:       Date.now(),
        role:     "assistant",
        content:  result.replyText,
        audioUrl: result.audioUrl ?? null,
        ttsError: result.ttsError ?? false,
      };

      setMessages((prev) => (isGreeting ? [aiMsg] : [...prev, aiMsg]));

      // Auto-play audio nếu có (AC F10)
      if (result.audioUrl) {
        playAiAudio(result.audioUrl);
      }

      setRetryPayload(null);
      if (isGreeting) setGreetingRetry(null);
    } catch (err) {
      if (!getIsActive()) return;
      if (err.status === 429) {
        // Quota hết (S7.2): hiện banner cảnh báo, khóa input — không set errorBanner
        const detail = err.quotaDetail ?? {};
        setQuotaBanner({
          message:  detail.message || "⏱ Bạn đã dùng hết quota hội thoại AI.",
          reset_at: detail.reset_at || null,
          used_seconds: detail.used_seconds ?? null,
          max_seconds:  detail.max_seconds  ?? null,
        });
        // Cập nhật local quota state để thanh bar phản ánh 100% đã dùng
        setQuota((prev) =>
          prev
            ? {
                ...prev,
                used_seconds:      detail.used_seconds ?? prev.max_seconds,
                remaining_seconds: 0,
                is_exceeded:       true,
              }
            : prev
        );
      } else if (err.status === 502 || err.service === "anthropic") {
        // Anthropic lỗi: hiện banner + cho phép retry (AC-09-04)
        setErrorBanner("🔄 AI đang bận, vui lòng thử lại sau vài giây.");
        if (isGreeting) {
          setGreetingRetry(payload);
        } else {
          setRetryPayload({ payload, currentMessages });
        }
      } else {
        setErrorBanner(`Lỗi kết nối: ${err.message || "Không thể kết nối dịch vụ AI."}`);
        if (isGreeting) setGreetingRetry(payload);
      }
    } finally {
      if (getIsActive()) setLoading(false);
    }
  }

  // ── Lượt chào đầu phiên hoặc khôi phục từ DB / sessionStorage ─────────────
  useEffect(() => {
    if (!topicName) return;

    let active = true;

    async function initSession() {
      setRestoring(true);
      const saved = await loadConversationState(topicId, batchIndex);
      if (!active) return;

      if (saved?.messages?.length) {
        setMessages(saved.messages);
        setCoveredWords(new Set(saved.coveredWords ?? []));
        setMentionedWords(detectMentionedWords(saved.messages, words));
        setBatchDone(saved.batchDone ?? false);
        if (saved.batchDone) completionCalled.current = true;
        setErrorBanner(null);
        setRetryPayload(null);
        setGreetingRetry(null);
        setRestoring(false);
        return;
      }

      setMessages([]);
      setErrorBanner(null);
      setRetryPayload(null);
      setGreetingRetry(null);
      setCoveredWords(new Set());
      setMentionedWords(new Set());
      setBatchDone(false);
      completionCalled.current = false;
      setRestoring(false);

      const topic = buildTopicPayload(topicName, words);
      const greetPayload = {
        text:    "Hello",
        context: "GREETING_MODE:",
        topic,
        history: [],
      };

      processResult(greetPayload, {
        isGreeting:      true,
        currentMessages: [],
        getIsActive:     () => active,
      });
    }

    initSession();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, topicName, batchIndex]);

  // ── Gửi message người dùng ─────────────────────────────────────────────────
  function sendText(rawText) {
    const trimmed = rawText.trim();
    if (!trimmed || loadingRef.current) return;

    stopSpeechRecognition();
    setMicError(null);

    const userMsg = {
      id:      Date.now(),
      role:    "user",
      content: trimmed,
    };

    const next = [...messagesRef.current, userMsg];
    setMessages(next);
    setInput("");
    micTranscriptRef.current = "";
    micInterimRef.current = "";
    setErrorBanner(null);

    const topic   = buildTopicPayload(topicName, words);
    const payload = { text: trimmed, context: null, topic, history: buildHistory(next) };
    processResult(payload, { isGreeting: false, currentMessages: next });
  }

  function handleSend() {
    sendText(input);
  }

  function handleEndSession() {
    stopAllMedia();
    if (topicId && messages.length > 0) {
      flushConversationState(topicId, batchIndex, {
        messages,
        coveredWords,
        batchDone,
      });
    }
    navigate("/roadmap");
  }

  function handleMicToggle() {
    if (loading || quotaBanner) return;

    if (isListening) {
      const text = input.trim();
      stopSpeechRecognition();
      micTranscriptRef.current = "";
      micInterimRef.current = "";
      if (text) sendText(text);
      return;
    }

    setMicError(null);
    micTranscriptRef.current = input.trim() ? `${input.trim()} ` : "";
    micInterimRef.current = "";

    const rec = createSpeechRecognizer({
      lang:           "en-US",
      getLang: () => detectSpeechLang(micTranscriptRef.current + micInterimRef.current),
      manualStopOnly: true,
      onInterim: (text) => {
        micInterimRef.current = text;
        setInput(micTranscriptRef.current + text);
      },
      onFinal: (text) => {
        micTranscriptRef.current += text;
        micInterimRef.current = "";
        setInput(micTranscriptRef.current);
      },
      onEnd: () => {
        setIsListening(false);
        recognitionRef.current = null;
      },
      onError: (err) => {
        setIsListening(false);
        recognitionRef.current = null;
        if (err === "not-allowed") {
          setMicError("Vui lòng cho phép quyền micro trong trình duyệt.");
        } else if (err !== "aborted") {
          setMicError("Không thể dùng micro. Hãy thử nhập text.");
        }
      },
    });

    if (!rec) {
      setMicError("Trình duyệt không hỗ trợ nhận giọng nói — hãy dùng Chrome/Edge.");
      return;
    }

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      setMicError("Không thể bật micro. Thử lại hoặc nhập text.");
    }
  }

  // ── Retry sau lỗi Anthropic ────────────────────────────────────────────────
  function handleRetry() {
    if (retryPayload) {
      const { payload, currentMessages } = retryPayload;
      setRetryPayload(null);
      setErrorBanner(null);
      processResult(payload, { isGreeting: false, currentMessages });
      return;
    }
    if (greetingRetry) {
      setGreetingRetry(null);
      setErrorBanner(null);
      processResult(greetingRetry, { isGreeting: true, currentMessages: [] });
    }
  }

  // ── Navigate sang batch tiếp theo ─────────────────────────────────────────
  async function handleNextBatch() {
    if (!topicId || loadingNext) return;
    stopAllMedia();
    setLoadingNext(true);
    try {
      const nextIdx  = batchIndex + 1;
      const allWords = await getTopicWords(topicId);
      const nextWords = allWords
        .slice(nextIdx * batchSize, (nextIdx + 1) * batchSize)
        .map((w) => ({
          word:             w.word,
          phonetic:         w.phonetic,
          meaning_vi:       w.meaning_vi,
          meaning_en:       w.meaning_en,
          example_sentence: w.example_sentence,
        }));
      if (nextWords.length === 0) {
        clearConversationState(topicId, batchIndex);
        navigate("/roadmap");
        return;
      }
      clearConversationState(topicId, batchIndex);
      await startSession(topicId, { batchIndex: nextIdx, batchSize: nextWords.length });
      navigate("/conversation", {
        state: { topicId, topicName, batchIndex: nextIdx, words: nextWords },
      });
    } catch {
      navigate("/roadmap");
    } finally {
      setLoadingNext(false);
    }
  }

  // ── Keyboard: Enter gửi / Shift+Enter xuống dòng ──────────────────────────
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        height:        "100vh",
        overflow:      "hidden",
        fontFamily:    FONT,
        background:    C.surface,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          height:         HEADER_H,
          minHeight:      HEADER_H,
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          padding:        "0 24px",
          borderBottom:   `1px solid ${C.outlineVariant}`,
          background:     `${C.surface}cc`,
          backdropFilter: "blur(8px)",
          flexShrink:     0,
          zIndex:         10,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C.onSurface, margin: 0 }}>
            {topicName || "Hội thoại AI"}
          </h1>
          <p
            style={{
              fontSize:   14,
              color:      C.onSurfaceVariant,
              margin:     "2px 0 0",
              display:    "flex",
              alignItems: "center",
              gap:        6,
            }}
          >
            <span
              style={{
                display:      "inline-block",
                width:        8,
                height:       8,
                borderRadius: "50%",
                background:   C.secondary,
              }}
            />
            AI Tutor đang hoạt động
          </p>
        </div>

        {/* ── QuotaBar / Pro badge ───────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Free user: hiện thanh quota còn lại (S7.2) */}
          {quota && !quota.is_paid && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>
                ⏱ Còn {Math.ceil((quota.remaining_seconds || 0) / 60)} phút
              </span>
              <div
                style={{
                  width:        80,
                  height:       6,
                  borderRadius: 4,
                  background:   C.outlineVariant,
                  overflow:     "hidden",
                  flexShrink:   0,
                }}
              >
                <div
                  style={{
                    height:       "100%",
                    width:        `${Math.round(((quota.max_seconds - (quota.used_seconds || 0)) / quota.max_seconds) * 100)}%`,
                    background:   (quota.remaining_seconds || 0) <= 300 ? C.warning : C.primary,
                    borderRadius: 4,
                    transition:   "width 0.3s",
                  }}
                />
              </div>
            </div>
          )}

          {/* Paid user: Pro badge — không giới hạn (S7.3, AC-09-03/BR05) */}
          {quota?.is_paid && (
            <span
              style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           5,
                padding:       "4px 12px",
                borderRadius:  20,
                background:    "linear-gradient(135deg, #f59e0b, #d97706)",
                color:         "#fff",
                fontSize:      12,
                fontWeight:    700,
                fontFamily:    FONT,
                letterSpacing: "0.02em",
                userSelect:    "none",
              }}
            >
              ✨ Pro · Không giới hạn
            </span>
          )}

          <button
            onClick={handleEndSession}
            title="Kết thúc phiên"
            style={{
              padding:      "8px 16px",
              borderRadius: 8,
              border:       `1px solid ${C.outlineVariant}`,
              background:   C.surfaceLowest,
              color:        C.onSurfaceVariant,
              fontSize:     14,
              fontWeight:   600,
              cursor:       "pointer",
              minHeight:    44,
              display:      "flex",
              alignItems:   "center",
              gap:          6,
              fontFamily:   FONT,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceContainer; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.surfaceLowest; }}
          >
            ✕ Kết thúc
          </button>
        </div>
      </header>

      {/* ── Body: chat area + vocab panel ─────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ── Vùng chat chính ──────────────────────────────────────────────── */}
        <section
          style={{
            flex:          1,
            display:       "flex",
            flexDirection: "column",
            overflow:      "hidden",
            minHeight:     0,
            borderRight:   `1px solid ${C.outlineVariant}`,
          }}
        >
          {/* Error banner (AC-09-04) */}
          {errorBanner && (
            <div
              role="alert"
              style={{
                padding:        "10px 20px",
                background:     C.errorContainer,
                color:          C.error,
                fontSize:       14,
                fontWeight:     500,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                gap:            12,
                flexShrink:     0,
              }}
            >
              <span>{errorBanner}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {(retryPayload || greetingRetry) && (
                  <button
                    onClick={handleRetry}
                    style={{
                      padding:      "6px 14px",
                      borderRadius: 8,
                      border:       "none",
                      background:   C.error,
                      color:        "#fff",
                      fontSize:     13,
                      fontWeight:   600,
                      cursor:       "pointer",
                      fontFamily:   FONT,
                      minHeight:    36,
                    }}
                  >
                    Thử lại
                  </button>
                )}
                <button
                  onClick={() => setErrorBanner(null)}
                  style={{
                    padding:      "6px 12px",
                    borderRadius: 8,
                    border:       `1px solid ${C.error}`,
                    background:   "transparent",
                    color:        C.error,
                    fontSize:     13,
                    fontWeight:   600,
                    cursor:       "pointer",
                    fontFamily:   FONT,
                    minHeight:    36,
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* Tiến độ từ — luôn hiện (kể cả mobile khi vocab panel ẩn) */}
          {words.length > 0 && (
            <div
              className="sb-word-progress-mobile"
              style={{
                padding:    "8px 20px",
                background: C.surfaceContainer,
                borderBottom: `1px solid ${C.outlineVariant}`,
                flexShrink: 0,
                fontSize:   13,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: C.onSurface }}>🎯 Từ bạn đã dùng</span>
                <span style={{ fontWeight: 700, color: C.primary }}>
                  {coveredWords.size}/{words.length}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: C.outlineVariant, overflow: "hidden" }}>
                <div
                  style={{
                    height:       "100%",
                    width:        `${words.length ? Math.round((coveredWords.size / words.length) * 100) : 0}%`,
                    background:   coveredWords.size >= Math.ceil(words.length * COMPLETION_THRESHOLD)
                      ? C.secondary
                      : C.primary,
                    transition:   "width 0.3s",
                  }}
                />
              </div>
            </div>
          )}

          {/* Danh sách tin nhắn — flex:1 + minHeight:0 giữ input ở đáy */}
          <div
            style={{
              flex:          "1 1 0",
              minHeight:     0,
              overflowY:     "auto",
              padding:       "24px",
              display:       "flex",
              flexDirection: "column",
              gap:           24,
            }}
          >
            {messages.length === 0 && !loading && !restoring && (
              <div
                style={{
                  flex:           1,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  color:          C.onSurfaceVariant,
                  fontSize:       14,
                  textAlign:      "center",
                  padding:        "24px 16px",
                }}
              >
                {errorBanner
                  ? "Không tải được lời chào AI. Nhấn Thử lại ở banner phía trên."
                  : "Đang chờ AI Tutor bắt đầu hội thoại..."}
              </div>
            )}
            {restoring && messages.length === 0 && (
              <div
                style={{
                  flex:           1,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  color:          C.onSurfaceVariant,
                  fontSize:       14,
                }}
              >
                Đang tải hội thoại đã lưu...
              </div>
            )}
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                audioUrl={msg.audioUrl}
                ttsError={msg.ttsError}
              />
            ))}
            {loading && <LoadingDots />}
            <div ref={chatEndRef} />
          </div>

          {/* ── QuotaBanner — hiện khi quota hết (S7.2, AC-09-02) ──────────── */}
          {quotaBanner && (
            <div
              role="alert"
              style={{
                padding:    "12px 20px",
                background: C.warningContainer,
                borderTop:  `2px solid ${C.warning}`,
                fontSize:   14,
                flexShrink: 0,
              }}
            >
              <p style={{ margin: "0 0 4px", fontWeight: 600, color: C.onWarning }}>
                {quotaBanner.message}
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: C.onWarning, opacity: 0.85 }}>
                Quota reset lúc:{" "}
                {quotaBanner.reset_at
                  ? new Date(quotaBanner.reset_at).toLocaleTimeString("vi-VN")
                  : "—"}
              </p>
              <button
                onClick={() => navigate("/pricing")}
                style={{
                  padding:      "6px 16px",
                  borderRadius: 8,
                  border:       "none",
                  background:   C.warning,
                  color:        "#fff",
                  fontSize:     13,
                  fontWeight:   700,
                  cursor:       "pointer",
                  fontFamily:   FONT,
                  minHeight:    36,
                }}
              >
                Nâng cấp Pro
              </button>
            </div>
          )}

          {/* ── Batch complete banner ───────────────────────────────────────── */}
          {batchDone && (
            <div
              style={{
                padding:    "14px 20px",
                background: "#ecfdf5",
                borderTop:  `2px solid ${C.secondary}`,
                fontSize:   14,
                flexShrink: 0,
                display:    "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap:        12,
                flexWrap:   "wrap",
              }}
            >
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 700, color: C.secondary }}>
                  ✅ Bạn đã luyện xong Phần {batchIndex + 1}!
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#065f46" }}>
                  {coveredWords.size}/{words.length} từ đã xuất hiện trong hội thoại.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={handleNextBatch}
                  disabled={loadingNext}
                  style={{
                    padding:      "8px 18px",
                    borderRadius: 10,
                    border:       "none",
                    background:   loadingNext ? C.outlineVariant : C.secondary,
                    color:        "#fff",
                    fontSize:     13,
                    fontWeight:   700,
                    cursor:       loadingNext ? "not-allowed" : "pointer",
                    minHeight:    40,
                    fontFamily:   FONT,
                  }}
                >
                  {loadingNext ? "Đang tải..." : "Phần tiếp theo →"}
                </button>
                <button
                  onClick={() => setBatchDone(false)}
                  style={{
                    padding:      "8px 14px",
                    borderRadius: 10,
                    border:       `1px solid ${C.secondary}`,
                    background:   "transparent",
                    color:        C.secondary,
                    fontSize:     13,
                    fontWeight:   600,
                    cursor:       "pointer",
                    minHeight:    40,
                    fontFamily:   FONT,
                  }}
                >
                  Tiếp tục chat
                </button>
              </div>
            </div>
          )}

          {/* ── Input area — mic centered primary, pill text input ────────── */}
          <div
            style={{
              padding:        "16px 24px 24px",
              background:     `${C.surface}f2`,
              backdropFilter: "blur(8px)",
              borderTop:      `1px solid ${C.outlineVariant}`,
              flexShrink:     0,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            16,
            }}
          >
            <div
              style={{
                display:       "flex",
                flexDirection: "column",
                alignItems:    "center",
                gap:           16,
                width:         "100%",
                maxWidth:      448,
              }}
            >
              {/* Nút mic lớn — primary desktop, secondary-container mobile */}
              <button
                className="sb-mic-btn"
                onClick={handleMicToggle}
                disabled={loading || !!quotaBanner}
                title={
                  quotaBanner
                    ? "Quota đã hết"
                    : isListening
                    ? "Nhấn để dừng ghi"
                    : "Nhấn để nói (tiếng Anh hoặc tiếng Việt)"
                }
                aria-label={isListening ? "Dừng ghi âm" : "Ghi âm"}
                style={{
                  width:          80,
                  height:         80,
                  borderRadius:   "50%",
                  border:         isListening ? `3px solid ${C.secondary}` : "none",
                  background:     loading || !!quotaBanner
                    ? C.outlineVariant
                    : isListening
                    ? C.secondary
                    : C.primary,
                  color:          loading || !!quotaBanner ? C.onSurfaceVariant : "#ffffff",
                  fontSize:       32,
                  cursor:         loading || !!quotaBanner ? "not-allowed" : "pointer",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  boxShadow:      loading || !!quotaBanner
                    ? "none"
                    : isListening
                    ? "0 8px 24px rgba(0,108,73,0.35)"
                    : "0 8px 24px rgba(79,70,229,0.3)",
                  transition:     "transform 0.15s, box-shadow 0.15s, background 0.15s",
                  position:       "relative",
                  overflow:       "hidden",
                  flexShrink:     0,
                }}
                onMouseEnter={(e) => {
                  if (!loading && !quotaBanner) e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isListening ? "⏹" : "🎤"}
                {!loading && !quotaBanner && !isListening && (
                  <span
                    style={{
                      position:      "absolute",
                      inset:         0,
                      borderRadius:  "50%",
                      background:    C.primary,
                      animation:     "internalPulse 2s ease-in-out infinite",
                      opacity:       0.2,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </button>

              {/* Pill text input + nút gửi tròn */}
              <div
                style={{
                  width:      "100%",
                  display:    "flex",
                  alignItems: "center",
                  gap:        8,
                  background: C.surfaceLowest,
                  border:     `1px solid ${C.outlineVariant}`,
                  borderRadius: 9999,
                  padding:    "8px 8px 8px 16px",
                  opacity:    !!quotaBanner ? 0.55 : 1,
                  transition: "border-color 0.15s",
                }}
                onFocusCapture={(e) => { e.currentTarget.style.borderColor = C.primary; }}
                onBlurCapture={(e)  => { e.currentTarget.style.borderColor = C.outlineVariant; }}
              >
                <textarea
                  value={input}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInput(value);
                    micTranscriptRef.current = value;
                    micInterimRef.current = "";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    quotaBanner
                      ? "Quota đã hết — nâng cấp Pro hoặc chờ reset"
                      : "Nhập tin nhắn..."
                  }
                  rows={1}
                  disabled={loading || !!quotaBanner}
                  style={{
                    flex:       1,
                    border:     "none",
                    outline:    "none",
                    resize:     "none",
                    background: "transparent",
                    fontSize:   14,
                    lineHeight: 1.5,
                    color:      C.onSurface,
                    fontFamily: FONT,
                    padding:    "4px 0",
                    minHeight:  28,
                    maxHeight:  72,
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 72) + "px";
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || !!quotaBanner}
                  title="Gửi (Enter)"
                  aria-label="Gửi tin nhắn"
                  style={{
                    width:          36,
                    height:         36,
                    borderRadius:   "50%",
                    border:         "none",
                    background:     !input.trim() || loading || !!quotaBanner
                      ? C.surfaceContainer
                      : C.primary,
                    color:          !input.trim() || loading || !!quotaBanner
                      ? C.onSurfaceVariant
                      : C.onPrimary,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontSize:       16,
                    cursor:         !input.trim() || loading || !!quotaBanner ? "not-allowed" : "pointer",
                    flexShrink:     0,
                    transition:     "background 0.15s",
                  }}
                >
                  ▶
                </button>
              </div>

              {/* Helper text */}
              <p style={{ margin: 0, fontSize: 12, color: micError ? C.error : C.outline, textAlign: "center" }}>
                {micError
                  ? micError
                  : loading
                  ? "AI đang trả lời..."
                  : isListening
                  ? "Đang nghe... nhấn mic lần nữa để dừng và gửi"
                  : quotaBanner
                  ? "Quota đã hết"
                  : "Nhấn mic để nói hoặc nhập tin nhắn"}
              </p>
            </div>
          </div>

          <style>{`
            @keyframes internalPulse {
              0%, 100% { opacity: 0.2; transform: scale(1); }
              50%       { opacity: 0;   transform: scale(1.8); }
            }
            @media (max-width: 767px) {
              .sb-mic-btn:not(:disabled) {
                background: #6cf8bb !important;
                color: #002113 !important;
                box-shadow: 0 8px 24px rgba(0,108,73,0.3) !important;
              }
            }
          `}</style>
        </section>

        {/* ── Vocab panel — chỉ hiện ≥1024px ──────────────────────────────── */}
        <div className="sb-vocab-panel" style={{ minHeight: 0, overflow: "hidden" }}>
          <VocabPanel
            words={words}
            coveredWords={coveredWords}
            mentionedWords={mentionedWords}
            completionThreshold={COMPLETION_THRESHOLD}
          />
        </div>

        <style>{`
          .sb-vocab-panel { display: none; height: 100%; }
          @media (min-width: 1024px) {
            .sb-vocab-panel { display: block; }
            .sb-word-progress-mobile { display: none; }
          }
        `}</style>
      </div>
    </div>
  );
}
