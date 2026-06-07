import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import MockPayPage from "../features/payment/MockPayPage";
import PaymentResultPage from "../features/payment/PaymentResultPage";
import PrivacyPolicyPage from "../features/legal/PrivacyPolicyPage";
import TermsOfServicePage from "../features/legal/TermsOfServicePage";
import ContactPage from "../features/support/ContactPage";

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
import VoiceSettingsPage from "../features/settings/VoiceSettingsPage";
import PronunciationPage from "../features/pronunciation/PronunciationPage";

// ── Admin pages (S9.1) ────────────────────────────────────────────────────────
import AdminLayout from "../features/admin/components/AdminLayout";
import AdminTopicsPage from "../features/admin/topics/AdminTopicsPage";
import AdminVocabularyPage from "../features/admin/vocabulary/AdminVocabularyPage";
import AdminTestsPage from "../features/admin/tests/AdminTestsPage";
import AdminTestEditorPage from "../features/admin/tests/AdminTestEditorPage";
import AdminCrawlerPage from "../features/admin/crawler/AdminCrawlerPage";
import AdminPaymentPlansPage from "../features/admin/payment-plans/AdminPaymentPlansPage";
import AdminDashboardPage from "../features/admin/AdminDashboardPage";
import AdminReportsPage from "../features/admin/reports/AdminReportsPage";

// S7.1: lazy-load ConversationPage để không ảnh hưởng bundle size ban đầu
const ConversationPage = lazy(() => import("../features/conversation/ConversationPage"));

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

          {/* S8.1: màn mock-pay nội bộ — đích redirect của MockPaymentProvider khi
              PAYMENT_PROVIDER=mock (mặc định, vì SRS để Payment Provider = TBD).
              Dev/QA-only: chỉ truy cập được qua luồng checkout → redirect_url. */}
          <Route path="/payment/mock" element={<MockPayPage />} />

          {/* S8.3: màn kết quả thanh toán (thất bại/hủy — AC-10-03). Đích điều
              hướng sau webhook fail/cancel: /payment/result?status=&tx=&plan= */}
          <Route path="/payment/result" element={<PaymentResultPage />} />

          {/* S12.1: Privacy Policy + Terms of Service — trang tĩnh công khai */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />

          {/* S12.3: Form liên hệ / hỗ trợ (extra-scope) */}
          <Route path="/contact" element={<ContactPage />} />

          {/* ── Protected routes (yêu cầu đăng nhập) ────────────────────── */}
          <Route element={<ProtectedRoute />}>
            {/* S2.1: Onboarding wizard — bắt buộc sau khi đăng ký */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/speaking" element={<SpeakingPage />} />

            {/* S3.2: Vocabulary page */}
            <Route path="/vocabulary" element={<VocabularyPage />} />

            {/* S2.5: /learn/:topicSlug — VocabularyPage với topic được auto-select */}
            <Route path="/learn/:topicSlug" element={<VocabularyPage />} />

            {/* S7.1: /conversation — màn hội thoại AI thật (thay ConversationPlaceholder) */}
            <Route
              path="/conversation"
              element={
                <Suspense fallback={<div style={{ padding: 40, textAlign: "center", fontFamily: "'Be Vietnam Pro', sans-serif" }}>Đang tải...</div>}>
                  <ConversationPage />
                </Suspense>
              }
            />

            {/* S2.3: Profile / Settings page */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* S2.4: Roadmap snake-style */}
            <Route path="/roadmap" element={<RoadmapPage />} />

            {/* S6.1: Luyện phát âm */}
            <Route path="/pronunciation" element={<PronunciationPage />} />

            {/* S4.5: Quiz list page — đặt TRƯỚC /quiz/:testId để không nhầm "quiz" là testId */}
            <Route path="/quiz" element={<QuizListPage />} />

            {/* S4.2: Quiz page */}
            <Route path="/quiz/:testId" element={<QuizPage />} />

            {/* S4.3: Quiz result page */}
            <Route path="/quiz/:testId/result/:attemptId" element={<QuizResultPage />} />

            {/* S5.1: Translate page */}
            <Route path="/translate" element={<TranslatePage />} />

            {/* Các route sẽ có page thật khi các story tương ứng hoàn thành */}
            {/* <Route path="/translation" element={<TranslationPage />} /> */}
            {/* <Route path="/settings/*" element={<SettingsPage />} /> */}
            {/* <Route path="/payment/*" element={<PaymentPage />} /> */}
          </Route>

          {/* ── Admin routes (yêu cầu role=admin) — S9.1 content CRUD ── */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/topics" element={<AdminTopicsPage />} />
              <Route path="/admin/vocabulary" element={<AdminVocabularyPage />} />
              <Route path="/admin/tests" element={<AdminTestsPage />} />
              <Route path="/admin/tests/new" element={<AdminTestEditorPage />} />
              <Route path="/admin/tests/:id/edit" element={<AdminTestEditorPage />} />
              <Route path="/admin/crawler" element={<AdminCrawlerPage />} />
              <Route path="/admin/payments" element={<AdminPaymentPlansPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
            </Route>
          </Route>

          {/* ── Paid routes (yêu cầu is_paid=true) — S7.3/S8.4 sẽ thêm ──── */}
          <Route element={<PaidRoute />}>
            {/* <Route path="/ai-chat/unlimited" element={<AIChatPage />} /> */}
            <Route path="/settings/voice" element={<VoiceSettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
