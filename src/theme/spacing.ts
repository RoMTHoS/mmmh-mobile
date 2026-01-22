/**
 * Spacing constants for MMMH app
 * Based on design system specification
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Aliases for backwards compatibility
  base: 16,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Alias for backwards compatibility
export const borderRadius = radius;

// Common layout constants
export const layout = {
  screenPaddingHorizontal: spacing.md,
  screenPaddingVertical: spacing.md,
  cardPadding: spacing.md,
  gridGap: spacing.sm,
  sectionGap: spacing.lg,
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
