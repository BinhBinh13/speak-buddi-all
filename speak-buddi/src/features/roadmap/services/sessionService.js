// src/features/roadmap/services/sessionService.js
// ─── Session progress + User topic API calls (S2.5) ──────────────────────────
//
// Endpoints wrap:
//   getTopicSessionSummary(topicId)            → GET /api/topics/:id/session-summary
//   startSession(topicId, { batchIndex, batchSize }) → PUT /api/topics/:id/sessions/progress status=in_progress
//   getTopicWords(topicId)                     → GET /api/topics/:id/words (reuse S3.2)
//   addUserTopic(topicId)                      → POST /api/user/topics
//   removeUserTopic(topicId)                   → DELETE /api/user/topics/:id
//   getUserTopics()                            → GET /api/user/topics
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "../../../shared/api/client";

/**
 * Lấy thông tin batch session để FE tính navigate sang AI conversation.
 * @param {string} topicId
 * @returns {Promise<{topic_id, total_words, batch_size, total_batches, resume_batch_index}>}
 */
export async function getTopicSessionSummary(topicId) {
  return apiClient(`/api/topics/${topicId}/session-summary`);
}

/**
 * Đánh dấu batch hiện tại là in_progress (gọi trước khi navigate /conversation).
 * @param {string} topicId
 * @param {{ batchIndex: number, batchSize: number }} param1
 * @returns {Promise<Object>}
 */
export async function startSession(topicId, { batchIndex, batchSize }) {
  return apiClient(`/api/topics/${topicId}/sessions/progress`, {
    method: "PUT",
    body: JSON.stringify({ batch_index: batchIndex, batch_size: batchSize, status: "in_progress" }),
  });
}

/**
 * Lấy toàn bộ từ của topic — FE slice client-side theo batch.
 * Reuse endpoint GET /api/topics/:id/words (S3.2).
 * @param {string} topicId
 * @returns {Promise<Array>}
 */
export async function getTopicWords(topicId) {
  return apiClient(`/api/topics/${topicId}/words`);
}

/**
 * Thêm topic vào danh sách học của user.
 * @param {string} topicId
 * @returns {Promise<Object>}  UserTopicOut
 */
export async function addUserTopic(topicId) {
  return apiClient("/api/user/topics", {
    method: "POST",
    body: JSON.stringify({ topic_id: topicId }),
  });
}

/**
 * Xoá topic khỏi danh sách học của user.
 * @param {string} topicId
 * @returns {Promise<void>}  — 204 No Content, apiClient trả null
 */
export async function removeUserTopic(topicId) {
  return apiClient(`/api/user/topics/${topicId}`, { method: "DELETE" });
}

/**
 * Đánh dấu batch hiện tại là completed (gọi khi đủ từ đã được luyện).
 * @param {string} topicId
 * @param {{ batchIndex: number, batchSize: number }} param1
 * @returns {Promise<Object>}
 */
export async function completeSession(topicId, { batchIndex, batchSize }) {
  return apiClient(`/api/topics/${topicId}/sessions/progress`, {
    method: "PUT",
    body: JSON.stringify({ batch_index: batchIndex, batch_size: batchSize, status: "completed" }),
  });
}

/**
 * Danh sách topic user đã add vào danh sách học.
 * @returns {Promise<Array<{topic_id, topic_name, topic_slug, level_code, level_name, total_words, known_count, added_at}>>}
 */
export async function getUserTopics() {
  return apiClient("/api/user/topics");
}
