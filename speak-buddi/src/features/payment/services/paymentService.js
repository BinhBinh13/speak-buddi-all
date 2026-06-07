import apiClient from "../../../shared/api/client";

/**
 * Gọi POST /api/payment/checkout để khởi tạo giao dịch thanh toán (S8.1, AC-10-01).
 * BE tạo `payment_transaction` (status='pending') và trả `redirect_url` để
 * điều hướng người dùng sang payment provider (hoặc màn mock-pay nội bộ).
 * @param {string} planId - UUID của payment_plan (lấy từ getPlans())
 * @returns {Promise<{transaction_id: string, redirect_url: string, provider: string, amount_vnd: number}>}
 */
export async function startCheckout(planId) {
  return apiClient("/api/payment/checkout", {
    method: "POST",
    body: JSON.stringify({ plan_id: planId }),
  });
}

/**
 * Gọi GET /api/payment/plans để lấy danh sách gói trả phí đang active.
 * Dùng cho trang Pricing — cần `plan_id` UUID thật để gọi startCheckout().
 * @returns {Promise<Array<{id: string, name: string, price_vnd: number, duration_days: number, description: ?string, features: ?string[], sort_order: number}>>}
 */
export async function getPlans() {
  return apiClient("/api/payment/plans");
}

/**
 * Gọi POST /api/payment/webhook/mock để giả lập callback từ payment provider
 * (S8.2, AC-10-02 — dev/QA). BE xác thực + map về transaction qua `provider_ref`,
 * kích hoạt `user_subscription` (status='active') khi `result === "success"`,
 * set user thành Paid User. Endpoint webhook KHÔNG yêu cầu JWT (gọi như server
 * provider thật) — apiClient vẫn gửi Authorization nếu có token nhưng BE bỏ qua.
 * @param {{ provider_ref: string, result: "success"|"failed"|"cancelled", amount_vnd?: number }} body
 * @returns {Promise<{ success: boolean }>}
 */
export async function simulateMockCallback({ provider_ref, result, amount_vnd }) {
  return apiClient("/api/payment/webhook/mock", {
    method: "POST",
    body: JSON.stringify({ provider_ref, result, ...(amount_vnd != null && { amount_vnd }) }),
  });
}

/**
 * Gọi GET /api/payment/transaction/{id} để lấy trạng thái THẬT của 1 giao dịch
 * (S8.3, AC-10-03 — màn kết quả thanh toán). BE lọc theo user_id (chống IDOR).
 * Dùng để hiển thị `status`/`failure_reason` chính xác thay vì chỉ tin query
 * param trên URL (có thể bị sửa tay).
 * @param {string} transactionId - UUID của payment_transaction
 * @returns {Promise<{id: string, status: string, failure_reason: ?string, plan_id: string, plan_name: string, amount_vnd: number, provider: string, payment_code: ?string, bank_account_number: ?string, bank_code: ?string, created_at: ?string, pending_timeout_seconds: number}>}
 */
export async function getTransaction(transactionId) {
  return apiClient(`/api/payment/transaction/${encodeURIComponent(transactionId)}`);
}

/**
 * Gọi POST /api/payment/cancel để báo hủy giao dịch đang chờ xử lý (S8.3,
 * AC-10-03). Sepay không gửi webhook fail/cancel — "hủy" luôn là hành vi
 * client (user bấm Hủy / rời màn thanh toán), nên BE cần endpoint riêng.
 * Giữ nguyên gói/subscription hiện tại của user; idempotent (gọi lại không lỗi).
 * @param {string} transactionId - UUID của payment_transaction
 * @returns {Promise<{ status: "cancelled"|"failed"|"success" }>}
 */
export async function cancelCheckout(transactionId) {
  return apiClient("/api/payment/cancel", {
    method: "POST",
    body: JSON.stringify({ transaction_id: transactionId }),
  });
}
