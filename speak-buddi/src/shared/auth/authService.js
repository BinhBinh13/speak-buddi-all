import apiClient from "../api/client";

const API_URL = import.meta.env.VITE_API_URL;

// ── Token storage keys ────────────────────────────────────────────────────────
const KEY_ACCESS  = "token";
const KEY_REFRESH = "refresh_token";
const KEY_USER    = "user_info";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken        = () => localStorage.getItem(KEY_ACCESS);
export const getRefreshToken = () => localStorage.getItem(KEY_REFRESH);

export function getUser() {
  try {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (user) localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY_USER);
}

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

/** Xóa access + refresh token và user object (đăng xuất hoàn toàn). */
export function clearTokens() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  clearUser();
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

/**
 * Khởi động Google OAuth qua GSI popup (One Tap / button fallback).
 * S1.6: FE-driven flow — nhận id_token từ GSI, POST /api/auth/google, trả JWT.
 * Resolve với response data { access_token, refresh_token, user }.
 * Reject với Error nếu thất bại hoặc người dùng hủy.
 */
export function loginWithGoogle() {
  return new Promise((resolve, reject) => {
    // Kiểm tra GSI đã load chưa
    if (typeof window === "undefined" || !window.google?.accounts?.id) {
      reject(new Error("Google Identity Services chưa tải xong. Vui lòng thử lại."));
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      reject(new Error("Cấu hình Google OAuth chưa được thiết lập."));
      return;
    }

    // Khởi tạo GSI với callback nhận id_token
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (!response.credential) {
          reject(new Error("Đăng nhập Google bị hủy hoặc không nhận được credential."));
          return;
        }
        try {
          const data = await apiClient("/api/auth/google", {
            method: "POST",
            body: JSON.stringify({ id_token: response.credential }),
          });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Thử One Tap prompt trước
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: render button ẩn và click tự động (tránh popup blocker)
        const containerId = "__gsi_btn_container__";
        let container = document.getElementById(containerId);
        if (!container) {
          container = document.createElement("div");
          container.id = containerId;
          container.style.cssText = "position:fixed;top:-9999px;left:-9999px;visibility:hidden;";
          document.body.appendChild(container);
        }

        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
        });

        // Click nút Google được render (trigger popup chọn tài khoản)
        const btn = container.querySelector("div[role='button']");
        if (btn) {
          btn.click();
        } else {
          reject(new Error("Đăng nhập Google không khả dụng. Vui lòng thử lại."));
        }
      }
    });
  });
}

// ── Password reset (S1.7) ─────────────────────────────────────────────────────

/**
 * Gửi yêu cầu đặt lại mật khẩu qua email.
 * BE luôn trả 200 dù email tồn tại hay không (chống user enumeration).
 * @param {string} email
 */
export const forgotPassword = (email) =>
  apiClient("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

/**
 * Đặt lại mật khẩu bằng token nhận từ email.
 * @param {string} token - raw token từ query param ?token=
 * @param {string} new_password - mật khẩu mới (≥8 ký tự, ≥1 chữ số)
 */
export const resetPassword = (token, new_password) =>
  apiClient("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });

/** @deprecated Dùng clearTokens() thay thế. Giữ lại để không vỡ các caller cũ. */
export const logout = () => {
  clearTokens();
  window.location.href = "/login";
};

export const isAuthenticated = () => !!localStorage.getItem(KEY_ACCESS);
