/**
 * Isidor Color System
 * 
 * A sophisticated color system inspired by the login screen, designed to create
 * a clean, elegant, and modern interface that aligns with Isidor's vision.
 */

// Primary brand color - slate colors from login screen
const primaryLight = '#334155'; // Slate-700
const primaryDark = '#475569'; // Slate-600

// Secondary colors
const secondaryLight = '#1e293b'; // Slate-800
const secondaryDark = '#334155'; // Slate-700

// Success colors
const successLight = '#10b981'; // Emerald-500
const successDark = '#34d399'; // Emerald-400

// Warning colors
const warningLight = '#f59e0b'; // Amber-500
const warningDark = '#fbbf24'; // Amber-400

// Error colors
const errorLight = '#b91c1c'; // Red-700
const errorDark = '#ef4444'; // Red-500

// Neutral colors - based on the slate palette from login screen
const neutralLight = {
  50: '#f8fafc', // Slate-50
  100: '#f1f5f9', // Slate-100
  200: '#e2e8f0', // Slate-200
  300: '#cbd5e1', // Slate-300
  400: '#94a3b8', // Slate-400
  500: '#64748b', // Slate-500
  600: '#475569', // Slate-600
  700: '#334155', // Slate-700
  800: '#1e293b', // Slate-800
  900: '#0f172a', // Slate-900
};

const neutralDark = {
  50: '#1e293b', // Slate-800
  100: '#334155', // Slate-700
  200: '#475569', // Slate-600
  300: '#64748b', // Slate-500
  400: '#94a3b8', // Slate-400
  500: '#cbd5e1', // Slate-300
  600: '#e2e8f0', // Slate-200
  700: '#f1f5f9', // Slate-100
  800: '#f8fafc', // Slate-50
  900: '#ffffff', // White
};

// Chart colors (for data visualization)
const chartColorsLight = [
  '#64748b', // Slate-500
  '#3b82f6', // Blue-500
  '#8b5cf6', // Violet-500
  '#ec4899', // Pink-500
  '#10b981', // Emerald-500
  '#f59e0b', // Amber-500
  '#ef4444', // Red-500
  '#06b6d4', // Cyan-500
];

const chartColorsDark = [
  '#94a3b8', // Slate-400
  '#60a5fa', // Blue-400
  '#a78bfa', // Violet-400
  '#f472b6', // Pink-400
  '#34d399', // Emerald-400
  '#fbbf24', // Amber-400
  '#f87171', // Red-400
  '#22d3ee', // Cyan-400
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
    text: neutralLight[800],
    textSecondary: neutralLight[600],
    textTertiary: neutralLight[400],
    
    // Background colors
    background: neutralLight[50],
    backgroundSecondary: neutralLight[100],
    backgroundTertiary: '#ffffff',
    
    // Card and UI element colors
    card: '#ffffff',
    cardBorder: neutralLight[200],
    divider: neutralLight[200],
    
    // Input colors
    inputBackground: '#ffffff',
    inputBorder: 'rgba(203, 213, 225, 0.5)',
    inputText: neutralLight[700],
    inputPlaceholder: neutralLight[400],
    
    // Button colors
    buttonPrimary: neutralLight[700],
    buttonSecondary: neutralLight[200],
    buttonDisabled: neutralLight[400],
    buttonText: '#ffffff',
    buttonTextSecondary: neutralLight[700],
    
    // Tab bar colors
    tabBackground: 'rgba(248, 250, 252, 0.92)', // Slate-50 with opacity
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
    text: neutralDark[800],
    textSecondary: neutralDark[600],
    textTertiary: neutralDark[400],
    
    // Background colors
    background: neutralDark[50],
    backgroundSecondary: neutralDark[100],
    backgroundTertiary: neutralDark[200],
    
    // Card and UI element colors
    card: neutralDark[200],
    cardBorder: neutralDark[300],
    divider: neutralDark[300],
    
    // Input colors
    inputBackground: neutralDark[200],
    inputBorder: neutralDark[300],
    inputText: neutralDark[800],
    inputPlaceholder: neutralDark[500],
    
    // Button colors
    buttonPrimary: neutralDark[600],
    buttonSecondary: neutralDark[400],
    buttonDisabled: neutralDark[300],
    buttonText: neutralDark[50],
    buttonTextSecondary: neutralDark[800],
    
    // Tab bar colors
    tabBackground: 'rgba(30, 41, 59, 0.92)', // Slate-800 with opacity
    tabIconDefault: neutralDark[500],
    tabIconSelected: primaryDark,
    
    // Legacy colors (for backward compatibility)
    tint: primaryDark,
    icon: neutralDark[500],
    
    // Chart colors
    chart: chartColorsDark,
  },
};
