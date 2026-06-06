import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../shared/auth/AuthContext";
import ProtectedRoute from "../shared/auth/ProtectedRoute";
import AdminRoute from "../shared/auth/AdminRoute";
import PaidRoute from "../shared/auth/PaidRoute";

// ── Public pages ──────────────────────────────────────────────────────────────
import LandingPage from "../features/landing/LandingPage";
import PricingPage from "../features/pricing/PricingPage";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import OAuthCallbackPage from "../features/auth/OAuthCallbackPage";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/ResetPasswordPage";

// ── Protected pages ───────────────────────────────────────────────────────────
import DashboardPage from "../features/dashboard/DashboardPage";
import SpeakingPage from "../features/speaking/SpeakingPage";
import VocabularyPage from "../features/vocabulary/VocabularyPage";

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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<LandingPage />} />        {/* placeholder */}
          <Route path="/terms" element={<LandingPage />} />          {/* placeholder */}

          {/* ── Protected routes (yêu cầu đăng nhập) ────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/speaking" element={<SpeakingPage />} />

            {/* S3.2: Vocabulary page */}
            <Route path="/vocabulary" element={<VocabularyPage />} />

            {/* Các route sẽ có page thật khi các story tương ứng hoàn thành */}
            {/* <Route path="/quiz/*" element={<QuizPage />} /> */}
            {/* <Route path="/translation" element={<TranslationPage />} /> */}
            {/* <Route path="/pronunciation" element={<PronunciationPage />} /> */}
            {/* <Route path="/roadmap" element={<RoadmapPage />} /> */}
            {/* <Route path="/onboarding" element={<OnboardingPage />} /> */}
            {/* <Route path="/profile" element={<ProfilePage />} /> */}
            {/* <Route path="/settings/*" element={<SettingsPage />} /> */}
            {/* <Route path="/payment/*" element={<PaymentPage />} /> */}
          </Route>

          {/* ── Admin routes (yêu cầu role=admin) — S9.x sẽ thêm page thật ── */}
          <Route element={<AdminRoute />}>
            {/* <Route path="/admin/*" element={<AdminLayout />} /> */}
          </Route>

          {/* ── Paid routes (yêu cầu is_paid=true) — S7.3/S8.4 sẽ thêm ──── */}
          <Route element={<PaidRoute />}>
            {/* <Route path="/ai-chat/unlimited" element={<AIChatPage />} /> */}
            {/* <Route path="/settings/voice" element={<VoiceSettingsPage />} /> */}
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
