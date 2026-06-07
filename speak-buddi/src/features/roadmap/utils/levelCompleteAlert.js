const DISMISS_KEY = "sb_level_complete_alert_dismissed";

export function isLevelCompleteDismissed(level) {
  try {
    return sessionStorage.getItem(`${DISMISS_KEY}_${level}`) === "1";
  } catch {
    return false;
  }
}

export function dismissLevelCompleteAlert(level) {
  try {
    sessionStorage.setItem(`${DISMISS_KEY}_${level}`, "1");
  } catch {
    // ignore
  }
}
