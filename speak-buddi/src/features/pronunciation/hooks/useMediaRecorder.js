// speak-buddi/src/features/pronunciation/hooks/useMediaRecorder.js
// State machine: idle → recording → processing → done / error
// Không log audio content (SRS §4.5).

import { useState, useRef, useEffect, useCallback } from "react";
import { mapGetUserMediaError, NOAUDIO_ERROR } from "../services/micErrors";

/**
 * Hook ghi âm qua MediaRecorder API.
 *
 * @param {{ maxDurationMs?: number }} options
 * @returns {{
 *   status: "idle"|"recording"|"processing"|"done"|"error",
 *   error: { code: string, message: string } | null,
 *   elapsedMs: number,
 *   audioBlob: Blob | null,
 *   start: () => void,
 *   stop: () => void,
 *   reset: () => void,
 * }}
 */
export default function useMediaRecorder({ maxDurationMs = 15000 } = {}) {
  const [status,    setStatus]    = useState("idle");
  const [error,     setError]     = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  // Refs — stable across renders, safe to use inside callbacks without deps
  const streamRef    = useRef(null);
  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);
  const timerRef     = useRef(null);
  const autoStopRef  = useRef(null);
  const mountedRef   = useRef(true);

  // Gom 4 điểm lặp clearInterval/clearTimeout thành 1 helper
  const clearTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current);   timerRef.current   = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  }, []);

  // Đánh dấu unmount → cleanup khi rời trang (tắt đèn mic)
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [clearTimers]);

  // ── start ─────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    // Kiểm tra hỗ trợ trước — KHÔNG gọi getUserMedia nếu thiếu API
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError({
        code:    "unsupported",
        message: "🎤 Trình duyệt không hỗ trợ. Vui lòng dùng Chrome hoặc Edge.",
      });
      setStatus("error");
      return;
    }

    // Dọn dẹp phiên ghi cũ
    clearTimers();
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    recorderRef.current = null;
    chunksRef.current   = [];

    setAudioBlob(null);
    setError(null);
    setElapsedMs(0);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (!mountedRef.current) return;
      setError(mapGetUserMediaError(err));
      setStatus("error");
      return;
    }

    if (!mountedRef.current) {
      // Unmount trong lúc chờ permission → dọn ngay
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (!mountedRef.current) return;
      clearTimers();

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];

      // Tắt đèn mic ngay sau khi ghi xong
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }

      // Threshold thấp hơn: 200 bytes chỉ loại bỏ blob hoàn toàn rỗng.
      // Blob hợp lệ dù nói ngắn 0.5s vẫn thường > 5KB (webm header + data).
      // NOAUDIO_ERROR chỉ dành cho trường hợp mic không thu được gì cả.
      if (blob.size < 200) {
        setError(NOAUDIO_ERROR);
        setStatus("error");
      } else {
        setAudioBlob(blob);
        setStatus("done");
      }
    };

    recorder.start(100);
    setStatus("recording");

    // Đếm ms đã ghi (cho RecordingTimer)
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      if (mountedRef.current) setElapsedMs(Date.now() - startTime);
    }, 200);

    // Auto-stop khi đạt maxDurationMs
    autoStopRef.current = setTimeout(() => {
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
        setStatus("processing");
      }
    }, maxDurationMs);
  }, [maxDurationMs, clearTimers]);

  // ── stop ──────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      setStatus("processing");
    }
    clearTimers();
  }, [clearTimers]);

  // ── reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    clearTimers();
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    recorderRef.current = null;
    chunksRef.current   = [];
    setStatus("idle");
    setError(null);
    setElapsedMs(0);
    setAudioBlob(null);
  }, [clearTimers]);

  return { status, error, elapsedMs, audioBlob, start, stop, reset };
}
