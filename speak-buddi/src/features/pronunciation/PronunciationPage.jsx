// speak-buddi/src/features/pronunciation/PronunciationPage.jsx
// Màn Luyện phát âm — S6.1 (ghi âm) + S6.2 (chấm phát âm + Score Display)
// Bám mockup: speak-buddi-docs/ui/luyen_phat_am_desktop/
// UI tham chiếu: luyen_phat_am_desktop/code.html + screen.png

import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation }        from "react-router-dom";
import AppLayout              from "../../shared/components/AppLayout";
import WordCard               from "./components/WordCard";
import RecordButton           from "./components/RecordButton";
import RecordingTimer         from "./components/RecordingTimer";
import MicErrorAlert          from "./components/MicErrorAlert";
import ScoreResult            from "./components/ScoreResult";
import useMediaRecorder       from "./hooks/useMediaRecorder";
import { scorePronunciation } from "./services/pronunciationService";

/** Từ mẫu hardcode — nguồn từ thật (theo level/topic) là việc story sau */
const SAMPLE_WORDS = [
  {
    word:       "Departure",
    phonetic:   "/dɪˈpɑːr.tʃər/",
    meaning_vi: "Sự khởi hành; chuyến đi",
  },
  {
    word:       "Adventure",
    phonetic:   "/ədˈven.tʃər/",
    meaning_vi: "Cuộc phiêu lưu; mạo hiểm",
  },
  {
    word:       "Beautiful",
    phonetic:   "/ˈbjuː.tɪ.fəl/",
    meaning_vi: "Đẹp; tuyệt vời",
  },
];

/**
 * Nhận data từ navigate state (từ VocabularyPage / RoadmapNode).
 * Nếu không có state → dùng danh sách từ hardcode.
 */
