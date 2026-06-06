import apiClient from "../../../shared/api/client";

/**
 * Gọi POST /api/translate để dịch text tiếng Anh sang tiếng Việt.
 * @param {string} text - Văn bản tiếng Anh cần dịch
 * @returns {Promise<string>} Bản dịch tiếng Việt
 */
export async function translateText(text) {
  const data = await apiClient("/api/translate", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return data.translation;
}

/**
 * Gọi GET /api/translate/history để lấy 20 bản dịch gần nhất của user (S5.2, AC-07-03).
 * @returns {Promise<Array<{id: string, source_text: string, target_text: string, created_at: string}>>}
 */
export async function getTranslationHistory() {
  const data = await apiClient("/api/translate/history");
  return data.items; // list[{ id, source_text, target_text, created_at }]
}
