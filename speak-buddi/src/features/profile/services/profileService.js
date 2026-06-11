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
 * Cập nhật tên hiển thị.
 * PATCH /api/profile/name
 * @param {string} name
 * @returns {Promise<{ name: string }>}
 */
export const updateName = (name) =>
  apiClient("/api/profile/name", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

/**
 * Đổi hoặc đặt mật khẩu.
 * PATCH /api/profile/password
 * @param {{ current_password?: string, new_password: string }} payload
 */
export const changePassword = ({ current_password, new_password }) =>
  apiClient("/api/profile/password", {
    method: "PATCH",
    body: JSON.stringify({
      current_password: current_password ?? null,
      new_password,
    }),
  });

/**
 * Cập nhật mục tiêu học tập, re-gen roadmap với level hiện tại.
 * PATCH /api/profile/goal
 * @param {string} learning_goal - "travel" | "work" | "communication"
 * @returns {Promise<{ learning_goal: string, roadmap_generated: boolean }>}
 */
export const updateGoal = (learning_goal) =>
  apiClient("/api/profile/goal", {
    method: "PATCH",
    body: JSON.stringify({ learning_goal }),
  });

/**
 * Cập nhật trình độ + mục tiêu học tập cùng lúc, re-gen roadmap 1 lần.
 * PATCH /api/profile/learning
 * @param {{ level: string, learning_goal: string }} payload
 * @returns {Promise<{ level: string, learning_goal: string, roadmap_generated: boolean }>}
 */
export const updateLearning = ({ level, learning_goal }) =>
  apiClient("/api/profile/learning", {
    method: "PATCH",
    body: JSON.stringify({ level, learning_goal }),
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