export default function PronunciationPage() {
  const { state } = useLocation();

  // ── Danh sách từ: ưu tiên state từ navigate, fallback hardcode ────────────
  const [wordIndex, setWordIndex] = useState(0);

  const wordFromState = state?.word
    ? { word: state.word, phonetic: state.phonetic ?? "", meaning_vi: state.meaning_vi ?? "" }
    : null;

  const wordList    = wordFromState ? [wordFromState, ...SAMPLE_WORDS] : SAMPLE_WORDS;
  const currentWord = wordList[wordIndex] ?? SAMPLE_WORDS[0];
  const hasNext     = wordIndex < wordList.length - 1;

  // ── Media recorder hook ───────────────────────────────────────────────────
  const { status, error, elapsedMs, start, stop, reset } =
    useMediaRecorder({ maxDurationMs: 15000 });

  // ── Scoring state ─────────────────────────────────────────────────────────
  const [scoreData,    setScoreData]    = useState(null);
  const [scoringError, setScoringError] = useState(null);
  const [isScoring,    setIsScoring]    = useState(false);

  // ── "Nghe mẫu" TTS state ─────────────────────────────────────────────────
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const sampleAudioRef = useRef(null); // giữ Audio object để stop khi đổi từ

  // ── SpeechRecognition ref (không gây re-render) ───────────────────────────
  // Lựa chọn: dùng browser Web Speech API trực tiếp — không coupling với
  // features/speaking/services/speechService.js (tránh cross-feature import
  // cho 1 helper nhỏ; ghi rõ trong implement log).
  const transcriptRef = useRef("");
  const recognizerRef = useRef(null);

  // ── Trigger scoring khi status chuyển sang "done" ────────────────────────
  useEffect(() => {
    if (status !== "done") return;

    // Dừng recognizer nếu chưa dừng — nhưng KHÔNG đọc transcript ngay.
    // SpeechRecognition cần ~450ms để fire onresult(isFinal=true) sau .stop().
    // Đọc quá sớm → transcript rỗng → 400.
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch { /* ignore */ }
      recognizerRef.current = null;
    }

    const targetText = currentWord.word;

    // Chờ 450ms cho SpeechRecognition settle trước khi đọc transcript
    const timerId = setTimeout(() => {
      const transcript = transcriptRef.current.trim();
      const t0 = performance.now();

      setIsScoring(true);
      setScoreData(null);
      setScoringError(null);

      console.log(
        "[Pronunciation] score_request  word=%s  transcript_len=%d",
        targetText, transcript.length,
      );

      scorePronunciation({ target_text: targetText, transcript })
        .then((data) => {
          const ms = (performance.now() - t0).toFixed(0);
          console.log(
            "[Pronunciation] score_result  word=%s  overall=%s  accuracy=%s  fluency=%s  syllables=%d  ms=%s",
            targetText, data.overall, data.accuracy, data.fluency,
            data.syllables?.length ?? 0, ms,
          );
          setScoreData(data);
          setScoringError(null);
        })
        .catch((err) => {
          const ms = (performance.now() - t0).toFixed(0);
          console.error(
            "[Pronunciation] score_error  word=%s  status=%s  ms=%s  message=%s",
            targetText, err?.status, ms, err?.message,
          );
          if (err?.status === 400) {
            setScoringError("🎤 Không nghe thấy gì. Hãy thử nói lại.");
          } else {
            setScoringError("🔄 AI đang bận, vui lòng thử lại sau vài giây.");
          }
        })
        .finally(() => {
          setIsScoring(false);
        });
    }, 450);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Bắt đầu ghi âm + SpeechRecognition đồng thời ─────────────────────────
  const handleStart = useCallback(() => {
    transcriptRef.current = "";
    setScoreData(null);
    setScoringError(null);
    console.log("[Pronunciation] recording_start  word=%s", currentWord.word);

    // Khởi SpeechRecognition (nếu trình duyệt hỗ trợ)
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      const recog          = new SpeechRecognitionAPI();
      recog.lang           = "en-US";
      recog.continuous     = true;
      recog.interimResults = true;
      recog.maxAlternatives = 1;

      recog.onresult = (event) => {
        let final = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          }
        }
        if (final.trim()) transcriptRef.current = final.trim();
      };

      recog.onerror = () => {
        // Lỗi SpeechRecognition không block — tiếp tục ghi âm
      };

      try {
        recog.start();
        recognizerRef.current = recog;
      } catch {
        recognizerRef.current = null;
      }
    }

    start();
  }, [start]);

  // ── Dừng ghi âm ──────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    console.log(
      "[Pronunciation] recording_stop  word=%s  transcript_len=%d",
      currentWord.word, transcriptRef.current.trim().length,
    );
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch { /* ignore */ }
      recognizerRef.current = null;
    }
    stop();
  }, [stop, currentWord.word]);

  // ── Reset toàn bộ (bao gồm score + sample audio) ────────────────────────
  const handleReset = useCallback(() => {
    setScoreData(null);
    setScoringError(null);
    setIsScoring(false);
    transcriptRef.current = "";
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch { /* ignore */ }
      recognizerRef.current = null;
    }
    // Dừng audio mẫu nếu đang phát
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current = null;
    }
    setIsPlayingSample(false);
    reset();
  }, [reset]);

  // ── "Nghe mẫu" — gọi POST /tts → play audio ElevenLabs ──────────────────
  const handlePlaySample = useCallback(async () => {
    if (isPlayingSample) return;

    // Dừng audio đang phát (nếu có)
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current = null;
    }

    setIsPlayingSample(true);
    const t0 = performance.now();
    console.log("[Pronunciation] tts_request  word=%s", currentWord.word);
    try {
      const API_URL =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        "http://localhost:8000";

      const res = await fetch(`${API_URL}/tts`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: currentWord.word }),
      });

      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);

      const blob     = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio    = new Audio(audioUrl);

      console.log(
        "[Pronunciation] tts_ready  word=%s  bytes=%d  ms=%s",
        currentWord.word, blob.size, (performance.now() - t0).toFixed(0),
      );

      sampleAudioRef.current = audio;

      audio.onended = () => {
        console.log("[Pronunciation] tts_ended  word=%s", currentWord.word);
        URL.revokeObjectURL(audioUrl);
        sampleAudioRef.current = null;
        setIsPlayingSample(false);
      };
      audio.onerror = (e) => {
        console.error("[Pronunciation] tts_play_error  word=%s  error=%s", currentWord.word, e);
        URL.revokeObjectURL(audioUrl);
        sampleAudioRef.current = null;
        setIsPlayingSample(false);
      };

      await audio.play();
    } catch (err) {
      console.error(
        "[Pronunciation] tts_error  word=%s  ms=%s  message=%s",
        currentWord.word, (performance.now() - t0).toFixed(0), err?.message,
      );
      setIsPlayingSample(false);
    }
  }, [isPlayingSample, currentWord.word]);

  // ── Từ tiếp theo ──────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!hasNext) return;
    setWordIndex((i) => i + 1);
    handleReset();
  }, [hasNext, handleReset]);

  // ── Nhãn trạng thái ghi âm ───────────────────────────────────────────────
  const statusLabel = {
    idle:       "Nhấn nút để bắt đầu ghi âm",
    recording:  "Đang ghi âm... Nói rõ từ trên",
    processing: "Đang xử lý...",
    done:       "",
    error:      "",
  }[status] ?? "";

  // ── Xác định state UI hiển thị ────────────────────────────────────────────
  const showScoreResult  = status === "done" && scoreData && !isScoring;
  const showLoadingScore = (status === "done" && isScoring) || (status === "processing");
  const showScoringError = status === "done" && !isScoring && !scoreData && scoringError;
  const showRecorder     = status !== "done" && status !== "error" && status !== "processing";

  return (
    <AppLayout>
      {/* Spinner keyframe dùng trong loading */}
      <style>{`@keyframes sb-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={styles.page}>
        {/* ── Tiêu đề trang ── */}
        <div style={styles.header}>
          <span style={styles.categoryLabel}>LUYỆN PHÁT ÂM</span>
          <h1 style={styles.pageTitle}>Luyện phát âm</h1>
        </div>

        {/* ── Word card ── */}
        <WordCard
          word={currentWord.word}
          phonetic={currentWord.phonetic}
          meaningVi={currentWord.meaning_vi}
          onPlay={handlePlaySample}
          isPlaying={isPlayingSample}
        />

        {/* ── Khu vực ghi âm / lỗi / kết quả ── */}
        <div style={styles.actionArea}>

          {/* Lỗi mic */}
          {status === "error" && (
            <MicErrorAlert error={error} onRetry={handleReset} />
          )}

          {/* Loading chấm điểm */}
          {showLoadingScore && (
            <div style={styles.loadingBox}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Đang chấm điểm...</p>
            </div>
          )}

          {/* Lỗi scoring */}
          {showScoringError && (
            <div style={styles.scoringErrorBox}>
              <p style={styles.scoringErrorMsg}>{scoringError}</p>
              <button onClick={handleReset} style={styles.retryBtn}>
                Thử lại
              </button>
            </div>
          )}

          {/* Score Display */}
          {showScoreResult && (
            <ScoreResult
              result={scoreData}
              onRetry={handleReset}
              onNext={handleNext}
              hasNext={hasNext}
            />
          )}

          {/* Ghi âm + timer + hướng dẫn */}
          {showRecorder && (
            <>
              <RecordButton
                status={status}
                onStart={handleStart}
                onStop={handleStop}
              />

              {status === "recording" && (
                <RecordingTimer elapsedMs={elapsedMs} />
              )}

              {statusLabel && (
                <p style={styles.statusText}>{statusLabel}</p>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

const styles = {
  page: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    padding:        "2rem 1.5rem 3rem",
    gap:             24,
    minHeight:      "calc(100vh - 60px)",
  },
  header: {
    width:         "100%",
    maxWidth:       720,
    textAlign:     "center",
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    gap:             6,
  },
  categoryLabel: {
    fontFamily:    "'Be Vietnam Pro', sans-serif",
    fontSize:       12,
    fontWeight:     600,
    letterSpacing: "0.06em",
    color:          "#3525cd",
    textTransform: "uppercase",
  },
  pageTitle: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    32,
    fontWeight:  700,
    lineHeight:  1.25,
    color:       "#1b1b24",
    margin:       0,
  },
  actionArea: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:             20,
    width:          "100%",
    maxWidth:        720,
  },
  statusText: {
    fontFamily:    "'Be Vietnam Pro', sans-serif",
    fontSize:       13,
    color:          "#777587",
    letterSpacing: "0.02em",
    margin:          0,
    textAlign:      "center",
  },
  // Loading scoring
  loadingBox: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:             12,
    padding:        "32px 24px",
    background:     "#f5f2ff",
    borderRadius:    12,
    border:         "2px dashed #c7c4d8",
    width:          "100%",
  },
  spinner: {
    width:          40,
    height:         40,
    borderRadius:  "50%",
    border:        "4px solid #e4e1ee",
    borderTopColor: "#3525cd",
    animation:     "sb-spin 0.9s linear infinite",
  },
  loadingText: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    18,
    fontWeight:  600,
    color:       "#1b1b24",
    margin:       0,
  },
  // Scoring error
  scoringErrorBox: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:             12,
    padding:        "24px",
    background:     "#fff3f0",
    borderRadius:    12,
    border:         "1px solid #ffdad6",
    width:          "100%",
  },
  scoringErrorMsg: {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize:    15,
    color:       "#93000a",
    margin:       0,
    textAlign:  "center",
  },
  retryBtn: {
    padding:      "10px 32px",
    borderRadius:  8,
    border:       "2px solid #3525cd",
    background:   "transparent",
    color:        "#3525cd",
    fontFamily:  "'Be Vietnam Pro', sans-serif",
    fontSize:     14,
    fontWeight:   600,
    cursor:       "pointer",
    transition:   "background 0.15s, color 0.15s",
    minHeight:     44,
  },
};
