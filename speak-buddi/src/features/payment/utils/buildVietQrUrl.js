/** Một số mã BIN ngân hàng phổ biến (VietQR). */
const BANK_LABELS = {
  "970436": "Vietcombank",
  "970422": "MB Bank",
  "970415": "VietinBank",
  "970418": "BIDV",
  "970407": "Techcombank",
  "970432": "VPBank",
  "970403": "Sacombank",
  "970416": "ACB",
  "970423": "TPBank",
};

export function getBankLabel(bankCode) {
  if (!bankCode) return "";
  return BANK_LABELS[bankCode] || `Ngân hàng ${bankCode}`;
}

/**
 * Sinh URL ảnh VietQR động (img.vietqr.io) cho chuyển khoản Sepay.
 * @see https://www.vietqr.io/
 */
export function buildVietQrUrl({ bankCode, accountNumber, amount, paymentCode }) {
  if (!bankCode || !accountNumber) return null;

  const params = new URLSearchParams();
  if (amount != null && amount > 0) params.set("amount", String(amount));
  if (paymentCode) params.set("addInfo", paymentCode);

  const query = params.toString();
  const base = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg`;
  return query ? `${base}?${query}` : base;
}

export function formatVnd(amount) {
  return new Intl.NumberFormat("vi-VN").format(Number(amount) || 0) + " ₫";
}
