// speak-buddi/src/features/admin/services/analyticsService.js
// ─── Service gọi API Admin Analytics (S11.1) ────────────────────────────────
// Bám theo pattern translateService.js — hàm thuần qua apiClient.

import apiClient from "../../../shared/api/client";

/**
 * Gọi GET /api/admin/analytics/overview — gói tổng quan dashboard
 * (users, revenue, learning, ai_usage) trong 1 lần gọi (AC-12-01, §3.6).
 * Yêu cầu role=admin (BE trả 401/403 nếu không đủ quyền — apiClient sẽ throw).
 *
 * @returns {Promise<{
 *   users: { total: number, free: number, paid: number, new_today: number, new_this_month: number },
 *   revenue: { total_vnd: number, this_month_vnd: number, currency: string, is_estimated: boolean },
 *   learning: { quiz_attempts_total: number, correct_answers: number, wrong_answers: number,
 *               accuracy_percent: number, avg_score_percent: number,
 *               top_words: Array<{ word: string, learned_count: number }> },
 *   ai_usage: { total_minutes: number, conversations: number, is_available: boolean }
 * }>}
 */
export async function getOverview() {
  return apiClient("/api/admin/analytics/overview");
}

/**
 * Gọi GET /api/admin/analytics/timeseries?metric=&range= — dữ liệu chuỗi thời gian
 * cho biểu đồ recharts (User Activity / Revenue).
 *
 * @param {"users"|"revenue"} [metric="users"]
 * @param {"7d"|"30d"|"year"} [range="7d"]
 * @returns {Promise<{ metric: string, range: string, points: Array<{ label: string, value: number }> }>}
 */
export async function getTimeseries(metric = "users", range = "7d") {
  const params = new URLSearchParams({ metric, range });
  return apiClient(`/api/admin/analytics/timeseries?${params.toString()}`);
}
