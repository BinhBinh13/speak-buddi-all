---
name: speak-buddi
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  display:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  h1-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.25'
  h2:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1280px
---

## Brand & Style
The design system is engineered for an optimized language learning experience, balancing educational authority with a modern, approachable atmosphere. It centers on the "Student Success" narrative—minimizing cognitive load through clarity while maximizing motivation through vibrant feedback loops.

The visual style is **Corporate Modern with Friendly Accents**. It utilizes high-contrast interfaces and structured layouts to ensure that Vietnamese diacritics remain legible and that learning objectives are never obscured by decorative elements. The emotional response should be one of confidence, progress, and accessibility.

## Colors
The palette is functional and semantic, designed to provide immediate feedback during the learning process.

- **Primary (Indigo):** Used for the core "Action Path"—primary buttons, active navigation states, and the primary progress indicators.
- **Secondary (Emerald):** Reserved strictly for positive reinforcement, such as correct answers, completed modules, and achievement celebrations.
- **Warning/Danger:** Used for system alerts and error states during practice sessions.
- **Pro/Premium:** A distinct gold gradient identifies "Pro" features, creating a clear value distinction without breaking the overall professional aesthetic.
- **Neutral:** A light-grey base ensures the UI feels airy and clean, reducing eye strain during long study sessions.

## Typography
This design system utilizes **Be Vietnam Pro** to ensure maximum legibility for Vietnamese speakers. It is a contemporary sans-serif with a specific focus on the complex diacritics of the Vietnamese language, preventing "crowding" in the line height.

- **Headlines:** Set in Bold or Semi-Bold to provide a clear content hierarchy.
- **Body Text:** Uses a generous 1.6 line-height to ensure that tone marks do not clash with the characters above or below.
- **Labels:** Used for micro-copy, badges, and metadata, often employing a slightly heavier weight to maintain readability at small scales.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. On desktop, content is constrained to a 1280px max-width container to prevent excessive line lengths. On mobile, a single-column fluid layout is used.

- **Grid:** A 12-column grid is used for desktop (64px margins), transitioning to a 4-column grid for mobile (16px margins).
- **Spacing Rhythm:** Based on a 4px baseline, ensuring all gaps, paddings, and margins are multiples of 4 or 8.
- **Safe Areas:** Practice screens (lesson views) utilize increased whitespace (padding-md or lg) to focus the user's attention on the central learning task.

## Elevation & Depth
The design system uses **Tonal Layers** combined with **Ambient Shadows** to create a clean, organized hierarchy without overwhelming the user.

- **Level 0 (Background):** #F9FAFB. The canvas for all content.
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF). Uses a subtle, 4% opacity indigo-tinted shadow (0px 4px 12px) to lift content from the background.
- **Level 2 (Active/Hover):** Enhanced shadow (0px 8px 24px) with a 6% opacity to indicate interactivity, especially on Topic or Feature cards.
- **Depth:** Floating elements like Toasts or Bottom Nav bars use a more pronounced shadow to indicate they sit above the primary content stream.

## Shapes
The design system adopts a **Rounded** shape language to appear friendly and less intimidating—crucial for an educational app.

- **Base Radius:** 0.5rem (8px) for small components like inputs and small badges.
- **Large Radius (rounded-lg):** 1rem (16px) for cards and primary buttons, creating a "squishy" but professional feel.
- **Pill (full):** Used for status indicators and level badges (A1-C2) to make them look like distinct, touchable tokens.

## Components
Consistent component behavior ensures the learning experience is predictable.

- **Buttons:** 
  - *Primary:* Indigo background, white text, 1rem radius. High-emphasis for "Submit" or "Continue".
  - *Secondary/Outline:* 2px indigo border, transparent background. For secondary actions like "Skip".
  - *Ghost:* No border/background until hover. For navigation or utility actions.
  - *Full-width:* Used primarily on mobile to provide large, accessible tap targets.
- **Badges:**
  - *CEFR Levels:* Use specific color coding (e.g., A1: Light Blue, C2: Deep Purple) in a pill shape.
  - *Status:* "Pro" badges utilize the gold gradient.
- **Cards:**
  - *Topic Cards:* White background, subtle shadow, featuring an icon and progress bar at the bottom.
  - *Plan Cards:* The "Pro" plan card should feature a 2px gold gradient border.
- **Inputs:**
  - Standard text fields use 0.5rem radius with a 1px #E5E7EB border that turns Indigo on focus.
  - *Card Pickers:* Large, selectable cards used for multiple-choice questions, using the Secondary (Emerald) color for correct selection feedback.
- **Navigation:**
  - *Desktop:* Fixed top bar with a clean blur effect.
  - *Mobile:* A persistent bottom navigation for thumb-friendly access to Home, Lessons, and Profile.
- **Feedback:**
  - *Toasts:* Slide in from the top-center. Use semantic colors (Red for error, Green for success) with matching icons.