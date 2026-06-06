// src/shared/services/authService.js
import apiClient from "./apiClient";

const API_URL = import.meta.env.VITE_API_URL;

// ── Token storage keys ────────────────────────────────────────────────────────
const KEY_ACCESS  = "token";
const KEY_REFRESH = "refresh_token";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken        = () => localStorage.getItem(KEY_ACCESS);
export const getRefreshToken = () => localStorage.getItem(KEY_REFRESH);

/**
 * Lưu cặp access + refresh token vào localStorage.
 * @param {{ access_token: string, refresh_token: string }} tokens
 */
export function setTokens({ access_token, refresh_token }) {
  localStorage.setItem(KEY_ACCESS, access_token);
  if (refresh_token) {
    localStorage.setItem(KEY_REFRESH, refresh_token);
  }
}

/** Xóa cả access + refresh token (đăng xuất hoàn toàn). */
export function clearTokens() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
}

// ── Auth API calls ────────────────────────────────────────────────────────────
export const loginWithEmail = (email, password) =>
  apiClient("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (name, email, password) =>
  apiClient("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

/**
 * Làm mới access token bằng refresh token hiện tại.
 * Trả về access_token mới; lỗi → throw để caller xử lý.
 */
export async function refreshAccessToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new Error("No refresh token");

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Refresh failed");
  }

  const data = await res.json();
  localStorage.setItem(KEY_ACCESS, data.access_token);
  return data.access_token;
}

export const loginWithGoogle = () => {
  window.location.href = `${API_URL}/oauth2/authorization/google`;
};

/** @deprecated Dùng clearTokens() thay thế. Giữ lại để không vỡ các caller cũ. */
export const logout = () => {
  clearTokens();
  window.location.href = "/login";
};

export const isAuthenticated = () => !!localStorage.getItem(KEY_ACCESS);
