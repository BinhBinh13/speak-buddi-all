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

/**
 * Xóa tài khoản và dữ liệu cá nhân (S12.2).
 * DELETE /api/profile/account
 * @param {{ confirm_text: string, password?: string }} payload
 */
export const deleteAccount = ({ confirm_text, password }) =>
  apiClient("/api/profile/account", {
    method: "DELETE",
    body: JSON.stringify({
      confirm_text,
      password: password ?? null,
    }),
  });
