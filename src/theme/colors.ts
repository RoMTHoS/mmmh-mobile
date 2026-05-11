/**
 * MMMH Color Palette
 *
 * 3 core colors + grey accents:
 *   - Cream (#fff8e7)  — app background
 *   - White (#FFFEFA)  — containers, cards, surfaces
 *   - Dark  (#1A1A1D)  — text, borders, accents
 *   - Grey  (#6B7280 / #9CA3AF) — muted text, inactive icons
 */

const cream = '#fff8e7';
const white = '#FFFEFA';
const dark = '#1A1A1D';
const grey = '#6B7280';
const greyLight = '#9CA3AF';

export const colors = {
  // Backgrounds
  background: cream,
  surface: white,
  surfaceAlt: white,
  modalBackground: cream,

  // Text
  text: dark,
  textMuted: grey,
  textLight: greyLight,

  // Interactive
  accent: dark,
  accentLight: dark,

  // Borders
  border: dark,
  borderMedium: dark,
  borderLight: dark,

  // Tab bar
  tabBarActive: dark,
  tabBarInactive: greyLight,

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ColorKey = keyof typeof colors;
