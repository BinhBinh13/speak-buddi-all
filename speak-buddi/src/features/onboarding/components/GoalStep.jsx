// src/features/onboarding/components/GoalStep.jsx
// ─── Bước 2: Chọn mục tiêu học tập (single-select radio card) — S2.1 v2 ───────
// Mockup tham chiếu: onboarding_chon_so_thich_desktop/code.html + screen.png
// 3 lựa chọn cố định, không gọi API. Props: value (slug|""), onChange(slug).

import { useState } from "react";

// Design tokens (đồng nhất với LevelStep và OnboardingPage)
const PRIMARY            = "#3525cd";
const SURFACE_CARD       = "#ffffff";
const SURFACE_LOW        = "#f5f2ff";
const SURFACE_BORDER     = "#c7c4d8";
const ON_SURFACE         = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const SECONDARY          = "#006c49";
const FONT               = "'Be Vietnam Pro', system-ui, sans-serif";

const GOALS = [
  {
    slug: "travel",
    label: "Du lịch",
    description: "Giao tiếp khi đi du lịch, khám phá thế giới",
    icon: (
      // flight_takeoff SVG (Material Symbols style)
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M2.5 19h19v2h-19v-2zm7.18-1.73L5 13.5l1.41-1.41 2.59 2.59 7.07-7.07 1.41 1.41-8.3 8.25zM21 3H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h3.5l-2-2H3V5h18v10h-1.5l-2 2H21c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        <path d="M10.41 14.41L21 3.83V3h-.83L9.59 13.59l.82.82zM2 5.83L2.83 5H21v.83L10.41 14.41l-.82-.82L20 4H4L2 5.83z" />
        {/* Simplified travel/takeoff icon */}
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    ),
    iconColor: PRIMARY,
  },
  {
    slug: "work",
    label: "Công việc",
    description: "Tiếng Anh chuyên nghiệp cho môi trường làm việc",
    icon: (
      // business_center SVG
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M10 2h4c1.1 0 2 .9 2 2v2h4c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h4V4c0-1.1.9-2 2-2zm4 4V4h-4v2h4zm-4 7v2H4v-2h6zm8 0v2h-6v-2h6zm-8-5v2H4V8h6zm8 0v2h-6V8h6z" />
      </svg>
    ),
    iconColor: ON_SURFACE_VARIANT,
  },
  {
    slug: "communication",
    label: "Giao tiếp hàng ngày",
    description: "Trò chuyện tự nhiên trong cuộc sống thường ngày",
    icon: (
      // forum / chat SVG
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M21 6.5C21 5.12 19.88 4 18.5 4h-13C4.12 4 3 5.12 3 6.5v8C3 15.88 4.12 17 5.5 17H6v3.5l3.5-3.5H18.5c1.38 0 2.5-1.12 2.5-2.5v-8zM7 9h10v1.5H7V9zm7 4H7v-1.5h7V13zm3-5H7V6.5h10V8z" />
      </svg>
    ),
    iconColor: SECONDARY,
  },
];

function GoalCard({ item, selected, onSelect, hovered, onHoverIn, onHoverOut }) {
  const isSelected = selected === item.slug;
  const isHovered  = hovered === item.slug;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.slug)}
      onMouseEnter={() => onHoverIn(item.slug)}
      onMouseLeave={onHoverOut}
      aria-pressed={isSelected}
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "flex-start",
        padding:        "24px 20px",
        border:         `2px solid ${isSelected ? PRIMARY : SURFACE_BORDER}`,
        borderRadius:   12,
        background:     isSelected
          ? SURFACE_LOW
          : isHovered
          ? "#f0ecf9"
          : SURFACE_CARD,
        boxShadow:      isSelected
          ? "0 8px 24px rgba(53,37,205,0.10)"
          : "0 4px 12px rgba(53,37,205,0.04)",
        cursor:         "pointer",
        width:          "100%",
        minHeight:      44,
        transition:     "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        fontFamily:     FONT,
        position:       "relative",
        boxSizing:      "border-box",
      }}
    >
      {/* Check mark — top right */}
      <div
        style={{
          position:   "absolute",
          top:        12,
          right:      12,
          width:      22,
          height:     22,
          borderRadius: "50%",
          border:     `2px solid ${isSelected ? PRIMARY : SURFACE_BORDER}`,
          background: isSelected ? PRIMARY : SURFACE_CARD,
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        {isSelected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )}
      </div>

      {/* Icon */}
      <div
        style={{
          color:        isSelected ? PRIMARY : item.iconColor,
          marginBottom: 12,
          transition:   "color 0.2s",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
        }}
      >
        {item.icon}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize:     16,
          fontWeight:   700,
          color:        isSelected ? PRIMARY : ON_SURFACE,
          marginBottom: 8,
          textAlign:    "center",
          lineHeight:   1.3,
          transition:   "color 0.2s",
        }}
      >
        {item.label}
      </span>

      {/* Description */}
      <p
        style={{
          margin:     0,
          fontSize:   13,
          color:      ON_SURFACE_VARIANT,
          textAlign:  "center",
          lineHeight: 1.5,
        }}
      >
        {item.description}
      </p>
    </button>
  );
}

export default function GoalStep({ value, onChange }) {
  const [hoverId, setHoverId] = useState(null);

  return (
    <div>
      {/* Heading */}
      <h1
        style={{
          fontFamily:   FONT,
          fontSize:     "clamp(22px, 5vw, 30px)",
          fontWeight:   700,
          textAlign:    "center",
          color:        ON_SURFACE,
          marginBottom: 8,
        }}
      >
        Mục tiêu học tập của bạn là gì?
      </h1>
      <p
        style={{
          fontFamily:   FONT,
          fontSize:     16,
          color:        ON_SURFACE_VARIANT,
          textAlign:    "center",
          marginBottom: 28,
          lineHeight:   1.6,
        }}
      >
        Chọn mục tiêu để cá nhân hóa lộ trình học.
      </p>

      {/* Card grid: 1 col mobile / 3 col desktop */}
      <div
        style={{
          display:               "grid",
          gridTemplateColumns:   "repeat(auto-fill, minmax(180px, 1fr))",
          gap:                   16,
        }}
      >
        {GOALS.map((item) => (
          <GoalCard
            key={item.slug}
            item={item}
            selected={value}
            onSelect={onChange}
            hovered={hoverId}
            onHoverIn={setHoverId}
            onHoverOut={() => setHoverId(null)}
          />
        ))}
      </div>
    </div>
  );
}
