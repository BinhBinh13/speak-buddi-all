import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../shared/auth/AuthContext";
import ProtectedRoute from "../shared/auth/ProtectedRoute";

// ── Public pages ──────────────────────────────────────────────────────────────
import LandingPage from "../features/landing/LandingPage";
import PricingPage from "../features/pricing/PricingPage";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import OAuthCallbackPage from "../features/auth/OAuthCallbackPage";

// ── Protected pages ───────────────────────────────────────────────────────────
import DashboardPage from "../features/dashboard/DashboardPage";
import SpeakingPage from "../features/speaking/SpeakingPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public routes (không yêu cầu đăng nhập) ─────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/forgot-password" element={<LoginPage />} /> {/* placeholder — S1.7 */}
          <Route path="/reset-password" element={<LoginPage />} />  {/* placeholder — S1.7 */}
          <Route path="/privacy" element={<LandingPage />} />        {/* placeholder */}
          <Route path="/terms" element={<LandingPage />} />          {/* placeholder */}

          {/* ── Protected routes (yêu cầu đăng nhập) ────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/speaking" element={<SpeakingPage />} />

            {/* Các route sẽ có page thật khi các story tương ứng hoàn thành */}
            {/* <Route path="/vocabulary" element={<VocabularyPage />} /> */}
            {/* <Route path="/quiz/*" element={<QuizPage />} /> */}
            {/* <Route path="/translation" element={<TranslationPage />} /> */}
            {/* <Route path="/pronunciation" element={<PronunciationPage />} /> */}
            {/* <Route path="/roadmap" element={<RoadmapPage />} /> */}
            {/* <Route path="/onboarding" element={<OnboardingPage />} /> */}
            {/* <Route path="/analytics" element={<AnalyticsPage />} /> */}
            {/* <Route path="/profile" element={<ProfilePage />} /> */}
            {/* <Route path="/settings/*" element={<SettingsPage />} /> */}
            {/* <Route path="/payment/*" element={<PaymentPage />} /> */}
            {/* <Route path="/admin/*" element={<AdminPage />} /> */}
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
