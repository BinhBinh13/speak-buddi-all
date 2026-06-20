// Google Analytics 4 — thin wrapper around window.gtag
// All calls are no-ops when gtag is not loaded (dev without GA ID, test env, etc.)

const MID = import.meta.env.VITE_GA_MEASUREMENT_ID;

function gtag(...args) {
  if (typeof window.gtag === "function") window.gtag(...args);
}

const PAGE_TITLES = {
  "/":                    "Trang chủ — SpeakBuddi",
  "/login":               "Đăng nhập — SpeakBuddi",
  "/register":            "Đăng ký — SpeakBuddi",
  "/forgot-password":     "Quên mật khẩu — SpeakBuddi",
  "/reset-password":      "Đặt lại mật khẩu — SpeakBuddi",
  "/onboarding":          "Onboarding — SpeakBuddi",
  "/roadmap":             "Lộ trình học — SpeakBuddi",
  "/vocabulary":          "Từ vựng — SpeakBuddi",
  "/quiz":                "Bài kiểm tra — SpeakBuddi",
  "/pronunciation":       "Luyện phát âm — SpeakBuddi",
  "/conversation":        "Hội thoại AI — SpeakBuddi",
  "/translate":           "Dịch thuật — SpeakBuddi",
  "/profile":             "Hồ sơ — SpeakBuddi",
  "/payment/checkout":    "Nâng cấp Pro — SpeakBuddi",
  "/payment/success":     "Thanh toán thành công — SpeakBuddi",
  "/settings/voice":      "Cài đặt giọng đọc — SpeakBuddi",
  "/admin/dashboard":     "Admin Dashboard — SpeakBuddi",
  "/admin/topics":        "Quản lý chủ đề — SpeakBuddi",
  "/admin/vocabulary":    "Quản lý từ vựng — SpeakBuddi",
  "/admin/tests":         "Quản lý bài kiểm tra — SpeakBuddi",
  "/admin/crawler":       "Crawler Langeek — SpeakBuddi",
  "/admin/payments":      "Gói thanh toán — SpeakBuddi",
  "/admin/reports":       "Báo cáo — SpeakBuddi",
  "/privacy":             "Chính sách bảo mật — SpeakBuddi",
  "/terms":               "Điều khoản sử dụng — SpeakBuddi",
  "/contact":             "Liên hệ — SpeakBuddi",
};

/** Call once per route change (replaces the default page_view disabled in index.html). */
export function trackPageView(path) {
  if (!MID) return;
  // Match exact path first, then try prefix (e.g. /quiz/123 → /quiz)
  const title =
    PAGE_TITLES[path] ||
    PAGE_TITLES[Object.keys(PAGE_TITLES).find((k) => k !== "/" && path.startsWith(k))] ||
    document.title;

  document.title = title;
  gtag("event", "page_view", {
    page_path: path,
    page_title: title,
    send_to: MID,
  });
}

/**
 * Send a custom GA4 event.
 * @param {string} eventName  - GA4 event name (snake_case recommended)
 * @param {Record<string, unknown>} [params] - optional event parameters
 *
 * Common events used in speak-buddi:
 *   trackEvent("quiz_started",      { topic, level })
 *   trackEvent("quiz_completed",    { topic, level, score })
 *   trackEvent("vocab_learned",     { word, topic })
 *   trackEvent("pronunciation_scored", { word, score })
 *   trackEvent("conversation_turn", { turn_index })
 *   trackEvent("payment_initiated", { plan_id, amount })
 *   trackEvent("payment_success",   { plan_id, amount })
 */
export function trackEvent(eventName, params = {}) {
  if (!MID) return;
  gtag("event", eventName, { send_to: MID, ...params });
}

/** Set persistent user properties (called after login). */
export function setUserProperties({ userId, level, isPaid }) {
  if (!MID) return;
  gtag("set", "user_properties", {
    user_level: level,
    is_paid: isPaid ? "true" : "false",
  });
  // user_id lets GA stitch sessions — never send PII, only an opaque ID
  if (userId) gtag("config", MID, { user_id: String(userId) });
}

/** Clear user identity on logout. */
export function clearUser() {
  if (!MID) return;
  gtag("config", MID, { user_id: undefined });
}
