// src/features/roadmap/RoadmapPage.jsx
// ─── Container chính màn hình Roadmap (S2.4) ─────────────────────────────────
//
// Mockup tham chiếu: lo_trinh_hoc_tap_snake_style
//   - speak-buddi-docs/ui/lo_trinh_hoc_tap_snake_style/code.html
//   - speak-buddi-docs/ui/lo_trinh_hoc_tap_snake_style/screen.png
// Design system: DESIGN.md (primary #3525cd, secondary #006c49, font Be Vietnam Pro)
//
// 4 trạng thái runtime:
//   loading → <RoadmapSkeleton>
//   error   → error card + nút "Thử lại"
//   empty   → <RoadmapEmptyState> (vẫn hiện RoadmapHeader — AC-04-04)
//   data    → <RoadmapHeader> + <RoadmapPath>
//
// Routing: /roadmap trong <ProtectedRoute> (AC-04-03)
// Fetch mới mỗi lần mount, không cache cứng (AC-04-02)

import { useState, useEffect, useRef } from "react";
import AppLayout    from "../../shared/components/AppLayout";
import RoadmapHeader     from "./components/RoadmapHeader";
import RoadmapPath       from "./components/RoadmapPath";
import RoadmapEmptyState from "./components/RoadmapEmptyState";
import RoadmapSkeleton   from "./components/RoadmapSkeleton";
import TopicModal        from "./components/TopicModal";
import LevelCompleteAlert from "./components/LevelCompleteAlert";
import {
  dismissLevelCompleteAlert,
  isLevelCompleteDismissed,
} from "./utils/levelCompleteAlert";
import { getRoadmap }    from "./services/roadmapService";

// ── Design tokens ─────────────────────────────────────────────────────────────
const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

export default function RoadmapPage() {
  // ── State ────────────────────────────────────────────────────────────────────
  const [data,         setData]         = useState(null);   // RoadmapOut
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [retryCount,   setRetryCount]   = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);   // S2.5: node đang mở modal
  const [dismissedLevel, setDismissedLevel] = useState(null);

  // Chống double-fetch trong React StrictMode
  const cancelledRef = useRef(false);

  // ── Fetch roadmap khi mount (hoặc retry) ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    cancelledRef.current = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    getRoadmap()
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 đã được apiClient xử lý (redirect login) → chỉ catch các lỗi khác
        setError(err?.message || "Không thể tải lộ trình. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [retryCount]);

  const showLevelAlert = Boolean(
    data?.level
    && data?.nodes?.length > 0
    && data.nodes.every((n) => n.status === "completed")
    && !isLevelCompleteDismissed(data.level)
    && dismissedLevel !== data.level
  );

  function handleDismissLevelAlert() {
    if (data?.level) {
      dismissLevelCompleteAlert(data.level);
      setDismissedLevel(data.level);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div
        style={{
          minHeight: "calc(100vh - 60px)",
          padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 24px) 80px",
          maxWidth: 840,
          margin: "0 auto",
          fontFamily: FONT,
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* ── Loading skeleton ── */}
        {loading && <RoadmapSkeleton />}

        {/* ── Error state ── */}
        {!loading && error && (
          <div
            role="alert"
            style={{
              background: "#ffdad6",
              color: "#ba1a1a",
              borderRadius: 12,
              padding: "16px 20px",
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              style={{
                alignSelf: "flex-start",
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: "#ba1a1a",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                minHeight: 36,
                fontFamily: FONT,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#93000a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ba1a1a"; }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ── Data loaded ── */}
        {!loading && !error && data && (
          <>
            {/* Header luôn hiển thị (AC-04-04: vẫn thấy level khi nodes=[]) */}
            <RoadmapHeader
              level={data.level}
              level_name={data.level_name}
              total={data.total_topics}
              selected={data.selected_topics}
            />

            {showLevelAlert && (
              <LevelCompleteAlert
                level={data.level}
                levelName={data.level_name}
                onDismiss={handleDismissLevelAlert}
              />
            )}

            {/* Empty state khi không có node (AC-04-04) */}
            {(!data.nodes || data.nodes.length === 0) ? (
              <RoadmapEmptyState level={data.level} />
            ) : (
              /* Snake path */
              <RoadmapPath nodes={data.nodes} onNodeClick={setSelectedNode} />
            )}
          </>
        )}
      </div>

      {/* S2.5: TopicModal — mở khi click node không locked */}
      {selectedNode && (
        <TopicModal node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </AppLayout>
  );
}
