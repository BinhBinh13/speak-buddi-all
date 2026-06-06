// src/features/onboarding/services/onboardingService.js
// ─── Onboarding API calls (S2.1) ─────────────────────────────────────────────
import apiClient from "../../../shared/api/client";

/**
 * Lấy danh sách topic theo level đã chọn (bước 2 onboarding).
 * @param {string} level - mã CEFR (A1–C2)
 * @returns {Promise<Array<{id: string, name: string, slug: string}>>}
 */
export const getTopics = (level) =>
  apiClient(`/api/onboarding/topics?level=${encodeURIComponent(level)}`);

/**
 * Gửi kết quả onboarding 4 bước lên server.
 * @param {{ level: string, topics: string[], daily_minutes: number, words_per_session: number }} payload
 * @returns {Promise<{ level: string, topics: string[], daily_minutes: number, words_per_session: number, onboarding_completed: boolean }>}
 */
export const submitOnboarding = (payload) =>
  apiClient("/api/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
