// src/features/quiz/services/quizService.js
// ─── Quiz API service (S4.2 + S4.3) ──────────────────────────────────────────
//
// Gọi REST API backend cho nhóm Quiz/Test.
// Pattern: bám vocabularyService.js (import apiClient, export async functions).
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "../../../shared/api/client";

/**
 * Lấy danh sách bài kiểm tra active, lọc theo level và/hoặc topic.
 * S4.5: hỗ trợ filter kết hợp; trả kèm attempt_count.
 * @param {{ levelId?: string, topicId?: string }} params
 * @returns {Promise<VocabularyTestWithAttemptCountOut[]>}
 */
export async function getTests({ levelId, topicId } = {}) {
  const qs = new URLSearchParams();
  if (topicId) qs.set("topic_id", topicId);
  if (levelId) qs.set("level_id", levelId);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiClient(`/api/tests${query}`);
}

/**
 * Lấy danh sách bài kiểm tra active của 1 topic (alias cho getTests — backward compat).
 * @param {string} topicId — UUID string
 * @returns {Promise<VocabularyTestWithAttemptCountOut[]>}
 */
export async function getTestsByTopic(topicId) {
  return getTests({ topicId });
}

/**
 * Lấy metadata 1 bài kiểm tra.
 * @param {string} testId — UUID string
 * @returns {Promise<VocabularyTestOut>}
 */
export async function getTest(testId) {
  return apiClient(`/api/tests/${testId}`);
}

/**
 * Lấy toàn bộ câu hỏi + đáp án của bài kiểm tra.
 * @param {string} testId — UUID string
 * @returns {Promise<QuizQuestionOut[]>}
 */
export async function getQuestions(testId) {
  return apiClient(`/api/tests/${testId}/questions`);
}

/**
 * Bắt đầu lượt làm bài mới — tạo attempt trên server (S4.3).
 * @param {string} testId — UUID string
 * @returns {Promise<QuizAttemptOut>}
 */
export async function startAttempt(testId) {
  return apiClient(`/api/tests/${testId}/attempts`, { method: "POST" });
}

/**
 * Nộp bài kiểm tra — gửi danh sách câu trả lời lên server (S4.3).
 * @param {string} attemptId — UUID string
 * @param {{ answers: QuizAttemptAnswerSubmit[] }} body
 * @returns {Promise<QuizAttemptOut>}
 */
export async function submitAttempt(attemptId, body) {
  return apiClient(`/api/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Lấy kết quả đầy đủ 1 lượt làm bài sau khi nộp (S4.4).
 * @param {string} attemptId — UUID string
 * @returns {Promise<QuizAttemptResultOut>}
 */
export async function getAttemptResult(attemptId) {
  return apiClient(`/api/attempts/${attemptId}/result`);
}
