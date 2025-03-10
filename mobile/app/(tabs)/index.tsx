import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, ThemedView, Button, Card, MetricCard } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

// Types for health metrics
interface HealthMetric {
  id: string;
  user_id: string;
  date: string;
  metric_type: string;
  value: any;
  source: string;
}

// Types for protocols
interface Protocol {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  protocol?: {
    id: string;
    name: string;
    description: string;
    target_metrics?: string[];
    duration_type?: string;
    duration_days?: number;
  };
}

// Time period for health metrics
type TimePeriod = 'today' | 'week' | 'month';

export default function HomeScreen() {
  console.log('Rendering HomeScreen (Dashboard)');
  const { user, isAuthenticated, logout } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [activeProtocols, setActiveProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [summary, setSummary] = useState<any>({});

  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [timePeriod]);

  // Load data from API
  const loadData = async () => {
    try {
      console.log('Loading dashboard data...');
      setError(null);
      setIsLoading(true);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch health metrics based on selected time period
      let startDate = today;
      if (timePeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timePeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
      }
      
      console.log('Fetching health metrics from', startDate, 'to', today);
      const metricsResponse = await api.getHealthMetrics(startDate, today);
      console.log('Received', metricsResponse.length, 'health metrics');
      setMetrics(metricsResponse);
      
      // Calculate summary
      const calculatedSummary = calculateSummary(metricsResponse);
      setSummary(calculatedSummary);
      
      // Fetch active protocols
      console.log('Fetching active protocols');
      const protocolsResponse = await api.getActiveProtocols();
      console.log('Received', protocolsResponse.length, 'active protocols');
      setActiveProtocols(protocolsResponse);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Render metric value based on type
  const renderMetricValue = (metric: HealthMetric) => {
    try {
      switch (metric.metric_type) {
        case 'sleep':
          return {
            value: metric.value.duration_hours?.toString() || '0',
            unit: 'hours',
            icon: 'moon' as React.ComponentProps<typeof Ionicons>['name'],
            iconColor: '#5E5CE6',
            iconBackground: 'rgba(94, 92, 230, 0.1)',
            trend: metric.value.duration_hours > 7 ? 'up' : 'down',
            trendValue: metric.value.duration_hours > 7 ? '+0.5' : '-0.5',
            subtitle: `Sleep score: ${metric.value.sleep_score || 'N/A'}`,
          };
        case 'activity':
          return {
            value: metric.value.steps?.toString() || '0',
            unit: 'steps',
            icon: 'footsteps' as React.ComponentProps<typeof Ionicons>['name'],
            iconColor: '#FF9500',
            iconBackground: 'rgba(255, 149, 0, 0.1)',
            trend: (metric.value.steps || 0) > 8000 ? 'up' : 'down',
            trendValue: (metric.value.steps || 0) > 8000 ? '+1,200' : '-800',
            subtitle: `${metric.value.active_calories || 0} cal`,
          };
        case 'heart_rate':
          return {
            value: metric.value.average_bpm?.toString() || metric.value.resting_bpm?.toString() || '0',
            unit: 'bpm',
            icon: 'heart' as React.ComponentProps<typeof Ionicons>['name'],
            iconColor: '#FF2D55',
            iconBackground: 'rgba(255, 45, 85, 0.1)',
            trend: ((metric.value.average_bpm || metric.value.resting_bpm || 0) < 70) ? 'down' : 'neutral',
            trendValue: ((metric.value.average_bpm || metric.value.resting_bpm || 0) < 70) ? '-3' : '0',
            subtitle: `Resting: ${metric.value.resting_bpm || 0} bpm`,
          };
        case 'mood':
          return {
            value: metric.value.score?.toString() || '0',
            unit: '/10',
            icon: 'happy' as React.ComponentProps<typeof Ionicons>['name'],
            iconColor: '#34C759',
            iconBackground: 'rgba(52, 199, 89, 0.1)',
            trend: (metric.value.score || 0) > 7 ? 'up' : 'down',
            trendValue: (metric.value.score || 0) > 7 ? '+1' : '-1',
            subtitle: metric.value.notes || 'No notes',
          };
        default:
          return {
            value: 'N/A',
            unit: '',
            icon: 'analytics' as React.ComponentProps<typeof Ionicons>['name'],
            iconColor: primaryColor as string,
            iconBackground: `rgba(0, 102, 204, 0.1)`,
          };
      }
    } catch (error) {
      console.error('Error rendering metric value:', error, metric);
      return {
        value: 'Error',
        unit: '',
        icon: 'warning' as React.ComponentProps<typeof Ionicons>['name'],
        iconColor: '#FF3B30',
        iconBackground: 'rgba(255, 59, 48, 0.1)',
      };
    }
  };

  // Get title for time period
  const getTimePeriodTitle = (): string => {
    switch (timePeriod) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return 'Today';
    }
  };

  // Organize metrics by type
  const organizeMetrics = (metrics: HealthMetric[]) => {
    // Filter metrics by time period
    const now = new Date();
    const filteredMetrics = metrics.filter((metric) => {
      const metricDate = new Date(metric.date);
      switch (timePeriod) {
        case 'today':
          return (
            metricDate.getDate() === now.getDate() &&
            metricDate.getMonth() === now.getMonth() &&
            metricDate.getFullYear() === now.getFullYear()
          );
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return metricDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return metricDate >= monthAgo;
        default:
          return true;
      }
    });

    // Group by metric type
    return filteredMetrics.reduce((acc, metric) => {
      if (!acc[metric.metric_type]) {
        acc[metric.metric_type] = [];
      }
      acc[metric.metric_type].push(metric);
      return acc;
    }, {} as Record<string, HealthMetric[]>);
  };

  // Calculate summary from metrics
  const calculateSummary = (metrics: HealthMetric[]) => {
    // Only show summary for week and month views
    if (timePeriod === 'today' || metrics.length === 0) {
      return null;
    }
    
    // Group metrics by type
    const metricsByType: Record<string, HealthMetric[]> = {};
    metrics.forEach(metric => {
      if (!metricsByType[metric.metric_type]) {
        metricsByType[metric.metric_type] = [];
      }
      metricsByType[metric.metric_type].push(metric);
    });
    
    // Calculate summaries for each type
    const summaries: Record<string, { avg: string, min: string, max: string }> = {};
    
    Object.keys(metricsByType).forEach(type => {
      const typeMetrics = metricsByType[type];
      
      switch (type) {
        case 'sleep':
          // Calculate sleep duration averages
          try {
            const durations = typeMetrics.map(m => 
              m.value.duration_hours || m.value.duration || 0
            );
            const avg = durations.reduce((sum, val) => sum + val, 0) / durations.length;
            const min = Math.min(...durations);
            const max = Math.max(...durations);
            
            summaries[type] = {
              avg: `${avg.toFixed(1)} hours`,
              min: `${min.toFixed(1)} hours`,
              max: `${max.toFixed(1)} hours`,
            };
          } catch (e) {
            console.error('Error calculating sleep summary:', e);
          }
          break;
          
        case 'activity':
          // Calculate step count averages
          try {
            const counts = typeMetrics.map(m => {
              if (m.value.steps) return m.value.steps;
              if (typeof m.value === 'number') return m.value;
              return 0;
            });
            const avg = counts.reduce((sum, val) => sum + val, 0) / counts.length;
            const min = Math.min(...counts);
            const max = Math.max(...counts);
            
            summaries[type] = {
              avg: `${Math.round(avg).toLocaleString()}`,
              min: `${min.toLocaleString()}`,
              max: `${max.toLocaleString()}`,
            };
          } catch (e) {
            console.error('Error calculating steps summary:', e);
          }
          break;
          
        case 'heart_rate':
          // Calculate heart rate averages
          try {
            const rates = typeMetrics.map(m => {
              if (m.value.average_bpm) return m.value.average_bpm;
              if (typeof m.value === 'number') return m.value;
              return 0;
            });
            const avg = rates.reduce((sum, val) => sum + val, 0) / rates.length;
            const min = Math.min(...rates);
            const max = Math.max(...rates);
            
            summaries[type] = {
              avg: `${Math.round(avg)} bpm`,
              min: `${min} bpm`,
              max: `${max} bpm`,
            };
          } catch (e) {
            console.error('Error calculating heart rate summary:', e);
          }
          break;
      }
    });
    
    return summaries;
  };

  // Render summary section
  const renderSummary = () => {
    if (isLoading) {
      return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor as string} />
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.errorContainer}>
          <ThemedText variant="bodyMedium" style={styles.errorText}>
            {error}
          </ThemedText>
          <Button 
            title="Retry" 
            onPress={loadData} 
            variant="primary"
            size="sm"
            leftIcon="refresh"
          />
        </ThemedView>
      );
    }

    const organizedMetrics = organizeMetrics(metrics);
    const hasMetrics = Object.keys(organizedMetrics).length > 0;

    if (!hasMetrics) {
      return (
        <Card style={styles.noDataCard}>
          <ThemedText variant="bodyMedium" style={styles.noDataText}>
            No health data available for {getTimePeriodTitle().toLowerCase()}.
          </ThemedText>
          <Button 
            title="Sync Health Data" 
            onPress={loadData} 
            variant="primary"
            leftIcon="sync"
            style={styles.syncButton}
          />
        </Card>
      );
    }

    // Display summary statistics for week and month views
    const summaries = summary as Record<string, { avg: string, min: string, max: string }> | null;
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.timePeriodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              timePeriod === 'today' && styles.activePeriodButton,
            ]}
            onPress={() => setTimePeriod('today')}
          >
            <ThemedText
              variant="labelMedium"
              style={[
                styles.periodButtonText,
                timePeriod === 'today' && styles.activePeriodButtonText,
              ]}
            >
              Today
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              timePeriod === 'week' && styles.activePeriodButton,
            ]}
            onPress={() => setTimePeriod('week')}
          >
            <ThemedText
              variant="labelMedium"
              style={[
                styles.periodButtonText,
                timePeriod === 'week' && styles.activePeriodButtonText,
              ]}
            >
              Week
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              timePeriod === 'month' && styles.activePeriodButton,
            ]}
            onPress={() => setTimePeriod('month')}
          >
            <ThemedText
              variant="labelMedium"
              style={[
                styles.periodButtonText,
                timePeriod === 'month' && styles.activePeriodButtonText,
              ]}
            >
              Month
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Display summary statistics for week and month views */}
        {(timePeriod === 'week' || timePeriod === 'month') && summaries && Object.keys(summaries).length > 0 && (
          <View style={styles.summaryStats}>
            {Object.keys(summaries).map(type => (
              <Card key={type} style={styles.summaryCard}>
                <ThemedText variant="headingSmall" style={styles.summaryTitle}>
                  {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </ThemedText>
                <View style={styles.summaryRow}>
                  <ThemedText variant="labelMedium">Average:</ThemedText>
                  <ThemedText variant="bodyMedium">{summaries[type].avg}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText variant="labelMedium">Min:</ThemedText>
                  <ThemedText variant="bodySmall">{summaries[type].min}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText variant="labelMedium">Max:</ThemedText>
                  <ThemedText variant="bodySmall">{summaries[type].max}</ThemedText>
                </View>
              </Card>
            ))}
          </View>
        )}

        {renderMetrics()}
      </View>
    );
  };

  // Render metrics section
  const renderMetrics = () => {
    const organizedMetrics = organizeMetrics(metrics);
    const metricTypes = Object.keys(organizedMetrics);

    if (metricTypes.length === 0) {
      return null;
    }

    return (
      <View style={styles.metricsGrid}>
        {metricTypes.map((type) => {
          const latestMetric = organizedMetrics[type].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          
          const metricProps = renderMetricValue(latestMetric);
          const iconName = metricProps.icon as React.ComponentProps<typeof Ionicons>['name'];
          
          return (
            <MetricCard
              key={type}
              title={type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              value={metricProps.value}
              unit={metricProps.unit}
              icon={iconName}
              iconColor={metricProps.iconColor as string}
              iconBackground={metricProps.iconBackground as string}
              trend={metricProps.trend as 'up' | 'down' | 'neutral' | undefined}
              trendValue={metricProps.trendValue}
              subtitle={metricProps.subtitle}
              style={styles.metricCard}
              onPress={() => router.push(`/health?activeTab=${type}`)}
            />
          );
        })}
      </View>
    );
  };

  // Render active protocols section
  const renderActiveProtocols = () => {
    if (activeProtocols.length === 0) {
      return (
        <Card style={styles.noProtocolsCard}>
          <ThemedText variant="bodyMedium" style={styles.noDataText}>
            You don't have any active protocols.
          </ThemedText>
          <Button 
            title="Browse Protocols" 
            onPress={() => router.push('/protocols')} 
            variant="primary"
            leftIcon="list"
            style={styles.browseButton}
          />
        </Card>
      );
    }

    return (
      <View style={styles.protocolsContainer}>
        {activeProtocols.map((protocol) => (
          <Card
            key={protocol.id}
            title={protocol.protocol?.name || 'Protocol'}
            subtitle={`Started: ${new Date(protocol.start_date || '').toLocaleDateString()}`}
            leftIcon={<Ionicons name="list" size={24} color={secondaryColor as string} />}
            style={styles.protocolCard}
            onPress={() => router.push(`/protocol-details?id=${protocol.id}`)}
            footer={
              <View style={styles.protocolFooter}>
                <ThemedText variant="caption" secondary>
                  {protocol.status === 'active' ? 'Active' : 'In Progress'}
                </ThemedText>
                <Button
                  title="View"
                  variant="outline"
                  size="sm"
                  rightIcon="chevron-forward"
                  onPress={() => router.push(`/protocol-details?id=${protocol.id}`)}
                />
              </View>
            }
          >
            <ThemedText variant="bodySmall" secondary numberOfLines={2}>
              {protocol.protocol?.description || 'No description available'}
            </ThemedText>
          </Card>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ThemedText variant="displaySmall" style={styles.title}>
          Dashboard
        </ThemedText>
        
        <ThemedText variant="headingMedium" style={styles.sectionTitle}>
          Health Summary
        </ThemedText>
        {renderSummary()}
        
        <ThemedText variant="headingMedium" style={styles.sectionTitle}>
          Active Protocols
        </ThemedText>
        {renderActiveProtocols()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  title: {
    marginBottom: spacing.md,
    marginTop: Platform.OS === 'ios' ? spacing['3xl'] : spacing.lg,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  noDataCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  syncButton: {
    marginTop: spacing.sm,
  },
  summaryContainer: {
    marginBottom: spacing.lg,
  },
  timePeriodSelector: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  activePeriodButton: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  periodButtonText: {
    textAlign: 'center',
  },
  activePeriodButtonText: {
    color: '#0066CC',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  metricCard: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  protocolsContainer: {
    marginBottom: spacing.xl,
  },
  protocolCard: {
    marginBottom: spacing.md,
  },
  noProtocolsCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  browseButton: {
    marginTop: spacing.sm,
  },
  protocolFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryStats: {
    marginBottom: spacing.lg,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryTitle: {
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
