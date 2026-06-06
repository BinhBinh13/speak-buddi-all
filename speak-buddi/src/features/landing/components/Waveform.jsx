import { COLORS } from "../../../shared/constants/theme";

const BAR_HEIGHTS = [3, 7, 5, 9, 6, 11, 8, 5, 10, 7, 4, 8, 6, 9, 5];

/**
 * Waveform – Hiệu ứng sóng âm khi đang ghi âm
 * @param {boolean} active - true khi đang ghi âm
 */
export default function Waveform({ active = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 4,
            height: active ? h * 2 : h,
            background: active ? COLORS.emerald : COLORS.stoneLight,
            transition: "height 0.3s ease",
            transitionDelay: `${i * 30}ms`,
            animation: active
              ? `waveBar 0.9s ease-in-out ${i * 60}ms infinite alternate`
              : "none",
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { height: 4px; }
          to   { height: 22px; }
        }
      `}</style>
    </div>
  );
}
