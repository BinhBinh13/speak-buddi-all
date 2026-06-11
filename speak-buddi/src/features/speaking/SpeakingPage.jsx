import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppLayout from "../../shared/components/AppLayout";
import ChatBubble from "../conversation/components/ChatBubble";
import { sendMessage } from "../conversation/services/conversationService";
import { getQuotaStatus } from "../conversation/services/quotaService";
import { createSpeechRecognizer, detectSpeechLang } from "./services/speechService";
import { saveSpeakingSession } from "./services/speakingHistoryService";
import SpeakingTopicPicker from "./components/SpeakingTopicPicker";
import SpeakingInputBar from "./components/SpeakingInputBar";
import SpeakingHistoryPanel from "./components/SpeakingHistoryPanel";

const C = {
  primary:          "#3525cd",
  onPrimary:        "#ffffff",
  surface:          "#fcf8ff",
  surfaceLowest:    "#ffffff",
  onSurface:        "#1b1b24",
  onSurfaceVariant: "#464555",
  outlineVariant:   "#c7c4d8",
  secondary:        "#006c49",
  error:            "#ba1a1a",
  errorContainer:   "#ffdad6",
  warning:          "#f59e0b",
  warningContainer: "#fef3c7",
  onWarning:        "#78350f",
};

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

