/**
 * Color palette for MMMH app
 * Based on design mockups - cream/navy theme
 */
export const colors = {
  // Backgrounds
  background: '#fff8e7ff', // Cream - main app background
  surface: '#FFFEFA', // Light gray - cards, inputs
  surfaceAlt: '#FFFEFA', // White - badges, secondary surfaces

  // Text
  text: '#1A1A1D', // Navy - primary text
  textMuted: '#6B7280', // Gray - secondary text
  textLight: '#9CA3AF', // Light gray - placeholders

  // Interactive
  accent: '#1A1A1D', // Navy - buttons, active states
  accentLight: '#1A1A1D', // Darker navy - hover/pressed states

  // Borders
  border: '#1A1A1D', // Navy border
  borderMedium: '#1A1A1D', // Navy borders for modals
  borderLight: '#1A1A1D', // Navy subtle border

  // Tab bar
  tabBarActive: '#1A1A1D', // Navy
  tabBarInactive: '#9CA3AF', // Gray

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBackground: '#fff8e7ff',
} as const;

export type ColorKey = keyof typeof colors;
