// src/features/roadmap/components/RoadmapPath.jsx
// ─── Snake/zigzag layout (desktop) + danh sách thẳng đứng (mobile) ───────────
// Desktop ≥ 481px : zigzag, node chẵn trái / lẻ phải, connector SVG Bezier
// Tablet  ≤ 768px : zigzag thu hẹp
// Mobile  ≤ 480px : danh sách thẳng đứng, connector đường thẳng

import { useState, useEffect } from "react";
import RoadmapNodeComponent from "./RoadmapNode";

// ── Design tokens ─────────────────────────────────────────────────────────────
const CONNECTOR_DONE    = "#a7f3d0";
const CONNECTOR_DEFAULT = "#e4e1ee";
const FONT              = "'Be Vietnam Pro', system-ui, sans-serif";
const ON_SURFACE        = "#1b1b24";
const ON_SURFACE_MUTED  = "#777587";

function connectorColor(node) {
  return node.status === "completed" ? CONNECTOR_DONE : CONNECTOR_DEFAULT;
}

// ── Hook detect mobile ────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 480) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ── Connector mobile: đường thẳng đứng ────────────────────────────────────────
function VerticalConnector({ color }) {
  return (
    <div
      style={{
        width: 3,
        height: 32,
        background: color || CONNECTOR_DEFAULT,
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
  );
}

// ── Connector desktop: SVG Bezier cong ────────────────────────────────────────
function SnakeConnector({ side, color }) {
  const path =
    side === "left"
      ? "M 0 0 C 60 0, 40 100, 100 100"
      : "M 100 0 C 40 0, 60 100, 0 100";

  return (
    <svg
      style={{
        position: "absolute",
        left:  side === "left"  ? 48 : "auto",
        right: side === "right" ? 48 : "auto",
        top: 48,
        width: 224,
        height: 160,
        zIndex: 0,
        pointerEvents: "none",
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
    >
      <path d={path} />
    </svg>
  );
}

// ── Label tên topic + word count ──────────────────────────────────────────────
function NodeLabel({ node, centered = false }) {
  const isLocked = node.status === "locked";
  return (
    <div
      style={{
        textAlign: "center",
        opacity: isLocked ? 0.6 : 1,
        fontFamily: FONT,
        ...(centered ? {} : { width: 96 }),
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: ON_SURFACE,
          wordBreak: "break-word",
          lineHeight: 1.4,
          maxWidth: centered ? 160 : 96,
        }}
      >
        {node.name}
      </div>
      {node.word_count > 0 && (
        <div style={{ fontSize: 11, color: ON_SURFACE_MUTED, marginTop: 2 }}>
          {node.word_count} từ
        </div>
      )}
    </div>
  );
}

// ── Layout mobile: thẳng đứng + căn giữa ─────────────────────────────────────
function MobileRoadmap({ nodes, onNodeClick }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        paddingBottom: 40,
        paddingTop: 8,
        fontFamily: FONT,
      }}
    >
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1;
        return (
          <div
            key={node.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Circle node */}
            <RoadmapNodeComponent node={node} index={i} isLast={isLast} onClick={() => onNodeClick?.(node)} />

            {/* Label ngay dưới circle */}
            <div style={{ marginTop: 10, marginBottom: isLast ? 0 : 4 }}>
              <NodeLabel node={node} centered />
            </div>

            {/* Đường thẳng nối xuống node tiếp theo */}
            {!isLast && <VerticalConnector color={connectorColor(node)} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Layout desktop/tablet: snake zigzag ───────────────────────────────────────
function DesktopRoadmap({ nodes, onNodeClick }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowX: "hidden",
        fontFamily: FONT,
        paddingBottom: 40,
        paddingTop: 8,
      }}
    >
      <style>{SNAKE_CSS}</style>

      {nodes.map((node, i) => {
        const isEven  = i % 2 === 0;
        const isLast  = i === nodes.length - 1;
        const color   = !isLast ? connectorColor(node) : null;

        return (
          <div key={node.id} style={{ display: "flex", flexDirection: "column" }}>
            {/* Hàng snake: circle + connector SVG */}
            <div className="snake-row" style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  ...(isEven ? { left: 0 } : { right: 0 }),
                }}
              >
                <RoadmapNodeComponent node={node} index={i} isLast={isLast} onClick={() => onNodeClick?.(node)} />
              </div>

              {!isLast && (
                <SnakeConnector
                  side={isEven ? "left" : "right"}
                  color={color}
                />
              )}
            </div>

            {/* Label ngoài snake-row, canh cùng phía với circle */}
            <div
              className="snake-label"
              style={{
                display: "flex",
                justifyContent: isEven ? "flex-start" : "flex-end",
              }}
            >
              <NodeLabel node={node} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Export chính ──────────────────────────────────────────────────────────────
export default function RoadmapPath({ nodes, onNodeClick }) {
  const isMobile = useIsMobile(480);

  if (!nodes || nodes.length === 0) return null;

  const sorted = [...nodes].sort((a, b) => a.order_index - b.order_index);

  return isMobile
    ? <MobileRoadmap  nodes={sorted} onNodeClick={onNodeClick} />
    : <DesktopRoadmap nodes={sorted} onNodeClick={onNodeClick} />;
}

// ── CSS chỉ dùng cho desktop/tablet (mobile dùng inline style) ─────────────────
const SNAKE_CSS = `
  /* Desktop ≥ 769px */
  .snake-row {
    width: 320px;
    height: 160px;
    flex-shrink: 0;
  }
  .snake-label {
    width: 320px;
    margin-top: -50px;
    position: relative;
    z-index: 2;
    margin-bottom: 8px;
  }

  /* Tablet 481px–768px */
  @media (max-width: 768px) {
    .snake-row   { width: 260px; height: 140px; }
    .snake-label { width: 260px; margin-top: -30px; }
  }
`;
