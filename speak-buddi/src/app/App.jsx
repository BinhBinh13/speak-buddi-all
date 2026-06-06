import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../shared/auth/AuthContext";
import ProtectedRoute from "../shared/auth/ProtectedRoute";
import AdminRoute from "../shared/auth/AdminRoute";
import PaidRoute from "../shared/auth/PaidRoute";

// ── Public pages ──────────────────────────────────────────────────────────────
import LandingPage from "../features/landing/LandingPage";
import PricingPage from "../features/pricing/PricingPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import OAuthCallbackPage from "../features/auth/pages/OAuthCallbackPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";

// ── Protected pages ───────────────────────────────────────────────────────────
import DashboardPage from "../features/dashboard/DashboardPage";
import SpeakingPage from "../features/speaking/SpeakingPage";
import VocabularyPage from "../features/vocabulary/VocabularyPage";
import QuizListPage from "../features/quiz/QuizListPage";
import QuizPage from "../features/quiz/QuizPage";
import QuizResultPage from "../features/quiz/QuizResultPage";
import OnboardingPage from "../features/onboarding/OnboardingPage";
import ProfilePage    from "../features/profile/ProfilePage";
import RoadmapPage    from "../features/roadmap/RoadmapPage";
import TranslatePage  from "../features/translate/TranslatePage";

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
            {/* S2.1: Onboarding wizard — bắt buộc sau khi đăng ký */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/speaking" element={<SpeakingPage />} />

            {/* S3.2: Vocabulary page */}
            <Route path="/vocabulary" element={<VocabularyPage />} />

            {/* S2.3: Profile / Settings page */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* S2.4: Roadmap snake-style */}
            <Route path="/roadmap" element={<RoadmapPage />} />

            {/* S4.5: Quiz list page — đặt TRƯỚC /quiz/:testId để không nhầm "quiz" là testId */}
            <Route path="/quiz" element={<QuizListPage />} />

            {/* S4.2: Quiz page */}
            <Route path="/quiz/:testId" element={<QuizPage />} />

            {/* S4.3: Quiz result page */}
            <Route path="/quiz/:testId/result/:attemptId" element={<QuizResultPage />} />

            {/* S5.1: Translate page */}
            <Route path="/translate" element={<TranslatePage />} />

            {/* Các route sẽ có page thật khi các story tương ứng hoàn thành */}
            {/* <Route path="/pronunciation" element={<PronunciationPage />} /> */}
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
