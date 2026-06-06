// src/shared/auth/ProtectedRoute.jsx
// Guard wrapper — chặn Guest truy cập route bảo vệ.
// Khi chưa xác thực: redirect ngay về /login?next=<current-path> (không flash nội dung).
// Khi đã xác thực nhưng chưa onboarding: redirect /onboarding (trừ khi đang ở /onboarding).
// Khi đã onboarding + đang ở /onboarding: redirect /dashboard.
// Khi đã xác thực: render <Outlet /> để hiển thị route con.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // 1. Chưa đăng nhập → /login
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // 2. Đã đăng nhập nhưng chưa hoàn tất onboarding → /onboarding
  //    (bỏ qua khi đang ở /onboarding để tránh redirect vòng)
  if (user && !user.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Đã hoàn tất onboarding mà vào lại /onboarding → /dashboard
  if (user && user.onboarding_completed && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
