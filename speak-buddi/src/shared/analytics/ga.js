// Google Analytics 4 — thin wrapper around window.gtag
// All calls are no-ops when gtag is not loaded (dev without GA ID, test env, etc.)

const MID = import.meta.env.VITE_GA_MEASUREMENT_ID;

function gtag(...args) {
  if (typeof window.gtag === "function") window.gtag(...args);
}

/** Call once per route change (replaces the default page_view disabled in index.html). */
export function trackPageView(path) {
  if (!MID) return;
  gtag("event", "page_view", {
    page_path: path,
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
