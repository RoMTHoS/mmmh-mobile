/**
 * Typography styles for MMMH app
 */
import { TextStyle } from 'react-native';

export const fonts = {
  script: 'Pacifico',
  sans: 'System',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const typography = {
  // Script styles - for headers, titles, buttons (Pacifico font)
  headerScript: {
    fontFamily: fonts.script,
    fontSize: fontSizes['2xl'],
    lineHeight: 32,
  } as TextStyle,

  titleScript: {
    fontFamily: fonts.script,
    fontSize: fontSizes.xl,
    lineHeight: 28,
  } as TextStyle,

  sectionTitle: {
    fontFamily: fonts.script,
    fontSize: fontSizes.lg,
    lineHeight: 24,
  } as TextStyle,

  buttonScript: {
    fontFamily: fonts.script,
    fontSize: fontSizes.base,
    lineHeight: 24,
  } as TextStyle,

  // Sans-serif headers (legacy, for compatibility)
  h1: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: 40,
  } as TextStyle,

  h2: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: 32,
  } as TextStyle,

  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: 28,
  } as TextStyle,

  // Body text (sans-serif)
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: 24,
  } as TextStyle,

  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: 20,
  } as TextStyle,

  // Labels and captions
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
  } as TextStyle,

  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: 16,
  } as TextStyle,

  // Button text (sans-serif)
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: 24,
  } as TextStyle,

  buttonSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: 20,
  } as TextStyle,
} as const;

export type TypographyKey = keyof typeof typography;
