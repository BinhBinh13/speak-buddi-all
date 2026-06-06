// src/features/auth/OAuthCallbackPage.jsx
// Nhận token từ OAuth provider (query param ?token=), gọi login() từ AuthContext
// để cập nhật state, sau đó điều hướng về ?next= (same-origin) hoặc /dashboard.
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const rawNext = searchParams.get("next");

    if (token) {
      login({ access_token: token, refresh_token: null, user: null });

      // Validate ?next= — chỉ chấp nhận same-origin path
      let redirectTo = "/dashboard";
      if (rawNext) {
        try {
          const decoded = decodeURIComponent(rawNext);
          if (decoded.startsWith("/") && !decoded.includes("://")) {
            redirectTo = decoded;
          }
        } catch {
          // decodeURIComponent thất bại → fallback /dashboard
        }
      }

      navigate(redirectTo, { replace: true });
    } else {
      // Không có token → về login
      navigate("/login", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p>Signing you in...</p>
    </div>
  );
}
