// speak-buddi/src/features/pronunciation/services/pronunciationService.js
// ─── Service gọi API chấm phát âm (S6.2) + lịch sử (S6.3) ───────────────────
//
// Tái dùng apiClient từ shared/api/client.js để có auth header (Bearer token)
// + auto-refresh token khi 401.
//
// Không log transcript đầy đủ (SRS §4.5).

import apiClient from "../../../shared/api/client";

/**
 * Gọi POST /api/pronunciation/score.
 *
 * @param {{ target_text: string, transcript: string, topic_word_id?: string }} params
 * @returns {Promise<{
 *   attempt_id: string,
 *   overall: number,
 *   accuracy: number,
 *   fluency: number,
 *   syllables: Array<{ text: string, score: number }>,
 *   feedback: string
 * }>}
 * @throws {Error} với message từ backend (detail) hoặc network error
 */
export async function scorePronunciation({ target_text, transcript, topic_word_id = null }) {
  const data = await apiClient("/api/pronunciation/score", {
    method:  "POST",
    body:    JSON.stringify({ target_text, transcript, topic_word_id }),
  });
  return data;
}

// ─── S6.3: History helpers ────────────────────────────────────────────────────

/**
 * Lấy lịch sử luyện phát âm của user hiện tại.
 *
 * @param {{ limit?: number, offset?: number }} options
 * @returns {Promise<{
 *   items: Array<{
 *     id: string,
 *     target_text: string,
 *     overall_score: number | null,
 *     accuracy_score: number | null,
 *     fluency_score: number | null,
 *     feedback: string | null,
 *     created_at: string
 *   }>,
 *   total: number,
 *   limit: number,
 *   offset: number
 * }>}
 * @throws {Error} với message từ backend hoặc network error
 */
export async function getPronunciationHistory({ limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  const data = await apiClient(`/api/pronunciation/history?${params.toString()}`);
  return data;
}
