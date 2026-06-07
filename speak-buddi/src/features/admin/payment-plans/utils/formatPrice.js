// speak-buddi/src/features/admin/payment-plans/utils/formatPrice.js
// Format price_vnd (integer VND) cho card admin — bám mockup quan_li_goi_thanh_toan_admin

export function formatPlanPrice(priceVnd) {
  const n = Number(priceVnd) || 0;
  if (n === 0) return "0 ₫";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const label = Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
    return `${label} ₫`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    const label = Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
    return `${label} ₫`;
  }
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

export function formatDurationLabel(days) {
  const d = Number(days) || 0;
  if (d === 0) return "/ forever";
  if (d === 30) return "/ month";
  if (d === 365) return "/ year";
  return `/ ${d} ngày`;
}
