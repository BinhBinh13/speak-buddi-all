/**
 * Map gói Pro → plan_id UUID từ GET /api/payment/plans.
 * Chọn gói trả phí có sort_order nhỏ nhất (gói mặc định).
 */
export function resolveProPlanId(plans) {
  const paid = plans.filter((p) => p.price_vnd > 0);
  if (paid.length === 0) return null;
  return paid.reduce((min, p) => (p.sort_order < min.sort_order ? p : min), paid[0]).id;
}

export const PAYMENT_CHECKOUT_PATH = "/payment/checkout";
