// src/shared/services/apiClient.js
// S1.5: thêm refresh interceptor — khi gặp 401, thử refresh access token 1 lần,
// retry request gốc; nếu refresh thất bại → clear tokens + redirect /login với
// thông báo phiên hết hạn.
import { refreshAccessToken, clearTokens } from "./authService";

// S1.1: chuẩn hóa sang VITE_API_BASE_URL; fallback VITE_API_URL (cũ) rồi localhost.
const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

// ── Tránh loop: các endpoint không được trigger refresh ────────────────────
const NO_REFRESH_PATHS = ["/api/auth/refresh", "/api/auth/login"];

/**
 * Kiểm tra endpoint có nằm trong danh sách không refresh không.
 * @param {string} endpoint
 */
function shouldSkipRefresh(endpoint) {
  return NO_REFRESH_PATHS.some((p) => endpoint.includes(p));
}

// ── Thực hiện 1 request fetch (dùng chung cho lần đầu và retry) ──────────────
async function doFetch(endpoint, options = {}, overrideToken = null) {
  const token = overrideToken ?? localStorage.getItem("token");

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
}

// ── apiClient ─────────────────────────────────────────────────────────────────
const apiClient = async (endpoint, options = {}) => {
  let res = await doFetch(endpoint, options);

  // ── 401 → thử refresh token (chỉ 1 lần, không đệ quy) ──────────────────
  if (res.status === 401 && !shouldSkipRefresh(endpoint)) {
    try {
      const newAccess = await refreshAccessToken();
      // Retry request gốc với access token mới
      res = await doFetch(endpoint, options, newAccess);
    } catch {
      // Refresh thất bại → đá người dùng ra login
      clearTokens();
      sessionStorage.setItem(
        "auth_msg",
        "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
      );
      window.location.href = "/login";
      return;
    }
  }

  // ── Vẫn 401 sau retry → kick về login (chỉ áp với protected route, không áp auth endpoint) ──
  if (res.status === 401 && !shouldSkipRefresh(endpoint)) {
    clearTokens();
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Something went wrong");
  }

  return res.json();
};

export default apiClient;
