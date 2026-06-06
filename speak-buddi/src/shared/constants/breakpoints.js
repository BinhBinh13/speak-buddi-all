// ─── Breakpoints dùng chung — SpeakBuddi (S1.1, NFR §4.8) ──────────────────
// Nguồn: DESIGN.md + SRS §4.8 (375 / 768 / 1024 / 1440 px)
//
// Dùng trong JS:
//   import { BP, MQ } from "@/shared/constants/breakpoints";
//   const isMobile = window.innerWidth < BP.sm;
//
// Dùng trong CSS-in-JS / template literal:
//   @media (max-width: ${MQ.mobile}) { ... }

/** Pixel thresholds (số nguyên, không có đơn vị) */
export const BP = {
  xs:  375,   // mobile nhỏ nhất
  sm:  768,   // tablet / large mobile
  md:  1024,  // desktop nhỏ / tablet landscape
  lg:  1440,  // desktop lớn
};

/** Media query string (dùng trong CSS template literals) */
export const MQ = {
  /** max-width 767px — mobile only */
  mobile:       `${BP.sm - 1}px`,
  /** min-width 768px — tablet+ */
  tabletUp:     `${BP.sm}px`,
  /** min-width 1024px — desktop+ */
  desktopUp:    `${BP.md}px`,
  /** min-width 1440px — large desktop */
  largeDesktop: `${BP.lg}px`,
};

/** Container max-width theo DESIGN.md (Fixed-Fluid Hybrid) */
export const MAX_WIDTH = "1280px";

/** Gutter / margin nội dung */
export const GUTTER = {
  mobile:  "16px",
  desktop: "64px",
};
