// ─── Design tokens theo DESIGN.md / mockup (landing + pricing) ───────────────
// KHÔNG sửa theme.js cũ — dashboard/speaking vẫn dùng emerald/navy/Playfair.
// Các token mới này dành riêng cho landing & pricing pages.

export const UI = {
  // ── Màu primary (Indigo) ────────────────────────────────────────────
  primary:                "#3525cd",
  onPrimary:              "#ffffff",
  primaryContainer:       "#4f46e5",
  primaryFixed:           "#e2dfff",
  primaryFixedDim:        "#c3c0ff",
  onPrimaryFixed:         "#0f0069",

  // ── Màu secondary (Emerald) ─────────────────────────────────────────
  secondary:              "#006c49",
  onSecondary:            "#ffffff",
  secondaryContainer:     "#6cf8bb",
  onSecondaryContainer:   "#00714d",

  // ── Màu tertiary (Orange-brown) ─────────────────────────────────────
  tertiary:               "#7e3000",
  onTertiary:             "#ffffff",
  tertiaryContainer:      "#a44100",
  onTertiaryContainer:    "#ffd2be",

  // ── Surface / Background ────────────────────────────────────────────
  surface:                "#fcf8ff",
  surfaceDim:             "#dcd8e5",
  surfaceBright:          "#fcf8ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow:    "#f5f2ff",
  surfaceContainer:       "#f0ecf9",
  surfaceContainerHigh:   "#eae6f4",
  surfaceContainerHighest:"#e4e1ee",
  background:             "#fcf8ff",

  // ── On-surface / text ───────────────────────────────────────────────
  onSurface:              "#1b1b24",
  onSurfaceVariant:       "#464555",
  inverseSurface:         "#302f39",
  inverseOnSurface:       "#f3effc",
  outline:                "#777587",
  outlineVariant:         "#c7c4d8",
  surfaceTint:            "#4d44e3",

  // ── Error ───────────────────────────────────────────────────────────
  error:                  "#ba1a1a",
  onError:                "#ffffff",

  // ── Pro / Gold gradient ─────────────────────────────────────────────
  goldGradient:           "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
  goldBorder:             "#D4AF37",
  goldStar:               "#F59E0B",
  goldShadow:             "0 8px 24px rgba(251,191,36,0.2)",

  // ── Font ────────────────────────────────────────────────────────────
  font:                   "'Be Vietnam Pro', system-ui, sans-serif",

  // ── Typography scale ────────────────────────────────────────────────
  fontSize: {
    display: "48px",
    h1:      "32px",
    h1Mobile:"28px",
    h2:      "24px",
    h3:      "20px",
    bodyLg:  "18px",
    bodyMd:  "16px",
    labelMd: "14px",
    labelSm: "12px",
  },
  fontWeight: {
    display: 700,
    h1:      700,
    h2:      600,
    h3:      600,
    bodyLg:  400,
    bodyMd:  400,
    labelMd: 500,
    labelSm: 600,
  },
  lineHeight: {
    display: 1.2,
    h1:      1.25,
    h2:      1.3,
    h3:      1.4,
    bodyLg:  1.6,
    bodyMd:  1.6,
    labelMd: 1.4,
    labelSm: 1.2,
  },

  // ── Border radius ────────────────────────────────────────────────────
  radius: {
    sm:   "0.25rem",
    base: "0.5rem",
    md:   "0.75rem",
    lg:   "1rem",
    xl:   "1.5rem",
    full: "9999px",
  },

  // ── Spacing ──────────────────────────────────────────────────────────
  spacing: {
    xs:            "0.5rem",
    sm:            "1rem",
    md:            "1.5rem",
    lg:            "2rem",
    xl:            "3rem",
    gutter:        "16px",
    marginMobile:  "16px",
    marginDesktop: "64px",
    maxWidth:      "1280px",
  },

  // ── Elevation / shadows ─────────────────────────────────────────────
  shadow: {
    card:    "0 4px 12px rgba(0,0,0,0.04)",
    cardHover:"0 8px 24px rgba(0,0,0,0.06)",
    proCard: "0 8px 24px rgba(251,191,36,0.2)",
    navbar:  "0 1px 3px rgba(0,0,0,0.08)",
  },
};
