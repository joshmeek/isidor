/**
 * UI Components Index
 * 
 * This file exports all UI components for easier imports.
 * Instead of importing each component individually:
 * 
 * ```
 * import { Button } from '@/components/ui/Button';
 * import { Card } from '@/components/ui/Card';
 * ```
 * 
 * You can import them all from this index:
 * 
 * ```
 * import { Button, Card, MetricCard } from '@/components/ui';
 * ```
 */

export * from './Button';
export * from './Card';
export * from './MetricCard';
export * from './IconSymbol';
export * from './TextInput';
export { useBottomTabOverflow } from './TabBarBackground';
import TabBarBackground from './TabBarBackground';
export { TabBarBackground };

// Also export from parent directory for convenience
export * from '../ThemedText';
export * from '../ThemedView';
export * from './BackgroundGradient'; 