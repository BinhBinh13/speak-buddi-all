// src/features/conversation/services/conversationService.js
// ─── Gọi POST /speak — xử lý 3 nhánh response (S7.1) ────────────────────────
//
// Dùng authenticatedFetch (auth middleware) — vẫn giữ logic phân nhánh
// audio/mpeg vs JSON vì apiClient parse JSON cứng.
//
// Nhánh response:
//   audio/mpeg  → { replyText, audioUrl }          — happy path
//   json 200    → { replyText, audioUrl: null, ttsError: true }  — TTS lỗi
//   502         → throw Error với .service = "anthropic"          — AI lỗi
// ─────────────────────────────────────────────────────────────────────────────

import { authenticatedFetch } from "../../../shared/api/authMiddleware";

/**
 * Gửi message đến AI và nhận phản hồi.
 *
 * @param {{ text: string, context?: string|null, topic?: object, history?: Array }} param0
 * @returns {Promise<{ replyText: string, audioUrl: string|null, ttsError?: boolean }>}
 * @throws {Error} với `.service = "anthropic"` khi Anthropic lỗi (HTTP 502)
 */
export async function sendMessage({ text, context = null, topic = null, history = [] }) {
  const body = {
    text,
    ...(context  && { context }),
    ...(topic    && { topic }),
    ...(history.length && { history }),
  };

  const res = await authenticatedFetch("/speak", {
    method: "POST",
    body:   JSON.stringify(body),
  });

  if (!res) {
    const err = new Error("Phiên đăng nhập hết hạn.");
    err.status = 401;
    throw err;
  }

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

  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}));
    const err    = new Error(parsed.detail || "Something went wrong");
    err.status   = res.status;
    throw err;
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("audio/mpeg")) {
    const xReplyText = res.headers.get("X-Reply-Text") ?? "";
    const replyText  = xReplyText ? decodeURIComponent(xReplyText) : "(no reply)";
    const blob       = await res.blob();
    const audioUrl   = URL.createObjectURL(blob);
    return { replyText, audioUrl };
  }

  if (contentType.includes("application/json")) {
    const data = await res.json();
    return {
      replyText: data.reply_text ?? "",
      audioUrl:  null,
      ttsError:  data.tts_error === true,
    };
  }

  throw new Error(`Unexpected content-type: ${contentType}`);
}
