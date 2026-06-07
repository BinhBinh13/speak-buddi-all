// src/shared/auth/PaidRoute.jsx
// Guard cho các route yêu cầu gói Pro (is_paid=true).
// Nếu chưa đăng nhập → redirect /login; nếu là free user → redirect /payment/checkout.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PaidRoute() {
  const { isAuthenticated, isPaid, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin)          return <Navigate to="/admin/dashboard" replace />;
  if (!isPaid)          return <Navigate to="/payment/checkout" replace />;
  return <Outlet />;
}
