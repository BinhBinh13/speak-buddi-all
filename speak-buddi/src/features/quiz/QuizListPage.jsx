// src/features/quiz/QuizListPage.jsx
// ─── Màn hình danh sách bài kiểm tra (S4.5) ───────────────────────────────────
//
// Route: /quiz (Protected)
// UI tham chiếu: không có mockup riêng —
//   layout tổng thể: hoc_tu_vung_desktop
//   card bài kiểm tra: bai_kiem_tra_desktop
//   design system: DESIGN.md (primary #3525cd, secondary #006c49, font Be Vietnam Pro)
//
// Tính năng:
//   - Hiển thị danh sách bài kiểm tra active
//   - Filter theo Level (A1–C2) và Chủ đề
//   - Badge "Đã làm X lần" / "Chưa làm"
//   - Loading skeleton và empty state
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../shared/components/AppLayout";
import { getLevels, getTopics } from "../vocabulary/services/vocabularyService";
import { getTests } from "./services/quizService";

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton cho danh sách test
// ─────────────────────────────────────────────────────────────────────────────
function TestListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: "#e4e1ee",
            borderRadius: 16,
            height: 110,
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: `${(i - 1) * 0.15}s`,
          }}
        />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TestCard — hiển thị 1 bài kiểm tra
// ─────────────────────────────────────────────────────────────────────────────
function TestCard({ test, onStart }) {
  const attemptBadge =
    test.attempt_count > 0
      ? `Đã làm ${test.attempt_count} lần`
      : "Chưa làm";
  const hasAttempt = test.attempt_count > 0;

  return (
    <div
      className="card shadow-sm"
      style={{
        borderRadius: 16,
        border: "1px solid #c7c4d8",
        marginBottom: 0,
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(53,37,205,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div className="card-body p-4">
        {/* Badges */}
        <div className="d-flex gap-2 mb-2 flex-wrap">
          <span
            style={{
              background: hasAttempt ? "#e2dfff" : "#f3f2f8",
              color: hasAttempt ? "#3525cd" : "#777587",
              fontWeight: 600,
              borderRadius: 999,
              padding: "3px 12px",
              fontSize: 12,
              display: "inline-block",
            }}
          >
            {attemptBadge}
          </span>
          {test.level_code && (
            <span
              style={{
                background: "#006c49",
                color: "#fff",
                borderRadius: 999,
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 600,
                display: "inline-block",
              }}
            >
              {test.level_code}
            </span>
          )}
        </div>

        {/* Title + description */}
        <h5
          className="card-title mb-1"
          style={{ color: "#1b1b24", fontWeight: 700, fontSize: 16 }}
        >
          {test.title}
        </h5>
        {test.description && (
          <p
            className="card-text text-muted small mb-3"
            style={{ lineHeight: 1.5 }}
          >
            {test.description}
          </p>
        )}

        {/* CTA */}
        <button
          className="btn"
          style={{
            background: "#3525cd",
            color: "#fff",
            borderRadius: 12,
            minHeight: 44,
            fontWeight: 600,
            padding: "10px 24px",
            fontSize: 14,
            border: "none",
          }}
          onClick={() => onStart(test.id)}
        >
          Bắt đầu &rarr;
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuizListPage
// ─────────────────────────────────────────────────────────────────────────────
export default function QuizListPage() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [tests, setTests] = useState([]);
  const [levels, setLevels] = useState([]);   // { id, code, name }[]
  const [topics, setTopics] = useState([]);   // { id, name }[]
  const [selectedLevel, setSelectedLevel] = useState(""); // "" = tất cả, value = level.id (UUID)
  const [selectedTopic, setSelectedTopic] = useState(""); // "" = tất cả, value = topic.id (UUID)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Load levels + tests khi mount ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchInitial() {
      setLoading(true);
      setError(null);
      try {
        const [levelsData, testsData] = await Promise.all([
          getLevels(),
          getTests(),
        ]);
        if (cancelled) return;
        setLevels(levelsData ?? []);
        setTests(testsData ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể tải danh sách bài kiểm tra.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInitial();
    return () => { cancelled = true; };
  }, []);

  // ── Load topics khi chọn level ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchTopics() {
      // Nếu không có level được chọn, load tất cả topics
      try {
        // Lấy level code từ levels state để dùng query param
        const selectedLevelObj = levels.find((l) => l.id === selectedLevel);
        const levelCode = selectedLevelObj ? selectedLevelObj.code : null;
        const topicsData = await getTopics(levelCode);
        if (!cancelled) {
          setTopics(topicsData ?? []);
          // Reset topic khi đổi level
          setSelectedTopic("");
        }
      } catch {
        if (!cancelled) setTopics([]);
      }
    }

    if (levels.length > 0) {
      fetchTopics();
    }
    return () => { cancelled = true; };
  }, [selectedLevel, levels]);

  // ── Load tests khi filter thay đổi ────────────────────────────────────────
  const fetchTests = useCallback(async (levelId, topicId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTests({
        levelId: levelId || undefined,
        topicId: topicId || undefined,
      });
      setTests(data ?? []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách bài kiểm tra.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleLevelChange(e) {
    const newLevel = e.target.value;
    setSelectedLevel(newLevel);
    setSelectedTopic(""); // reset topic
    fetchTests(newLevel, "");
  }

  function handleTopicChange(e) {
    const newTopic = e.target.value;
    setSelectedTopic(newTopic);
    fetchTests(selectedLevel, newTopic);
  }

  function handleStart(testId) {
    navigate(`/quiz/${testId}`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div
        style={{
          padding: "28px 24px",
          maxWidth: 800,
          margin: "0 auto",
          fontFamily: "'Be Vietnam Pro', sans-serif",
        }}
      >
        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: "clamp(20px, 3vw, 26px)",
              fontWeight: 700,
              color: "#1b1b24",
              margin: "0 0 6px",
            }}
          >
            Bài kiểm tra từ vựng
          </h1>
          <p style={{ color: "#777587", fontSize: 14, margin: 0 }}>
            Chọn bài kiểm tra để luyện tập và kiểm tra kiến thức của bạn.
          </p>
        </div>

        {/* Filter bar */}
        <div
          className="d-flex gap-3 flex-wrap"
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e4e1ee",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Level dropdown */}
          <div style={{ flex: "1 1 180px", minWidth: 160 }}>
            <label
              htmlFor="filter-level"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#777587",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Trình độ
            </label>
            <select
              id="filter-level"
              className="form-select"
              value={selectedLevel}
              onChange={handleLevelChange}
              style={{
                borderRadius: 10,
                border: "1px solid #c7c4d8",
                fontSize: 14,
                minHeight: 44,
                color: "#1b1b24",
              }}
            >
              <option value="">Tất cả trình độ</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic dropdown */}
          <div style={{ flex: "1 1 220px", minWidth: 180 }}>
            <label
              htmlFor="filter-topic"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#777587",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Chủ đề
            </label>
            <select
              id="filter-topic"
              className="form-select"
              value={selectedTopic}
              onChange={handleTopicChange}
              style={{
                borderRadius: 10,
                border: "1px solid #c7c4d8",
                fontSize: 14,
                minHeight: 44,
                color: "#1b1b24",
              }}
            >
              <option value="">Tất cả chủ đề</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(selectedLevel || selectedTopic) && (
            <div style={{ alignSelf: "flex-end" }}>
              <button
                className="btn"
                onClick={() => {
                  setSelectedLevel("");
                  setSelectedTopic("");
                  fetchTests("", "");
                }}
                style={{
                  border: "1px solid #c7c4d8",
                  background: "#ffffff",
                  color: "#464555",
                  borderRadius: 10,
                  minHeight: 44,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Xoá bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && !loading && (
          <div
            style={{
              background: "#fff5f5",
              border: "1px solid #f5c6cb",
              borderRadius: 12,
              padding: "16px 20px",
              color: "#ba1a1a",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {error}
            <button
              className="btn btn-link p-0 ms-2"
              style={{ color: "#3525cd", fontSize: 14 }}
              onClick={() => fetchTests(selectedLevel, selectedTopic)}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <TestListSkeleton />}

        {/* Test list */}
        {!loading && !error && tests.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tests.map((test) => (
              <TestCard key={test.id} test={test} onStart={handleStart} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tests.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e4e1ee",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <p
              style={{
                color: "#777587",
                fontSize: 15,
                margin: "0 0 8px",
                fontWeight: 500,
              }}
            >
              Không có bài kiểm tra nào phù hợp
            </p>
            <p style={{ color: "#a8a4c0", fontSize: 13, margin: 0 }}>
              Thử thay đổi bộ lọc hoặc chọn trình độ/chủ đề khác.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
