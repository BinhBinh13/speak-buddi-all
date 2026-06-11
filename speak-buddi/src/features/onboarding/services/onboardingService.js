// src/features/onboarding/services/onboardingService.js
// ─── Onboarding API calls (S2.1 revised v2 — scenario-based roadmap) ─────────
import apiClient from "../../../shared/api/client";

/**
 * Gửi kết quả onboarding 3 bước lên server.
 * @param {{
 *   level: string,
 *   learning_goal: string,
 *   words_per_session: number
 * }} payload
 * @returns {Promise<{
 *   level: string,
 *   learning_goal: string,
 *   words_per_session: number,
 *   onboarding_completed: boolean,
 *   roadmap_generated: boolean
 * }>}
 */
export const submitOnboarding = (payload) =>
  apiClient("/api/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
