import { useEffect, useRef } from "react";

const COLORS = [
  "#fca5a5","#f87171","#ef4444","#dc2626","#b91c1c",
  "#dc2626","#ef4444","#f87171","#fb923c","#f97316",
  "#fb923c","#f87171","#ef4444","#dc2626","#b91c1c",
  "#dc2626","#ef4444",
];

const HEIGHTS = [
  14,28,44,20,58,32,70,24,76,46,72,22,62,38,68,26,
  56,42,64,28,52,36,46,18,60,30,42,22,54,28,38,22,34,18,
];

const NUM_BARS = 34;

export default function Waveform({ active }) {
  const barsRef = useRef([]);
  const rafRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (active) {
      const animate = () => {
        phaseRef.current += 0.055;
        barsRef.current.forEach((bar, i) => {
          if (!bar) return;
          const base = HEIGHTS[i % HEIGHTS.length];
          const wave = Math.sin(phaseRef.current + i * 0.45) * 0.32;
          const h = Math.max(4, Math.round(base * (0.65 + wave)));
          bar.style.height = h + "px";
          bar.style.opacity = "1";
        });
        rafRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      cancelAnimationFrame(rafRef.current);
      barsRef.current.forEach((bar) => {
        if (!bar) return;
        bar.style.height = "4px";
        bar.style.opacity = "0.15";
      });
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      width: "100%",
      height: 64,
    }}>
      {Array.from({ length: NUM_BARS }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          style={{
            width: 4,
            height: 4,
            borderRadius: 4,
            background: COLORS[i % COLORS.length],
            opacity: 0.15,
            transition: "height 0.08s ease, opacity 0.25s",
          }}
        />
      ))}
    </div>
  );
}