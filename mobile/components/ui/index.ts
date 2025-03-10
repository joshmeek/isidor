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

export { Button } from './Button';
export { Card } from './Card';
export { MetricCard } from './MetricCard';
export { IconSymbol } from './IconSymbol';
export { TextInput } from './TextInput';
export { useBottomTabOverflow } from './TabBarBackground';
import TabBarBackground from './TabBarBackground';
export { TabBarBackground };

// Also export from parent directory for convenience
export { ThemedText } from '../ThemedText';
export { ThemedView } from '../ThemedView'; 