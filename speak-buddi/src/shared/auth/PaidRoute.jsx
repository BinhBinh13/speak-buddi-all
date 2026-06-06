// src/shared/auth/PaidRoute.jsx
// Guard cho các route yêu cầu gói Pro (is_paid=true).
// Nếu chưa đăng nhập → redirect /login; nếu là free user → redirect /pricing.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PaidRoute() {
  const { isAuthenticated, isPaid } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isPaid)          return <Navigate to="/pricing" replace />;
  return <Outlet />;
}
