// src/features/roadmap/services/roadmapService.js
// ─── Roadmap API calls (S2.2) ─────────────────────────────────────────────────

import apiClient from "../../../shared/api/client";

/**
 * Lấy roadmap cá nhân hóa của user hiện tại.
 * Yêu cầu JWT hợp lệ trong localStorage ("token").
 *
 * @returns {Promise<{
 *   level: string,
 *   level_name: string,
 *   total_topics: number,
 *   selected_topics: number,
 *   nodes: Array<{
 *     id: string,
 *     name: string,
 *     slug: string,
 *     description: string | null,
 *     order_index: number,
 *     is_interest: boolean,
 *     status: string,
 *     word_count: number,
 *   }>
 * }>}
 */
export const getRoadmap = () => apiClient("/api/roadmap");
