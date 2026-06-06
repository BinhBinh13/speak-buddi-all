// src/features/profile/constants/levels.js
// ─── Hằng số CEFR dùng chung cho LevelSelector & ProfilePage (S2.3) ──────────
// Tái dùng data từ onboarding/LevelStep.jsx để tránh trùng lặp.

/** Badge màu theo CEFR — khớp với LevelStep.jsx */
export const BADGE_COLORS = {
  A1: { bg: "#e0f2fe", text: "#0284c7" },
  A2: { bg: "#dcfce7", text: "#166534" },
  B1: { bg: "#fef9c3", text: "#854d0e" },
  B2: { bg: "#fef9c3", text: "#a16207" },
  C1: { bg: "#f3e8ff", text: "#6b21a8" },
  C2: { bg: "#fce7f3", text: "#9d174d" },
};

/** Danh sách level với tên thân thiện — khớp với LevelStep.jsx */
export const LEVELS = [
  { code: "A1", label: "Mới bắt đầu",  desc: "Chưa biết hoặc biết rất ít" },
  { code: "A2", label: "Cơ bản",        desc: "Biết một số từ, câu đơn giản" },
  { code: "B1", label: "Trung cấp",     desc: "Giao tiếp được trong tình huống thông thường" },
  { code: "B2", label: "Khá",           desc: "Tự tin nói chuyện, đọc hiểu tốt" },
  { code: "C1", label: "Nâng cao",      desc: "Diễn đạt linh hoạt, gần như thành thạo" },
  { code: "C2", label: "Thành thạo",    desc: "Sử dụng như người bản ngữ" },
];
