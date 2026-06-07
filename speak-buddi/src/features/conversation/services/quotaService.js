// src/features/conversation/services/quotaService.js
// ─── Quota AI: đọc trạng thái quota từ GET /api/ai/quota (S7.2) ──────────────
//
// Không dùng apiClient chung vì:
//   1. apiClient parse JSON nhưng không expose response đầy đủ cho 401.
//   2. Cần đọc trạng thái quota của user hiện tại ngay khi mount màn hội thoại.
//
// Trả về:
//   { is_paid, unlimited, used_seconds, max_seconds, remaining_seconds, reset_at, is_exceeded }
// ─────────────────────────────────────────────────────────────────────────────

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

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
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/ai/quota`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    const err = new Error("quota fetch failed");
    err.status = res.status;
    throw err;
  }

  return res.json();
}
