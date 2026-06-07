// src/features/conversation/services/quotaService.js
// ─── Quota AI: đọc trạng thái quota từ GET /api/ai/quota (S7.2) ──────────────

import { authenticatedFetch } from "../../../shared/api/authMiddleware";

/**
 * Lấy trạng thái quota AI của user đang đăng nhập.
 *
 * @returns {Promise<{
 *   is_paid: boolean,
 *   unlimited: boolean,
 *   used_seconds: number,
 *   max_seconds: number,
 *   remaining_seconds: number,
 *   reset_at: string|null,
 *   is_exceeded: boolean
 * }>}
 * @throws {Error} nếu không lấy được (mạng lỗi hoặc server lỗi)
 */
export async function getQuotaStatus() {
  const res = await authenticatedFetch("/api/ai/quota");

  if (!res) {
    const err = new Error("Phiên đăng nhập hết hạn.");
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const err = new Error("quota fetch failed");
    err.status = res.status;
    throw err;
  }

  return res.json();
}
