// src/shared/auth/AuthContext.jsx
// AuthContext — nguồn sự thật duy nhất về trạng thái xác thực phía FE.
// Đọc access token từ localStorage khi mount; lắng nghe "storage" event (đa tab) và
// custom event "auth-changed" (trong cùng tab) để re-render guard / navbar.
// S1.8: thêm user object, isAdmin, isPaid từ server response.
import { createContext, useContext, useEffect, useState } from "react";
import { getToken, setTokens, clearTokens, getUser, setUser } from "../services/authService";

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
  const [user, setUserState] = useState(() => getUser());

  // Đồng bộ khi tab khác thay đổi localStorage
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === "token") setToken(e.newValue || null);
      if (e.key === "user_info") {
        try { setUserState(e.newValue ? JSON.parse(e.newValue) : null); }
        catch { setUserState(null); }
      }
    }
    function handleAuthChanged() {
      setToken(getToken());
      setUserState(getUser());
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
   * Lưu token + user sau login / register thành công.
   * @param {{ access_token: string, refresh_token: string, user?: object }} data
   */
  function login({ access_token, refresh_token, user: userData }) {
    setTokens({ access_token, refresh_token });
    if (userData) setUser(userData);
    setToken(access_token);
    setUserState(userData || null);
    dispatchAuthChanged();
  }

  /**
   * Xóa access + refresh token và user object (đăng xuất).
   * Không tự navigate — caller tự điều hướng để tránh dependency vòng.
   */
  function logout() {
    clearTokens();
    setToken(null);
    setUserState(null);
    dispatchAuthChanged();
  }

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    isPaid:  !!user?.is_paid,
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
