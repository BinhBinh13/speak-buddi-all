/**
 * Auth middleware — gắn Bearer token, tự refresh khi 401, redirect login khi hết phiên.
 * Dùng cho mọi request cần JWT (JSON, blob, PATCH/DELETE, v.v.).
 */
import { API_URL } from "./config";
import { refreshAccessToken, clearTokens } from "../auth/authService";

const NO_REFRESH_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/google",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

/** @type {Promise<string>|null} Dedup refresh khi nhiều request 401 cùng lúc. */
let refreshInFlight = null;

export function dispatchAuthChanged() {
  window.dispatchEvent(new Event("auth-changed"));
}

function shouldSkipRefresh(endpoint) {
  return NO_REFRESH_PATHS.some((p) => endpoint.includes(p));
}

/**
 * Xóa token và chuyển về trang đăng nhập.
 * @param {string} [message]
 */
export function kickToLogin(message) {
  clearTokens();
  dispatchAuthChanged();
  if (message) {
    sessionStorage.setItem("auth_msg", message);
  }
  window.location.href = "/login";
}

async function refreshWithDedup() {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function buildAuthHeaders(options, token) {
  const headers = { ...(options.headers || {}) };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"] &&
    !headers["content-type"]
  ) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function rawFetch(endpoint, options = {}, overrideToken = null) {
  const token = overrideToken ?? localStorage.getItem("token");
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: buildAuthHeaders(options, token),
  });
}

/**
 * Fetch có auth + xử lý 401 (refresh 1 lần rồi retry).
 * @param {string} endpoint — path tương đối, vd `/api/profile/level`
 * @param {RequestInit} [options]
 * @returns {Promise<Response|null>} null nếu đã redirect về `/login`
 */
export async function authenticatedFetch(endpoint, options = {}) {
  const skipRefresh = shouldSkipRefresh(endpoint);
  let res = await rawFetch(endpoint, options);

  if (res.status === 401 && !skipRefresh) {
    try {
      const newAccess = await refreshWithDedup();
      dispatchAuthChanged();
      res = await rawFetch(endpoint, options, newAccess);
    } catch {
      kickToLogin("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return null;
    }
  }

  if (res.status === 401 && !skipRefresh) {
    kickToLogin();
    return null;
  }

  return res;
}

export { API_URL };
