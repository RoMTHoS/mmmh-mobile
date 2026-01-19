/**
 * Color palette for MMMH app
 * Based on design mockups - cream/navy theme
 */
export const colors = {
  // Primary palette
  background: '#F5F0E1', // Cream
  surface: '#FFFFFF', // White cards
  text: '#1E2A4A', // Navy
  accent: '#1E2A4A', // Navy (buttons, icons, active states)

  // Secondary
  textMuted: '#6B7280', // Gray for secondary text
  textLight: '#9CA3AF', // Light gray for placeholders
  border: '#E5E0D5', // Subtle borders on cream
  borderLight: '#E5E7EB', // Light gray borders on white

  // Tab bar
  tabBarActive: '#1E2A4A', // Navy
  tabBarInactive: '#9CA3AF', // Gray

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBackground: '#F5F0E1',
} as const;

export type ColorKey = keyof typeof colors;
