// src/shared/auth/AdminRoute.jsx
// Guard cho các route Admin — yêu cầu role='admin'.
// Nếu chưa đăng nhập → redirect /login; nếu không phải admin → redirect /.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin)         return <Navigate to="/" replace />;
  return <Outlet />;
}