function LoadingDots() {
  return (
    <div style={{ alignSelf: "flex-start", display: "flex", gap: 6, padding: "12px 16px", background: C.surfaceLowest, border: `1px solid ${C.outlineVariant}`, borderRadius: "1rem", borderTopLeftRadius: 4, marginLeft: 52 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: C.primary, animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes dotPulse{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

function buildRoadmapTopicPayload(topic) {
  if (!topic) return null;
  const words = topic.words ?? [];
  return {
    label:   topic.label ?? topic.name ?? "Topic",
    words:   words.map((w) => (typeof w === "string" ? w : w.word ?? "")),
    grammarTopics: topic.grammarTopics ?? [],
  };
}

export default function SpeakingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initState  = location.state ?? {};

  const [sessionPrompt, setSessionPrompt] = useState(initState.freeTopic?.prompt ?? null);
  const [roadmapTopic,  setRoadmapTopic]  = useState(initState.topic ?? null);
  const [started,       setStarted]       = useState(Boolean(initState.freeTopic || initState.topic));

  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [errorBanner,    setErrorBanner]    = useState(null);
  const [retryPayload,   setRetryPayload]   = useState(null);
  const [quota,          setQuota]          = useState(null);
  const [quotaBanner,    setQuotaBanner]    = useState(null);
  const [isListening,    setIsListening]    = useState(false);
  const [micError,       setMicError]       = useState(null);
  const [historyOpen,    setHistoryOpen]    = useState(false);
  const [saveStatus,     setSaveStatus]     = useState(null); // null | "saving" | "saved" | "error"
  const greetingCalledRef = useRef(false);

  const chatEndRef       = useRef(null);
  const activeAudioRef   = useRef(null);
  const recognitionRef   = useRef(null);
  const micTranscriptRef = useRef("");
  const micInterimRef    = useRef("");
  const messagesRef      = useRef([]);
  const loadingRef       = useRef(false);

  const sessionTitle = roadmapTopic?.label ?? roadmapTopic?.name ?? sessionPrompt ?? "Free Speaking";
  const inputBlocked = Boolean(quotaBanner);

  function buildHistory(msgs) {
    return msgs.map((m) => ({
      role:    m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));
  }

  function stopActiveAudio() {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
  }

  function stopSpeechRecognition() {
    const rec = recognitionRef.current;
    if (rec) {
      rec.manualStopRequested = true;
      try { rec.stopManually?.(); } catch { try { rec.stop(); } catch { /* ignore */ } }
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

  useEffect(() => () => stopAllMedia(), []);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    getQuotaStatus().then(setQuota).catch(() => {});
  }, []);

  async function processResult(payload, { isGreeting = false, currentMessages } = {}) {
    setLoading(true);
    setErrorBanner(null);
    try {
      const result = await sendMessage(payload);
      const aiMsg = {
        id:       Date.now(),
        role:     "assistant",
        content:  result.replyText,
        audioUrl: result.audioUrl ?? null,
        ttsError: result.ttsError ?? false,
      };
      setMessages((prev) => (isGreeting ? [aiMsg] : [...prev, aiMsg]));
      if (result.audioUrl) playAiAudio(result.audioUrl);
      setRetryPayload(null);
    } catch (err) {
      if (err.status === 429) {
        const detail = err.quotaDetail ?? {};
        setQuotaBanner({
          message:  detail.message || "⏱ Bạn đã dùng hết quota hội thoại AI.",
          reset_at: detail.reset_at || null,
        });
        setQuota((prev) => prev ? { ...prev, remaining_seconds: 0, is_exceeded: true } : prev);
      } else if (err.status === 502 || err.service === "anthropic") {
        setErrorBanner("🔄 AI đang bận, vui lòng thử lại sau vài giây.");
        setRetryPayload({ payload, currentMessages, isGreeting });
      } else {
        setErrorBanner(`Lỗi kết nối: ${err.message || "Không thể kết nối dịch vụ AI."}`);
        setRetryPayload({ payload, currentMessages, isGreeting });
      }
    } finally {
      setLoading(false);
    }
  }

  // Greeting khi bắt đầu session
  useEffect(() => {
    if (!started || greetingCalledRef.current) return;

    greetingCalledRef.current = true;
    setMessages([]);
    setErrorBanner(null);

    const topicPayload = buildRoadmapTopicPayload(roadmapTopic);
    const greetPayload = roadmapTopic
      ? {
          text:    "Hello",
          context: "GREETING_MODE:",
          topic:   topicPayload,
          history: [],
        }
      : {
          text:    "Hello",
          context: sessionPrompt,
          history: [],
        };

    processResult(greetPayload, { isGreeting: true, currentMessages: [] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, sessionPrompt, roadmapTopic]);

  function handleStartSession(prompt) {
    stopAllMedia();
    setSessionPrompt(prompt);
    setRoadmapTopic(null);
    setStarted(true);
    greetingCalledRef.current = false;
    setMessages([]);
    setInput("");
    setErrorBanner(null);
    setQuotaBanner(null);
    navigate("/speaking", { replace: true, state: { freeTopic: { prompt } } });
  }

  async function handleSaveSession() {
    const msgs = messagesRef.current;
    if (!msgs.length) return;
    setSaveStatus("saving");
    try {
      await saveSpeakingSession(sessionTitle, msgs.map((m) => ({ role: m.role, content: m.content })));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  function handleEndSession() {
    stopAllMedia();
    setStarted(false);
    setSessionPrompt(null);
    setRoadmapTopic(null);
    greetingCalledRef.current = false;
    setMessages([]);
    setInput("");
    setErrorBanner(null);
    setQuotaBanner(null);
    setSaveStatus(null);
    navigate("/speaking", { replace: true, state: {} });
  }

  function sendText(rawText) {
    const trimmed = rawText.trim();
    if (!trimmed || loadingRef.current || inputBlocked) return;

    stopSpeechRecognition();
    setMicError(null);

    const userMsg = { id: Date.now(), role: "user", content: trimmed };
    const next = [...messagesRef.current, userMsg];
    setMessages(next);
    setInput("");
    micTranscriptRef.current = "";
    micInterimRef.current = "";

    const topicPayload = buildRoadmapTopicPayload(roadmapTopic);
    const payload = {
      text:    trimmed,
      context: roadmapTopic ? null : sessionPrompt,
      topic:   topicPayload,
      history: buildHistory(next),
    };
    processResult(payload, { currentMessages: next });
  }

  function handleSend() {
    sendText(input);
  }

  function handleMicToggle() {
    if (loading || inputBlocked) return;

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
      getLang:        () => detectSpeechLang(micTranscriptRef.current + micInterimRef.current),
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

  function handleRetry() {
    if (!retryPayload) return;
    const { payload, currentMessages, isGreeting } = retryPayload;
    setRetryPayload(null);
    setErrorBanner(null);
    processResult(payload, { isGreeting, currentMessages });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e) {
    const value = e.target.value;
    setInput(value);
    micTranscriptRef.current = value;
    micInterimRef.current = "";
  }

  // ── Picker: chưa chọn chủ đề ───────────────────────────────────────────────
  if (!started) {
    return (
      <AppLayout>
        <SpeakingTopicPicker onStart={handleStartSession} onShowHistory={() => setHistoryOpen(true)} />
        <SpeakingHistoryPanel visible={historyOpen} onClose={() => setHistoryOpen(false)} />
      </AppLayout>
    );
  }

  // ── Chat session — layout giống /conversation ─────────────────────────────
  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 120px)", height: "calc(100vh - 120px)", overflow: "hidden", fontFamily: FONT, background: C.surface, borderRadius: 12, border: `1px solid ${C.outlineVariant}` }}>
        <header style={{ height: 64, minHeight: 64, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", borderBottom: `1px solid ${C.outlineVariant}`, background: `${C.surface}cc`, backdropFilter: "blur(8px)", flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: C.onSurface, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sessionTitle}
            </h1>
            <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.secondary }} />
              {roadmapTopic ? "Luyện speaking theo chủ đề" : "Free Speaking · AI Tutor đang hoạt động"}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {quota && !quota.is_paid && (
              <span style={{ fontSize: 13, color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>
                ⏱ Còn {Math.ceil((quota.remaining_seconds || 0) / 60)} phút
              </span>
            )}
            {quota?.is_paid && (
              <span style={{ padding: "4px 12px", borderRadius: 20, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                ✨ Pro
              </span>
            )}
            {/* Nút lưu hội thoại */}
            {messages.length > 0 && (
              <button
                onClick={handleSaveSession}
                disabled={saveStatus === "saving"}
                title="Lưu hội thoại này"
                style={{
                  padding: "8px 14px", borderRadius: 8, border: `1px solid ${saveStatus === "saved" ? "#006c49" : C.outlineVariant}`,
                  background: saveStatus === "saved" ? "#e6f4ef" : C.surfaceLowest,
                  color: saveStatus === "saved" ? "#006c49" : saveStatus === "error" ? C.error : C.onSurfaceVariant,
                  fontSize: 13, fontWeight: 600, cursor: saveStatus === "saving" ? "default" : "pointer",
                  minHeight: 44, fontFamily: FONT, whiteSpace: "nowrap", transition: "all 0.2s",
                }}
              >
                {saveStatus === "saving" ? "Đang lưu..." : saveStatus === "saved" ? "✓ Đã lưu" : saveStatus === "error" ? "Lỗi lưu" : "💾 Lưu"}
              </button>
            )}
            {/* Nút xem lịch sử */}
            <button
              onClick={() => setHistoryOpen(true)}
              title="Xem lịch sử hội thoại"
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.outlineVariant}`, background: C.surfaceLowest, color: C.onSurfaceVariant, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 44, fontFamily: FONT }}
            >
              📋 Lịch sử
            </button>
            <button
              onClick={handleEndSession}
              style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.outlineVariant}`, background: C.surfaceLowest, color: C.onSurfaceVariant, fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44, fontFamily: FONT }}
            >
              ✕ Kết thúc
            </button>
          </div>
        </header>

        {errorBanner && (
          <div role="alert" style={{ padding: "10px 20px", background: C.errorContainer, color: C.error, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
            <span>{errorBanner}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {retryPayload && (
                <button onClick={handleRetry} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: C.error, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
                  Thử lại
                </button>
              )}
              <button onClick={() => setErrorBanner(null)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.error}`, background: "transparent", color: C.error, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
                Đóng
              </button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {messages.length === 0 && !loading && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.onSurfaceVariant, fontSize: 14, textAlign: "center" }}>
              Đang chờ AI Tutor bắt đầu hội thoại...
            </div>
          )}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} content={msg.content} audioUrl={msg.audioUrl} ttsError={msg.ttsError} />
          ))}
          {loading && <LoadingDots />}
          <div ref={chatEndRef} />
        </div>

        {quotaBanner && (
          <div role="alert" style={{ padding: "12px 20px", background: C.warningContainer, borderTop: `2px solid ${C.warning}`, fontSize: 14, flexShrink: 0 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, color: C.onWarning }}>{quotaBanner.message}</p>
            <button onClick={() => navigate("/pricing")} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: C.warning, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
              Nâng cấp Pro
            </button>
          </div>
        )}

        <SpeakingInputBar
          input={input}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          onMicToggle={handleMicToggle}
          isListening={isListening}
          loading={loading}
          disabled={inputBlocked}
          micError={micError}
        />
      </div>
      <SpeakingHistoryPanel visible={historyOpen} onClose={() => setHistoryOpen(false)} />
    </AppLayout>
  );
}
