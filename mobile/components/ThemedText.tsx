import { Text, type TextProps, StyleSheet, ColorValue } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { TextStyles } from '@/constants/Typography';

export type TextVariant = 
  | 'displayLarge' 
  | 'displayMedium' 
  | 'displaySmall' 
  | 'headingLarge' 
  | 'headingMedium' 
  | 'headingSmall' 
  | 'bodyLarge' 
  | 'bodyMedium' 
  | 'bodySmall' 
  | 'labelLarge' 
  | 'labelMedium' 
  | 'labelSmall' 
  | 'caption' 
  | 'button' 
  | 'link';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: TextVariant;
  secondary?: boolean;
  tertiary?: boolean;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  variant = 'bodyMedium',
  secondary = false,
  tertiary = false,
  ...rest
}: ThemedTextProps) {
  // Get the primary text color
  const primaryColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  
  // Get secondary and tertiary text colors
  const secondaryColor = useThemeColor({}, 'textSecondary');
  const tertiaryColor = useThemeColor({}, 'textTertiary');
  
  // Determine which color to use
  const color = tertiary 
    ? tertiaryColor 
    : secondary 
      ? secondaryColor 
      : primaryColor;
  
  // Special case for link variant
  const linkColor = useThemeColor({}, 'primary');
  const finalColor = variant === 'link' ? linkColor : color;

  return (
    <Text
      style={[
        // Apply the typography style based on variant
        variant in TextStyles ? TextStyles[variant] : TextStyles.bodyMedium,
        // Apply the color
        { color: finalColor as ColorValue },
        // Apply any additional styles
        style,
      ]}
      {...rest}
    />
  );
}

// For backward compatibility with existing code
export const styles = StyleSheet.create({
  default: { ...TextStyles.bodyMedium },
  defaultSemiBold: { ...TextStyles.labelLarge },
  title: { ...TextStyles.displaySmall },
  subtitle: { ...TextStyles.headingMedium },
  link: { ...TextStyles.link },
});
