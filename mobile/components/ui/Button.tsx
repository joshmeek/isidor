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
      borderRadius: borderRadius.full,
      opacity: disabled ? 0.5 : 1,
      ...(fullWidth ? { width: '100%' } : {}),
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        minHeight: 32,
      },
      md: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        minHeight: 40,
      },
      lg: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        minHeight: 48,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: primaryColor as ColorValue,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: 'rgba(0, 102, 204, 0.1)' as ColorValue,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent' as ColorValue,
        borderWidth: 1,
        borderColor: primaryColor as ColorValue,
      },
      ghost: {
        backgroundColor: 'transparent' as ColorValue,
        borderWidth: 0,
      },
      destructive: {
        backgroundColor: errorColor as ColorValue,
        borderWidth: 0,
      },
    };

    // Pressed state styles
    const pressedStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: 'rgba(0, 102, 204, 0.8)' as ColorValue,
      },
      secondary: {
        backgroundColor: 'rgba(0, 102, 204, 0.2)' as ColorValue,
      },
      outline: {
        backgroundColor: 'rgba(0, 102, 204, 0.05)' as ColorValue,
      },
      ghost: {
        backgroundColor: 'rgba(0, 102, 204, 0.05)' as ColorValue,
      },
      destructive: {
        backgroundColor: 'rgba(255, 59, 48, 0.8)' as ColorValue,
      },
    };

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      pressed && !disabled && pressedStyles[variant],
    ];
  };

  // Determine text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'destructive':
        return '#FFFFFF';
      case 'secondary':
      case 'outline':
      case 'ghost':
        return primaryColor;
      default:
        return textColor;
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