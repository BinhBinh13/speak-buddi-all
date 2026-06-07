// speak-buddi/src/features/admin/services/analyticsService.js
// ─── Service gọi API Admin Analytics (S11.1 + S11.2) ────────────────────────

import apiClient from "../../../shared/api/client";

export async function getOverview() {
  return apiClient("/api/admin/analytics/overview");
}

/**
 * @param {"users"|"revenue"} [metric="users"]
 * @param {"7d"|"30d"|"year"} [range="7d"]
 * @param {{ planId?: string }} [options]
 */
export async function getTimeseries(metric = "users", range = "7d", options = {}) {
  const params = new URLSearchParams({ metric, range });
  if (options.planId && metric === "revenue") {
    params.set("plan_id", options.planId);
  }
  return apiClient(`/api/admin/analytics/timeseries?${params.toString()}`);
}

/**
 * Doanh thu đã lọc (AC-12-02) — GET /api/admin/analytics/revenue
 *
 * @param {{
 *   granularity?: "day"|"month"|"year"|"total",
 *   from?: string,
 *   to?: string,
 *   planId?: string,
 * }} [filters]
 */
export async function getRevenueFiltered(filters = {}) {
  const params = new URLSearchParams();
  params.set("granularity", filters.granularity || "month");
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.planId) params.set("plan_id", filters.planId);
  return apiClient(`/api/admin/analytics/revenue?${params.toString()}`);
}
