// src/features/profile/services/profileService.js
// ─── Profile API calls (S2.3) ─────────────────────────────────────────────────

import apiClient from "../../../shared/api/client";

/**
 * Cập nhật trình độ CEFR trong profile.
 * PATCH /api/profile/level
 * @param {string} level - "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
 * @returns {Promise<{ level: string, onboarding_completed: boolean }>}
 */
export const updateLevel = (level) =>
  apiClient("/api/profile/level", {
    method: "PATCH",
    body: JSON.stringify({ level }),
  });
