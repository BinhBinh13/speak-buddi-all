// src/shared/auth/ProtectedRoute.jsx
// Guard wrapper — chặn Guest truy cập route bảo vệ.
// Khi chưa xác thực: redirect ngay về /login?next=<current-path> (không flash nội dung).
// Khi đã xác thực: render <Outlet /> để hiển thị route con.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
