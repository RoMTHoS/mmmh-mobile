/**
 * Color palette for MMMH app
 * Based on design mockups - cream/navy theme
 */
export const colors = {
  // Backgrounds
  background: '#FBFBFB', // Cream - main app background
  surface: '#F4F4F4', // Light gray - cards, inputs
  surfaceAlt: '#FFFFFF', // White - badges, secondary surfaces

  // Text
  text: '#233662', // Navy - primary text
  textMuted: '#6B7280', // Gray - secondary text
  textLight: '#9CA3AF', // Light gray - placeholders

  // Interactive
  accent: '#233662', // Navy - buttons, active states
  accentLight: '#212842', // Darker navy - hover/pressed states

  // Borders
  border: '#233662', // Navy border
  borderMedium: '#233662', // Navy borders for modals
  borderLight: '#233662', // Navy subtle border

  // Tab bar
  tabBarActive: '#233662', // Navy
  tabBarInactive: '#9CA3AF', // Gray

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBackground: '#FBFBFB',
} as const;

export type ColorKey = keyof typeof colors;
