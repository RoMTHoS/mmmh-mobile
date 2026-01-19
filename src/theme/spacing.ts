/**
 * Spacing constants for MMMH app
 * Based on 4px grid system
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Common layout constants
export const layout = {
  screenPaddingHorizontal: spacing.base,
  screenPaddingVertical: spacing.base,
  cardPadding: spacing.base,
  gridGap: spacing.sm,
  sectionGap: spacing.xl,
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
