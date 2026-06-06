// src/shared/auth/AuthContext.jsx
// AuthContext — nguồn sự thật duy nhất về trạng thái xác thực phía FE.
// Đọc access token từ localStorage khi mount; lắng nghe "storage" event (đa tab) và
// custom event "auth-changed" (trong cùng tab) để re-render guard / navbar.
// S1.5: mở rộng login() nhận { access_token, refresh_token }; logout() xóa cả 2.
import { createContext, useContext, useEffect, useState } from "react";
import { getToken, setTokens, clearTokens } from "../services/authService";

// ── Helpers ─────────────────────────────────────────────────────────────────
const AUTH_CHANGED = "auth-changed";

function dispatchAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED));
}

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());

  // Đồng bộ khi tab khác thay đổi localStorage
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === "token") {
        setToken(e.newValue || null);
      }
    }
    function handleAuthChanged() {
      setToken(getToken());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_CHANGED, handleAuthChanged);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_CHANGED, handleAuthChanged);
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  /**
   * Lưu token sau login / register thành công.
   * @param {{ access_token: string, refresh_token: string }} tokens
   */
  function login(tokens) {
    setTokens(tokens);
    setToken(tokens.access_token);
    dispatchAuthChanged();
  }

  /**
   * Xóa access + refresh token (đăng xuất).
   * Không tự navigate — caller tự điều hướng để tránh dependency vòng.
   */
  function logout() {
    clearTokens();
    setToken(null);
    dispatchAuthChanged();
  }

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
