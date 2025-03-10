import React from 'react';
import { StyleSheet, Pressable, PressableProps, View } from 'react-native';
import { ThemedView, ThemedViewProps } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { spacing, borderRadius } from '@/constants/Spacing';

type CardProps = ThemedViewProps & {
  title?: string;
  subtitle?: string;
  onPress?: PressableProps['onPress'];
  rightContent?: React.ReactNode;
  leftIcon?: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Card component that follows Apple Health's design language
 * 
 * Usage:
 * ```
 * <Card 
 *   title="Sleep" 
 *   subtitle="8 hours" 
 *   onPress={() => {}}
 *   leftIcon={<Ionicons name="moon" size={24} color={Colors.light.primary} />}
 * >
 *   <Text>Card content goes here</Text>
 * </Card>
 * ```
 */
export function Card({
  children,
  title,
  subtitle,
  onPress,
  rightContent,
  leftIcon,
  footer,
  style,
  ...rest
}: CardProps) {
  // Default card props
  const cardProps = {
    card: true,
    shadow: 'sm' as const,
    radius: 'lg' as const,
    padding: 'none' as const,
    ...rest,
  };

  // Wrapper component based on whether card is pressable
  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress ? { onPress } : {};

  return (
    <Wrapper {...wrapperProps} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView style={[styles.card, style]} {...cardProps}>
        {/* Card Header */}
        {(title || subtitle || leftIcon || rightContent) && (
          <View style={styles.header}>
            {/* Left Icon */}
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            
            {/* Title Area */}
            {(title || subtitle) && (
              <View style={styles.titleContainer}>
                {title && (
                  <ThemedText variant="headingSmall" style={styles.title}>
                    {title}
                  </ThemedText>
                )}
                {subtitle && (
                  <ThemedText variant="bodySmall" secondary style={styles.subtitle}>
                    {subtitle}
                  </ThemedText>
                )}
              </View>
            )}
            
            {/* Right Content */}
            {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
          </View>
        )}

        {/* Card Content */}
        {children && <View style={styles.content}>{children}</View>}

        {/* Card Footer */}
        {footer && <View style={styles.footer}>{footer}</View>}
      </ThemedView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
  subtitle: {
    marginTop: 2,
  },
  rightContent: {
    marginLeft: spacing.sm,
  },
  content: {
    padding: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
}); 