// src/features/conversation/services/conversationService.js
// ─── Gọi POST /speak — xử lý 3 nhánh response (S7.1) ────────────────────────
//
// QUAN TRỌNG: Không dùng apiClient chung vì:
//   1. apiClient parse JSON cứng — không đọc được audio/mpeg blob.
//   2. Cần đọc header X-Reply-Text (percent-encoded).
//   3. Cần phân biệt Content-Type: audio/mpeg vs application/json.
//
// Nhánh response:
//   audio/mpeg  → { replyText, audioUrl }          — happy path
//   json 200    → { replyText, audioUrl: null, ttsError: true }  — TTS lỗi
//   502         → throw Error với .service = "anthropic"          — AI lỗi
// ─────────────────────────────────────────────────────────────────────────────

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

/**
 * Gửi message đến AI và nhận phản hồi.
 *
 * @param {{ text: string, context?: string|null, topic?: object, history?: Array }} param0
 * @returns {Promise<{ replyText: string, audioUrl: string|null, ttsError?: boolean }>}
 * @throws {Error} với `.service = "anthropic"` khi Anthropic lỗi (HTTP 502)
 */
export async function sendMessage({ text, context = null, topic = null, history = [] }) {
  const token = localStorage.getItem("token");

  const body = {
    text,
    ...(context  && { context }),
    ...(topic    && { topic }),
    ...(history.length && { history }),
  };

  const res = await fetch(`${API_URL}/speak`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });

  // ── 429 → Quota hết (S7.2): throw với .quotaDetail để FE hiển thị banner ──
  if (res.status === 429) {
    let detail = {};
    try {
      const parsed = await res.json();
      detail = parsed.detail ?? parsed;
    } catch {
      // body không parse được — giữ detail rỗng
    }
    const err = new Error(
      detail.message || "⏱ Bạn đã dùng hết quota hội thoại AI."
    );
    err.status      = 429;
    err.quotaDetail = detail;
    throw err;
  }

  // ── 502 → Anthropic lỗi: throw với .service để FE hiển thị banner retry ──
  if (res.status === 502) {
    let detail = {};
    try {
      const parsed = await res.json();
      detail = parsed.detail ?? parsed;
    } catch {
      // body không parse được — giữ detail rỗng
    }
    const err = new Error(
      detail.message || detail.detail || "AI service error"
    );
    err.service = detail.service || "anthropic";
    err.status  = 502;
    throw err;
  }

  // ── Lỗi HTTP khác (400, 500, v.v.) ────────────────────────────────────────
  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}));
    const err    = new Error(parsed.detail || "Something went wrong");
    err.status   = res.status;
    throw err;
  }

  // ── Kiểm tra Content-Type để phân nhánh ───────────────────────────────────
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("audio/mpeg")) {
    // Happy path: Claude OK + TTS OK → trả audio blob + X-Reply-Text header
    const xReplyText = res.headers.get("X-Reply-Text") ?? "";
    const replyText  = xReplyText ? decodeURIComponent(xReplyText) : "(no reply)";
    const blob       = await res.blob();
    const audioUrl   = URL.createObjectURL(blob);
    return { replyText, audioUrl };
  }

  if (contentType.includes("application/json")) {
    // TTS fallback: Claude OK nhưng ElevenLabs lỗi → 200 JSON
    const data = await res.json();
    return {
      replyText: data.reply_text ?? "",
      audioUrl:  null,
      ttsError:  data.tts_error === true,
    };
  }

  // Không nhận ra Content-Type — ném lỗi generic
  throw new Error(`Unexpected content-type: ${contentType}`);
}
