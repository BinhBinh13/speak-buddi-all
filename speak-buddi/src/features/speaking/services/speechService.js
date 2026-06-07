const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const API_URL = import.meta.env.VITE_API_URL;

/**
 * createSpeechRecognizer
 *
 * Dùng continuous = true + silence detection để user nói nhiều câu liên tục
 * mà không bị ngắt. Sau SILENCE_MS ms không có kết quả mới → tự dừng.
 *
 * @param {object} opts
 * @param {string}   opts.lang
 * @param {function} opts.onInterim   - (text) gọi mỗi khi có partial result
 * @param {function} opts.onFinal     - (text) gọi khi có final result
 * @param {function} opts.onEnd       - () gọi khi recognition thực sự dừng
 * @param {function} opts.onError
 * @param {number|null} [opts.silenceMs=2200] - ms im lặng trước khi tự dừng; null = không tự dừng
 * @param {boolean} [opts.manualStopOnly=false] - true: chỉ dừng khi gọi stopManually()
 */
export function createSpeechRecognizer({
  lang = "en-US",
  onInterim,
  onFinal,
  onEnd,
  onError,
  silenceMs = 2200,
  manualStopOnly = false,
}) {
  if (!SpeechRecognition) {
    onError?.("Browser does not support Speech Recognition.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang            = lang;
  recognition.continuous      = true;
  recognition.interimResults  = true;
  recognition.manualStopRequested = false;

  let silenceTimer  = null;
  const useSilenceStop = !manualStopOnly && silenceMs != null && silenceMs > 0;

  function resetSilenceTimer() {
    if (!useSilenceStop) return;
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      recognition.stop();
    }, silenceMs);
  }

  recognition.onstart = () => {
    resetSilenceTimer();
  };

  recognition.onresult = (e) => {
    let interim = "";
    let final   = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final   += t;
      else                       interim += t;
    }
    if (interim || final) resetSilenceTimer();
    if (interim) onInterim?.(interim);
    if (final)   onFinal?.(final);
  };

  recognition.onend = () => {
    clearTimeout(silenceTimer);
    // Trình duyệt có thể tự ngắt session — restart nếu user chưa bấm dừng
    if (manualStopOnly && !recognition.manualStopRequested) {
      try {
        recognition.start();
        return;
      } catch {
        // không restart được — coi như kết thúc
      }
    }
    onEnd?.();
  };

  recognition.onerror = (e) => {
    clearTimeout(silenceTimer);
    if (e.error === "no-speech") return;
    onError?.(e.error);
  };

  recognition.stopManually = () => {
    recognition.manualStopRequested = true;
    clearTimeout(silenceTimer);
    recognition.stop();
  };

  return recognition;
}

// ─────────────────────────────────────────────────────────────────────────────
// getAIResponse
//   transcript  : text user nói
//   context     : free-speak prompt hoặc topic label
//   ttsOnly     : true → chỉ TTS, không gọi Claude
//   topic       : object { label, words, grammarTopics } từ roadmap node
// ─────────────────────────────────────────────────────────────────────────────
export async function getAIResponse(
  transcript,
  context  = null,
  ttsOnly  = false,
  topic    = null,
) {
  if (ttsOnly) {
    const res = await fetch(`${API_URL}/tts`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ text: transcript }),
    });
    if (!res.ok) throw new Error("TTS error");
    const audioBlob = await res.blob();
    return { replyText: transcript, audioUrl: URL.createObjectURL(audioBlob) };
  }

  const body = { text: transcript, context };
  if (topic) body.topic = topic; // truyền topic object đầy đủ lên backend

  const res = await fetch(`${API_URL}/speak`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) throw new Error("API error");

  const replyText = decodeURIComponent(res.headers.get("X-Reply-Text") ?? "");
  const audioBlob = await res.blob();
  const audioUrl  = URL.createObjectURL(audioBlob);

  return { replyText, audioUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// getTopicGreeting
//   Gọi backend để AI tự generate lời chào + giới thiệu topic + từ mới.
//   Dùng cho topic mode (roadmap node) khi user vừa vào trang.
// ─────────────────────────────────────────────────────────────────────────────
export async function getTopicGreeting(topic) {
  // Tạo prompt đặc biệt — user "nói" một câu trigger greeting
  const triggerText = `[GREETING] Tôi vừa bắt đầu bài học "${topic.label}". Hãy chào và giới thiệu bài học.`;

  const words   = topic.words?.slice(0, 6).join(", ") ?? "";
  const grammar = topic.grammarTopics?.join(", ")     ?? "";

  // Truyền context đặc biệt để backend biết đây là greeting
  const body = {
    text:    triggerText,
    context: `GREETING_MODE: topic="${topic.label}" words="${words}" grammar="${grammar}"`,
    topic:   topic,
  };

  const res = await fetch(`${API_URL}/speak`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Greeting API error");

  const replyText = decodeURIComponent(res.headers.get("X-Reply-Text") ?? "");
  const audioBlob = await res.blob();
  const audioUrl  = URL.createObjectURL(audioBlob);

  return { replyText, audioUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
export function playAudio(audioUrl, onEnd) {
  const audio     = new Audio(audioUrl);
  audio.onended   = () => { URL.revokeObjectURL(audioUrl); onEnd?.(); };
  audio.play();
  return audio;
}



