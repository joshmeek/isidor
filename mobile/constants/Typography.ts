/**
 * Isidor Typography System
 * 
 * A comprehensive typography system inspired by the login screen, designed to create
 * a clean, elegant, and modern interface that aligns with Isidor's vision.
 */

import { Platform, TextStyle } from 'react-native';

// Font family based on platform
const fontFamily = Platform.select({
  ios: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  android: {
    thin: 'sans-serif-thin',
    light: 'sans-serif-light',
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    semibold: 'sans-serif-medium',
    bold: 'sans-serif-bold',
  },
  default: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
});

// Font weights - using valid React Native numeric values
const fontWeights = {
  thin: '200' as TextStyle['fontWeight'],
  light: '300' as TextStyle['fontWeight'],
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
  '6xl': 64,
};

// Letter spacing
const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1,
};

// Text styles with proper TypeScript typing
export const TextStyles: Record<string, TextStyle> = {
  // Display styles (large headers)
  displayLarge: {
    fontSize: fontSizes['6xl'],
    fontWeight: fontWeights.thin,
    lineHeight: fontSizes['6xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.thin,
  },
  displayMedium: {
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.light,
    lineHeight: fontSizes['5xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.light,
  },
  displaySmall: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.light,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.light,
  },

  // Heading styles
  headingLarge: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },
  headingMedium: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },
  headingSmall: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.xl * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },

  // Title styles (for login screen)
  title: {
    fontSize: fontSizes['6xl'],
    fontWeight: fontWeights.thin,
    lineHeight: fontSizes['6xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.thin,
  },
  subtitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.light,
    lineHeight: fontSizes.lg * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.light,
  },
  secondarySubtitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.light,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.light,
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
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.md * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },
  link: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
    textDecorationLine: 'underline',
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