/**
 * Isidor Spacing System
 * 
 * A comprehensive spacing system designed to create consistent layouts
 * throughout the app, inspired by Apple's Human Interface Guidelines.
 */

// Base unit for spacing (4px)
const BASE = 4;

// Spacing scale
export const spacing = {
  none: 0,
  xs: BASE, // 4px
  sm: BASE * 2, // 8px
  md: BASE * 4, // 16px
  lg: BASE * 6, // 24px
  xl: BASE * 8, // 32px
  '2xl': BASE * 12, // 48px
  '3xl': BASE * 16, // 64px
  '4xl': BASE * 24, // 96px
  '5xl': BASE * 32, // 128px
};

// Insets for consistent padding
export const insets = {
  screen: {
    horizontal: spacing.md,
    vertical: spacing.md,
  },
  card: {
    horizontal: spacing.md,
    vertical: spacing.md,
  },
  input: {
    horizontal: spacing.md,
    vertical: spacing.sm,
  },
  button: {
    horizontal: spacing.lg,
    vertical: spacing.sm,
  },
};

// Gaps for consistent spacing between elements
export const gaps = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  section: spacing.xl,
  paragraph: spacing.md,
};

// Border radii for consistent rounding
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows for consistent elevation
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

export default {
  spacing,
  insets,
  gaps,
  borderRadius,
  shadows,
}; 