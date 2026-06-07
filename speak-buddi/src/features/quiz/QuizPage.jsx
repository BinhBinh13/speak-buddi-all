// src/features/quiz/QuizPage.jsx
// ─── Màn hình làm bài kiểm tra (S4.2 + S4.3) ────────────────────────────────
//
// Route: /quiz/:testId (Protected)
// Bám mockup: bai_kiem_tra_flashcard_desktop, bai_kiem_tra_desktop
//
// State cấp page:
//   test, questions, currentIndex, userAnswers, loading, error
//   attemptId, submitting, submitError, unansweredIds  (S4.3)
//
// Flow:
//   1. Mount: fetch test metadata + questions + startAttempt (Promise.all)
//   2. Render QuizHeader + QuizRunner (câu hiện tại)
//   3. QuizRunner → onAnswered → ghi userAnswers + next
//   4. Hết câu → QuizReview (S4.3)
//   5. QuizReview → "Nộp bài" → validate → submitAttempt → navigate result
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTest, getQuestions, startAttempt, submitAttempt } from "./services/quizService";
import QuizHeader from "./components/QuizHeader";
import QuizRunner from "./components/QuizRunner";
import QuizReview from "./components/QuizReview";

export default function QuizPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // userAnswers: { [questionId]: AnswerRecord }
  const [userAnswers, setUserAnswers] = useState({});

  // ── UI state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finished, setFinished] = useState(false);

  // ── S4.3: Attempt + submit state ────────────────────────────────────────
  const [attemptId, setAttemptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [unansweredIds, setUnansweredIds] = useState(new Set());
  // S4.5: retrying state — disable "Làm lại" khi đang tạo attempt mới
  const [retrying, setRetrying] = useState(false);

  // ── Fetch test + questions + startAttempt ────────────────────────────────
  useEffect(() => {
    if (!testId) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [testData, questionsData, attemptData] = await Promise.all([
          getTest(testId),
          getQuestions(testId),
          startAttempt(testId),
        ]);
        if (cancelled) return;
        setTest(testData);
        setQuestions(questionsData ?? []);
        setAttemptId(attemptData?.id ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể tải bài kiểm tra.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [testId]);

  // ── Handle answer from QuizRunner ────────────────────────────────────────
  const handleAnswered = useCallback((answerRecord) => {
    const { questionId } = answerRecord;

    // Ghi answer vào state
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerRecord,
    }));

    // Advance to next question
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= questions.length) {
        // Hết câu → màn Review (S4.3)
        setFinished(true);
        return prev;
      }
      return next;
    });
  }, [questions.length]);

  // ── Back handler ─────────────────────────────────────────────────────────
  function handleBack() {
    navigate(-1);
  }

  // ── Retry (S4.5) — tạo attempt mới thay vì chỉ reset state ─────────────
  async function handleRetry() {
    setRetrying(true);
    setCurrentIndex(0);
    setUserAnswers({});
    setFinished(false);
    setSubmitError(null);
    setUnansweredIds(new Set());
    try {
      // Tạo attempt mới — attempt cũ đã submitted, không bị ảnh hưởng (AC-06-04)
      const attemptData = await startAttempt(testId);
      setAttemptId(attemptData?.id ?? null);
    } catch (err) {
      setError(err.message || "Không thể bắt đầu lượt làm mới. Vui lòng thử lại.");
    } finally {
      setRetrying(false);
    }
  }

  // ── S4.3: Go to specific question from Review screen ─────────────────────
  function handleGoToQuestion(index) {
    setCurrentIndex(index);
    setFinished(false);
    setUnansweredIds(new Set());
    setSubmitError(null);
  }

  // ── S4.3: Submit quiz ─────────────────────────────────────────────────────
  async function handleSubmit() {
    // Client-side validation — AC-06-02, §5.2
    const unanswered = questions.filter(
      (q) => !userAnswers[q.id] || userAnswers[q.id].skipped
    );
    if (unanswered.length > 0) {
      setUnansweredIds(new Set(unanswered.map((q) => q.id)));
      setSubmitError("Vui lòng trả lời tất cả câu hỏi trước khi nộp.");
      return;
    }

    const answers = questions.map((q) => ({
      quiz_question_id: q.id,
      quiz_answer_id: userAnswers[q.id]?.selectedAnswerId ?? null,
      text_answer: userAnswers[q.id]?.textAnswer ?? null,
    }));

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAttempt(attemptId, { answers });
      navigate(`/quiz/${testId}/result/${result.id}`);
    } catch (err) {
      setSubmitError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#fcf8ff",
        }}
      >
        <QuizHeader topicLabel="" current={0} total={0} onBack={handleBack} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Skeleton card */}
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              aspectRatio: "4/3",
              background: "#e4e1ee",
              borderRadius: 24,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#fcf8ff",
        }}
      >
        <QuizHeader topicLabel="" current={0} total={0} onBack={handleBack} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            padding: "24px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ color: "#ba1a1a", fontSize: 15, margin: 0 }}>{error}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => { setError(null); setLoading(true); }}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: "#3525cd",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                minHeight: 48,
              }}
            >
              Thử lại
            </button>
            <button
              onClick={handleBack}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "1px solid #c7c4d8",
                background: "#ffffff",
                color: "#464555",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                minHeight: 48,
              }}
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty questions state ─────────────────────────────────────────────────
  if (!loading && questions.length === 0 && !finished) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#fcf8ff",
        }}
      >
        <QuizHeader
          topicLabel={test?.title ?? "Bài kiểm tra"}
          current={0}
          total={0}
          onBack={handleBack}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            padding: "24px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48 }}>📭</div>
          <p style={{ color: "#464555", fontSize: 15, margin: 0 }}>
            Bài kiểm tra này chưa có câu hỏi nào.
          </p>
          <button
            onClick={handleBack}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "1px solid #c7c4d8",
              background: "#ffffff",
              color: "#464555",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              minHeight: 48,
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // ── Finished → Review Screen (S4.3) ──────────────────────────────────────
  if (finished) {
    return (
      <QuizReview
        test={test}
        questions={questions}
        userAnswers={userAnswers}
        unansweredIds={unansweredIds}
        submitError={submitError}
        submitting={submitting || retrying}
        attemptId={attemptId}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        onGoToQuestion={handleGoToQuestion}
        onBack={handleBack}
        onDismissSubmitError={() => setSubmitError(null)}
      />
    );
  }

  // ── Main quiz screen ──────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex] ?? null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fcf8ff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Atmospheric background blobs (bám mockup flashcard) */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "-10%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background: "#e2dfff",
          opacity: 0.4,
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          right: "-10%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background: "#ffdbcc",
          opacity: 0.3,
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <QuizHeader
          topicLabel={test?.title ?? "Bài kiểm tra"}
          current={currentIndex}
          total={questions.length}
          onBack={handleBack}
        />
      </div>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px 48px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Question type label */}
        {currentQuestion && (
          <div style={{ marginBottom: 20, textAlign: "center" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#777587",
                textTransform: "uppercase",
                background: "#eae6f4",
                borderRadius: 999,
                padding: "4px 14px",
              }}
            >
              {currentQuestion.question_type === "flashcard" && "Thẻ ghi nhớ"}
              {currentQuestion.question_type === "multiple_choice" && "Trắc nghiệm"}
              {currentQuestion.question_type === "fill_blank" && "Điền từ"}
              {currentQuestion.question_type === "grammar_mapping" && "Nối cặp"}
            </span>
          </div>
        )}

        {/* Quiz runner */}
        <div
          style={{
            width: "100%",
            maxWidth: 672,
          }}
        >
          <QuizRunner
            key={currentQuestion?.id ?? currentIndex}
            question={currentQuestion}
            onAnswered={handleAnswered}
          />
        </div>
      </main>
    </div>
  );
}
