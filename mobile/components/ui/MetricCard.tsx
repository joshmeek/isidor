import React from 'react';
import { StyleSheet, View, Pressable, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { ThemedView, ThemedViewProps } from '../ThemedView';
import { spacing, borderRadius } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

export type MetricCardProps = ThemedViewProps & {
  title: string;
  value: string;
  unit?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  iconBackground?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
  subtitle?: string;
};

/**
 * MetricCard component that resembles Apple Health's metric cards
 * 
 * Usage:
 * ```
 * <MetricCard
 *   title="Sleep"
 *   value="8.2"
 *   unit="hours"
 *   icon="moon"
 *   iconColor="#5E5CE6"
 *   iconBackground="rgba(94, 92, 230, 0.1)"
 *   trend="up"
 *   trendValue="+0.5"
 *   onPress={() => {}}
 *   subtitle="Last night"
 * />
 * ```
 */
export function MetricCard({
  title,
  value,
  unit,
  icon,
  iconColor,
  iconBackground,
  trend,
  trendValue,
  onPress,
  subtitle,
  style,
  ...rest
}: MetricCardProps) {
  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary') as string;
  const successColor = useThemeColor({}, 'success') as string;
  const errorColor = useThemeColor({}, 'error') as string;
  
  // Default icon color if not provided
  const defaultIconColor = primaryColor;
  const defaultIconBackground = `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.1)`;
  
  // Determine trend icon and color
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'arrow-up';
      case 'down':
        return 'arrow-down';
      case 'neutral':
        return 'remove';
      default:
        return undefined;
    }
  };
  
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return successColor;
      case 'down':
        return errorColor;
      case 'neutral':
        return primaryColor;
      default:
        return undefined;
    }
  };

  // Wrapper component based on whether card is pressable
  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress ? { onPress } : {};

  return (
    <Wrapper {...wrapperProps} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView
        style={[styles.card, style]}
        card
        shadow="sm"
        radius="lg"
        {...rest}
      >
        {/* Card Header */}
        <View style={styles.header}>
          {/* Icon */}
          {icon && (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: (iconBackground || defaultIconBackground) as ColorValue },
              ]}
            >
              <Ionicons
                name={icon}
                size={20}
                color={(iconColor || defaultIconColor) as ColorValue}
              />
            </View>
          )}
          
          {/* Title */}
          <ThemedText variant="labelMedium" style={styles.title}>
            {title}
          </ThemedText>
        </View>

        {/* Card Content */}
        <View style={styles.content}>
          <View style={styles.valueContainer}>
            <ThemedText variant="displaySmall" style={styles.value}>
              {value}
            </ThemedText>
            {unit && (
              <ThemedText variant="bodyMedium" secondary style={styles.unit}>
                {unit}
              </ThemedText>
            )}
          </View>

          {/* Trend */}
          {trend && trendValue && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={getTrendIcon()}
                size={14}
                color={getTrendColor() as ColorValue}
                style={styles.trendIcon}
              />
              <ThemedText
                variant="labelSmall"
                style={[styles.trendValue, { color: getTrendColor() as ColorValue }]}
              >
                {trendValue}
              </ThemedText>
            </View>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <ThemedText variant="caption" secondary style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  title: {
    flex: 1,
  },
  content: {
    marginTop: spacing.xs,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  value: {
    marginRight: spacing.xs,
  },
  unit: {
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  trendIcon: {
    marginRight: 2,
  },
  trendValue: {
    marginLeft: 2,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
}); 