/**
 * Isidor Typography System
 * 
 * A comprehensive typography system inspired by Apple Health, designed to create
 * a clean, modern, and readable interface that aligns with Isidor's vision.
 */

import { Platform, TextStyle } from 'react-native';

// Font family based on platform
const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  android: {
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    semibold: 'sans-serif-medium',
    bold: 'sans-serif-bold',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
});

// Font weights - using valid React Native numeric values
const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

// Line heights
const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

// Font sizes
const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Letter spacing
const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
};

// Text styles with proper TypeScript typing
export const TextStyles: Record<string, TextStyle> = {
  // Display styles (large headers)
  displayLarge: {
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['5xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },
  displayMedium: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },
  displaySmall: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },

  // Heading styles
  headingLarge: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.semibold,
  },
  headingMedium: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.semibold,
  },
  headingSmall: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.semibold,
  },

  // Body styles
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.lg * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.regular,
  },
  bodyMedium: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.regular,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.regular,
  },

  // Label styles
  labelLarge: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },
  labelMedium: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },
  labelSmall: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },

  // Special styles
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.regular,
  },
  button: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.md * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.semibold,
  },
  link: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },
};

export default {
  fontFamily,
  fontWeights,
  lineHeights,
  fontSizes,
  letterSpacing,
  TextStyles,
}; 