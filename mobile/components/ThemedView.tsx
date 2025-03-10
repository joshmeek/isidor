import { View, type ViewProps, StyleSheet, ColorValue } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { shadows, borderRadius, spacing } from '@/constants/Spacing';

export type ShadowSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BorderRadiusSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type SpacingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  shadow?: ShadowSize;
  radius?: BorderRadiusSize;
  padding?: SpacingSize;
  paddingHorizontal?: SpacingSize;
  paddingVertical?: SpacingSize;
  margin?: SpacingSize;
  marginHorizontal?: SpacingSize;
  marginVertical?: SpacingSize;
  card?: boolean;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  shadow = 'none',
  radius = 'none',
  padding,
  paddingHorizontal,
  paddingVertical,
  margin,
  marginHorizontal,
  marginVertical,
  card = false,
  ...otherProps 
}: ThemedViewProps) {
  // Get background color
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor }, 
    card ? 'card' : 'background'
  );
  
  // Get border color if card
  const borderColor = useThemeColor({}, 'cardBorder');

  // Create style object
  const viewStyle = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor as ColorValue,
      ...(shadow !== 'none' && shadows[shadow]),
      ...(radius !== 'none' && { borderRadius: borderRadius[radius] }),
      ...(card && { 
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: borderColor as ColorValue,
      }),
      ...(padding !== undefined && { padding: spacing[padding] }),
      ...(paddingHorizontal !== undefined && { paddingHorizontal: spacing[paddingHorizontal] }),
      ...(paddingVertical !== undefined && { paddingVertical: spacing[paddingVertical] }),
      ...(margin !== undefined && { margin: spacing[margin] }),
      ...(marginHorizontal !== undefined && { marginHorizontal: spacing[marginHorizontal] }),
      ...(marginVertical !== undefined && { marginVertical: spacing[marginVertical] }),
    },
  });

  return <View style={[viewStyle.container, style]} {...otherProps} />;
}
