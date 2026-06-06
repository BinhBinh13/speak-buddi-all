// src/features/vocabulary/services/vocabularyService.js
// ─── Vocabulary API calls (S3.2 + S3.3) ───────────────────────────────────────
//
// Wrap apiClient cho 5 endpoint:
//   getLevels()                         → GET /api/levels
//   getTopics(level?)                   → GET /api/topics?level=<code>
//   getWords(topicId)                   → GET /api/topics/{topicId}/words
//   saveWordProgress(topicId, wordId, status) → PUT /api/topics/{topicId}/words/{wordId}/progress
//   getTopicProgress(topicId)           → GET /api/topics/{topicId}/progress
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "../../../shared/services/apiClient";

/**
 * Lấy danh sách 6 level A1–C2.
 * @returns {Promise<Array<{id: string, code: string, name: string, display_order: number}>>}
 */
export async function getLevels() {
  return apiClient("/api/levels");
}

/**
 * Lấy danh sách topic active, tuỳ chọn lọc theo level code.
 * @param {string|null} levelCode  — A1/A2/B1/B2/C1/C2 hoặc null để lấy tất cả
 * @returns {Promise<Array>}
 */
export async function getTopics(levelCode = null) {
  const qs = levelCode ? `?level=${encodeURIComponent(levelCode)}` : "";
  return apiClient(`/api/topics${qs}`);
}

/**
 * Lấy danh sách từ active của topic kèm tags.
 * @param {string} topicId  — UUID của topic
 * @returns {Promise<Array>}
 */
export async function getWords(topicId) {
  return apiClient(`/api/topics/${topicId}/words`);
}

/**
 * Lưu (upsert) tiến độ 1 từ: known hoặc learning.
 * Gọi lại cùng từ → cập nhật status + tăng review_count (không tạo row mới).
 * @param {string} topicId  — UUID của topic
 * @param {string} wordId   — UUID của từ (topic_word.id)
 * @param {'known'|'learning'} status
 * @returns {Promise<{topic_word_id: string, status: string, review_count: number, ...}>}
 */
export async function saveWordProgress(topicId, wordId, status) {
  return apiClient(`/api/topics/${topicId}/words/${wordId}/progress`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

/**
 * Lấy tiến độ tổng hợp của topic cho user hiện tại.
 * Trả về { topic_id, total_words, known_count, learning_count, percent_known, words[] }.
 * words[] chứa các từ đã được đánh dấu (hydrate state từng flashcard).
 * @param {string} topicId  — UUID của topic
 * @returns {Promise<{topic_id: string, total_words: number, known_count: number, learning_count: number, percent_known: number, words: Array}>}
 */
export async function getTopicProgress(topicId) {
  return apiClient(`/api/topics/${topicId}/progress`);
}
