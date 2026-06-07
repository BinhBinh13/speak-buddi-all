// src/features/support/services/supportService.js
// ─── Support / contact API (S12.3) ───────────────────────────────────────────

import apiClient from "../../../shared/api/client";

/**
 * Gửi form liên hệ / hỗ trợ.
 * POST /api/support/contact (public — token gửi kèm nếu đã đăng nhập)
 * @param {{ name: string, email: string, subject: string, message: string, website?: string }} payload
 */
export const submitContact = (payload) =>
  apiClient("/api/support/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
