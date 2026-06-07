// src/shared/auth/useLogout.js — S1.9: luồng đăng xuất thống nhất (xóa JWT + redirect)
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * @param {{ redirectTo?: string }} [options] — mặc định "/login"
 */
export function useLogout({ redirectTo = "/login" } = {}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useCallback(() => {
    logout();
    navigate(redirectTo, { replace: true });
  }, [logout, navigate, redirectTo]);
}
