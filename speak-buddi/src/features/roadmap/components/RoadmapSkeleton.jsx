// src/features/roadmap/components/RoadmapSkeleton.jsx
// ─── Loading placeholder cho màn Roadmap (S2.4) ───────────────────────────────
// Pattern: @keyframes pulse (từ VocabularyPage)
// Design system: DESIGN.md

// ── Design tokens ─────────────────────────────────────────────────────────────
const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

function SkeletonBlock({ width, height, borderRadius = 8, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "#e4e1ee",
        animation: "rmPulse 1.5s ease-in-out infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

function SkeletonNode({ side = "left" }) {
  return (
    <div
      style={{
        width: 320,
        height: 160,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Circle placeholder */}
      <div
        style={{
          position: "absolute",
          top: 0,
          ...(side === "left" ? { left: 0 } : { right: 0 }),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <SkeletonBlock width={96} height={96} borderRadius="50%" />
        <SkeletonBlock width={80} height={14} borderRadius={8} />
      </div>

      {/* Connector line placeholder */}
      <div
        style={{
          position: "absolute",
          top: 72,
          ...(side === "left" ? { left: 48, right: 0 } : { right: 48, left: 0 }),
          height: 4,
          background: "#e4e1ee",
          animation: "rmPulse 1.5s ease-in-out infinite",
          borderRadius: 4,
        }}
      />
    </div>
  );
}

/**
 * RoadmapSkeleton — Header pulse + 4 node placeholders
 */
export default function RoadmapSkeleton() {
  return (
    <div style={{ fontFamily: FONT, padding: "0 0 40px" }}>
      <style>{`
        @keyframes rmPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ── Header skeleton ── */}
      <div style={{ marginBottom: 32 }}>
        <SkeletonBlock width="clamp(260px, 60%, 440px)" height={32} borderRadius={8} style={{ marginBottom: 12 }} />
        <SkeletonBlock width="clamp(200px, 80%, 520px)" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="clamp(140px, 50%, 320px)" height={18} borderRadius={6} style={{ marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <SkeletonBlock width={50} height={24} borderRadius={999} />
          <SkeletonBlock width={120} height={18} borderRadius={6} />
        </div>
        <SkeletonBlock
          width="clamp(200px, 50%, 400px)"
          height={8}
          borderRadius={999}
          style={{ marginTop: 12 }}
        />
      </div>

      {/* ── Node skeletons (4 placeholder) ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SkeletonNode side="left" />
        <SkeletonNode side="right" />
        <SkeletonNode side="left" />
        <SkeletonNode side="right" />
      </div>
    </div>
  );
}
