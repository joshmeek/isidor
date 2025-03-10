import React from 'react';
import { 
  Pressable, 
  PressableProps, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  ColorValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { spacing, borderRadius } from '@/constants/Spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * Button component that follows Apple Health's design language
 * 
 * Usage:
 * ```
 * <Button 
 *   title="Start Protocol" 
 *   variant="primary" 
 *   size="md" 
 *   leftIcon="play"
 *   onPress={() => {}}
 * />
 * ```
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary') as string;
  const backgroundColor = useThemeColor({}, 'background') as string;
  const textColor = useThemeColor({}, 'text') as string;
  const errorColor = useThemeColor({}, 'error') as string;

  // Determine button styles based on variant and size
  const getButtonStyles = (pressed: boolean) => {
    // Base styles
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 25, // Rounded corners like login screen
      opacity: disabled ? 0.5 : 1,
      ...(fullWidth ? { width: '100%' } : {}),
      // Add shadow like login screen
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        minHeight: 50, // Match login screen height
      },
      lg: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: useThemeColor({}, 'buttonPrimary') as string,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: useThemeColor({}, 'buttonSecondary') as string,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: useThemeColor({}, 'buttonPrimary') as string,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      destructive: {
        backgroundColor: useThemeColor({}, 'error') as string,
        borderWidth: 0,
      },
    };

    // Pressed state styles
    const pressedStyles: ViewStyle = {
      opacity: 0.8,
    };

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      pressed && pressedStyles,
      style,
    ];
  };

  // Determine text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return useThemeColor({}, 'buttonText') as string;
      case 'secondary':
        return useThemeColor({}, 'buttonTextSecondary') as string;
      case 'outline':
        return useThemeColor({}, 'buttonPrimary') as string;
      case 'ghost':
        return useThemeColor({}, 'buttonPrimary') as string;
      case 'destructive':
        return useThemeColor({}, 'buttonText') as string;
      default:
        return useThemeColor({}, 'buttonText') as string;
    }
  };

  // Determine icon color based on variant
  const getIconColor = (): string => {
    return getTextColor();
  };

  // Determine icon size based on button size
  const getIconSize = (): number => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <Pressable
      disabled={disabled || isLoading}
      style={({ pressed }) => [getButtonStyles(pressed), style]}
      {...rest}
    >
      {/* Loading Indicator */}
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={(variant === 'primary' || variant === 'destructive') ? 'white' : primaryColor}
          style={styles.loadingIndicator}
        />
      )}

      {/* Left Icon */}
      {leftIcon && !isLoading && (
        <Ionicons
          name={leftIcon}
          size={getIconSize()}
          color={getIconColor()}
          style={styles.leftIcon}
        />
      )}

      {/* Button Text */}
      <ThemedText
        style={[
          styles.text,
          { color: getTextColor() as ColorValue },
          size === 'sm' && styles.smallText,
          size === 'lg' && styles.largeText,
          textStyle,
        ]}
        variant="button"
      >
        {title}
      </ThemedText>

      {/* Right Icon */}
      {rightIcon && !isLoading && (
        <Ionicons
          name={rightIcon}
          size={getIconSize()}
          color={getIconColor()}
          style={styles.rightIcon}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
  loadingIndicator: {
    marginRight: spacing.xs,
  },
}); 