// speak-buddi/src/features/analytics/services/analyticsService.js
// ─── Service gọi API thống kê học tập cá nhân ────────────────────────────────

import apiClient from "../../../shared/api/client";

export function getUserAnalyticsOverview() {
  return apiClient("/api/user/analytics/overview");
}

/**
 * @param {{ metric?: "words" | "quizzes", range?: "7d" | "30d" | "year" }} params
 */
export function getUserActivitySeries({ metric = "words", range = "7d" } = {}) {
  const params = new URLSearchParams({ metric, range });
  return apiClient(`/api/user/analytics/activity?${params.toString()}`);
}
