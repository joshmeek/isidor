/**
 * Isidor Color System
 * 
 * A sophisticated color system inspired by Apple Health, designed to create
 * a clean, modern, and futuristic interface that aligns with Isidor's vision.
 */

// Primary brand color
const primaryLight = '#0066CC'; // Apple Health-like blue
const primaryDark = '#0A84FF';

// Secondary colors
const secondaryLight = '#5E5CE6'; // Purple for protocols
const secondaryDark = '#5E5CE6';

// Success colors
const successLight = '#34C759';
const successDark = '#30D158';

// Warning colors
const warningLight = '#FF9500';
const warningDark = '#FF9F0A';

// Error colors
const errorLight = '#FF3B30';
const errorDark = '#FF453A';

// Neutral colors
const neutralLight = {
  50: '#F9FAFB',
  100: '#F2F4F7',
  200: '#E4E7EC',
  300: '#D0D5DD',
  400: '#98A2B3',
  500: '#667085',
  600: '#475467',
  700: '#344054',
  800: '#1D2939',
  900: '#101828',
};

const neutralDark = {
  50: '#1C1C1E',
  100: '#2C2C2E',
  200: '#3A3A3C',
  300: '#48484A',
  400: '#636366',
  500: '#8E8E93',
  600: '#AEAEB2',
  700: '#C7C7CC',
  800: '#E5E5EA',
  900: '#F2F2F7',
};

// Chart colors (for data visualization)
const chartColorsLight = [
  '#FF9500', // Orange
  '#FF2D55', // Pink
  '#5856D6', // Indigo
  '#007AFF', // Blue
  '#34C759', // Green
  '#AF52DE', // Purple
  '#FF3B30', // Red
  '#5AC8FA', // Light Blue
];

const chartColorsDark = [
  '#FF9F0A', // Orange
  '#FF375F', // Pink
  '#5E5CE6', // Indigo
  '#0A84FF', // Blue
  '#30D158', // Green
  '#BF5AF2', // Purple
  '#FF453A', // Red
  '#64D2FF', // Light Blue
];

export const Colors = {
  light: {
    // Base colors
    primary: primaryLight,
    secondary: secondaryLight,
    success: successLight,
    warning: warningLight,
    error: errorLight,
    
    // Text colors
    text: neutralLight[900],
    textSecondary: neutralLight[600],
    textTertiary: neutralLight[400],
    
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: neutralLight[50],
    backgroundTertiary: neutralLight[100],
    
    // Card and UI element colors
    card: '#FFFFFF',
    cardBorder: neutralLight[200],
    divider: neutralLight[200],
    
    // Tab bar colors
    tabBackground: 'rgba(255, 255, 255, 0.92)',
    tabIconDefault: neutralLight[500],
    tabIconSelected: primaryLight,
    
    // Legacy colors (for backward compatibility)
    tint: primaryLight,
    icon: neutralLight[500],
    
    // Chart colors
    chart: chartColorsLight,
  },
  dark: {
    // Base colors
    primary: primaryDark,
    secondary: secondaryDark,
    success: successDark,
    warning: warningDark,
    error: errorDark,
    
    // Text colors
    text: neutralDark[900],
    textSecondary: neutralDark[700],
    textTertiary: neutralDark[600],
    
    // Background colors
    background: '#000000',
    backgroundSecondary: neutralDark[50],
    backgroundTertiary: neutralDark[100],
    
    // Card and UI element colors
    card: neutralDark[50],
    cardBorder: neutralDark[200],
    divider: neutralDark[200],
    
    // Tab bar colors
    tabBackground: 'rgba(0, 0, 0, 0.92)',
    tabIconDefault: neutralDark[500],
    tabIconSelected: primaryDark,
    
    // Legacy colors (for backward compatibility)
    tint: primaryDark,
    icon: neutralDark[500],
    
    // Chart colors
    chart: chartColorsDark,
  },
};
