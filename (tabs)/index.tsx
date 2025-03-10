import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [activeProtocols, setActiveProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');

  // Function to load data
  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Get health metrics for the selected time period
      let startDate, endDate;
      const today = new Date();
      
      if (timePeriod === 'today') {
        startDate = today.toISOString().split('T')[0];
        endDate = startDate;
      } else if (timePeriod === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else if (timePeriod === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      }

      // Fetch health metrics
      const metricsResponse = await api.getHealthMetrics(startDate, endDate);
      setMetrics(metricsResponse);

      // Fetch active protocols
      const protocolsResponse = await api.getActiveProtocols();
      setActiveProtocols(protocolsResponse);

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
      setIsLoading(false);
    }
  };

  // Load data on mount and when time period changes
  useEffect(() => {
    loadData();
  }, [timePeriod]);

  // Refresh function for pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  };

  // Helper function to render metric values based on type
  const renderMetricValue = (metric: HealthMetric) => {
    switch (metric.metric_type) {
      case 'sleep':
        return (
          <View style={styles.metricValueContainer}>
            <ThemedText style={styles.metricValue}>
              {metric.value.duration_hours.toFixed(1)}h
            </ThemedText>
            <ThemedText style={styles.metricSubValue}>
              Deep: {metric.value.deep_sleep_hours.toFixed(1)}h
            </ThemedText>
            <ThemedText style={styles.metricSubValue}>
              REM: {metric.value.rem_sleep_hours.toFixed(1)}h
            </ThemedText>
            <View style={styles.scoreContainer}>
              <ThemedText style={styles.scoreText}>
                {metric.value.sleep_score}
              </ThemedText>
            </View>
          </View>
        );
      case 'activity':
        return (
          <View style={styles.metricValueContainer}>
            <ThemedText style={styles.metricValue}>
              {metric.value.steps.toLocaleString()} steps
            </ThemedText>
            <ThemedText style={styles.metricSubValue}>
              {metric.value.active_calories.toFixed(0)} cal
            </ThemedText>
            <ThemedText style={styles.metricSubValue}>
              {metric.value.active_minutes.toFixed(0)} min
            </ThemedText>
          </View>
        );
      case 'heart_rate':
        return (
          <View style={styles.metricValueContainer}>
            <ThemedText style={styles.metricValue}>
              {metric.value.resting_hr} bpm
            </ThemedText>
            <ThemedText style={styles.metricSubValue}>
              HRV: {metric.value.hrv.toFixed(0)} ms
            </ThemedText>
          </View>
        );
      default:
        return (
          <ThemedText style={styles.metricValue}>
            {JSON.stringify(metric.value).substring(0, 50)}...
          </ThemedText>
        );
    }
  };

  // Get title for the selected time period
  const getTimePeriodTitle = (): string => {
    switch (timePeriod) {
      case 'today':
        return 'Today';
      case 'week':
        return 'Past Week';
      case 'month':
        return 'Past Month';
      default:
        return 'Today';
    }
  };

  // Organize metrics by type
  const organizeMetrics = (metrics: HealthMetric[]) => {
    const organized: Record<string, HealthMetric[]> = {
      sleep: [],
      activity: [],
      heart_rate: [],
      other: [],
    };

    metrics.forEach((metric) => {
      if (metric.metric_type in organized) {
        organized[metric.metric_type].push(metric);
      } else {
        organized.other.push(metric);
      }
    });

    return organized;
  };

  // Calculate summary statistics for the dashboard
  const calculateSummary = (metrics: HealthMetric[]) => {
    const organizedMetrics = organizeMetrics(metrics);
    const summary = {
      sleep: {
        avgDuration: 0,
        avgScore: 0,
        avgDeep: 0,
        avgRem: 0,
        count: 0,
      },
      activity: {
        avgSteps: 0,
        avgCalories: 0,
        avgActiveMinutes: 0,
        count: 0,
      },
      heart_rate: {
        avgRestingHr: 0,
        avgHrv: 0,
        count: 0,
      },
    };

    // Calculate sleep averages
    if (organizedMetrics.sleep.length > 0) {
      summary.sleep.count = organizedMetrics.sleep.length;
      organizedMetrics.sleep.forEach((metric) => {
        summary.sleep.avgDuration += metric.value.duration_hours;
        summary.sleep.avgScore += metric.value.sleep_score;
        summary.sleep.avgDeep += metric.value.deep_sleep_hours;
        summary.sleep.avgRem += metric.value.rem_sleep_hours;
      });
      summary.sleep.avgDuration /= summary.sleep.count;
      summary.sleep.avgScore /= summary.sleep.count;
      summary.sleep.avgDeep /= summary.sleep.count;
      summary.sleep.avgRem /= summary.sleep.count;
    }

    // Calculate activity averages
    if (organizedMetrics.activity.length > 0) {
      summary.activity.count = organizedMetrics.activity.length;
      organizedMetrics.activity.forEach((metric) => {
        summary.activity.avgSteps += metric.value.steps;
        summary.activity.avgCalories += metric.value.active_calories;
        summary.activity.avgActiveMinutes += metric.value.active_minutes;
      });
      summary.activity.avgSteps /= summary.activity.count;
      summary.activity.avgCalories /= summary.activity.count;
      summary.activity.avgActiveMinutes /= summary.activity.count;
    }

    // Calculate heart rate averages
    if (organizedMetrics.heart_rate.length > 0) {
      summary.heart_rate.count = organizedMetrics.heart_rate.length;
      organizedMetrics.heart_rate.forEach((metric) => {
        summary.heart_rate.avgRestingHr += metric.value.resting_hr;
        summary.heart_rate.avgHrv += metric.value.hrv;
      });
      summary.heart_rate.avgRestingHr /= summary.heart_rate.count;
      summary.heart_rate.avgHrv /= summary.heart_rate.count;
    }

    return summary;
  };

  // Render summary cards
  const renderSummary = () => {
    if (metrics.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color="#999" />
          <ThemedText style={styles.emptyText}>No health data available for this period</ThemedText>
          <TouchableOpacity 
            style={styles.addDataButton}
            onPress={() => router.push('health')}
          >
            <ThemedText style={styles.addDataButtonText}>Add Health Data</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    const summary = calculateSummary(metrics);

    return (
      <View style={styles.summaryContainer}>
        {/* Sleep Summary Card */}
        <LinearGradient
          colors={['#1a2a6c', '#b21f1f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryCardHeader}>
            <Ionicons name="moon-outline" size={24} color="#fff" />
            <ThemedText style={styles.summaryCardTitle}>Sleep</ThemedText>
          </View>
          {summary.sleep.count > 0 ? (
            <View style={styles.summaryCardContent}>
              <ThemedText style={styles.summaryCardValue}>
                {summary.sleep.avgDuration.toFixed(1)}h
              </ThemedText>
              <ThemedText style={styles.summaryCardSubValue}>
                Score: {summary.sleep.avgScore.toFixed(0)}
              </ThemedText>
              <ThemedText style={styles.summaryCardSubValue}>
                Deep: {summary.sleep.avgDeep.toFixed(1)}h | REM: {summary.sleep.avgRem.toFixed(1)}h
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.summaryCardNoData}>No sleep data</ThemedText>
          )}
        </LinearGradient>

        {/* Activity Summary Card */}
        <LinearGradient
          colors={['#2193b0', '#6dd5ed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryCardHeader}>
            <Ionicons name="walk-outline" size={24} color="#fff" />
            <ThemedText style={styles.summaryCardTitle}>Activity</ThemedText>
          </View>
          {summary.activity.count > 0 ? (
            <View style={styles.summaryCardContent}>
              <ThemedText style={styles.summaryCardValue}>
                {summary.activity.avgSteps.toFixed(0)} steps
              </ThemedText>
              <ThemedText style={styles.summaryCardSubValue}>
                {summary.activity.avgCalories.toFixed(0)} calories
              </ThemedText>
              <ThemedText style={styles.summaryCardSubValue}>
                {summary.activity.avgActiveMinutes.toFixed(0)} active minutes
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.summaryCardNoData}>No activity data</ThemedText>
          )}
        </LinearGradient>

        {/* Heart Rate Summary Card */}
        <LinearGradient
          colors={['#8E2DE2', '#4A00E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryCardHeader}>
            <Ionicons name="heart-outline" size={24} color="#fff" />
            <ThemedText style={styles.summaryCardTitle}>Heart Rate</ThemedText>
          </View>
          {summary.heart_rate.count > 0 ? (
            <View style={styles.summaryCardContent}>
              <ThemedText style={styles.summaryCardValue}>
                {summary.heart_rate.avgRestingHr.toFixed(0)} bpm
              </ThemedText>
              <ThemedText style={styles.summaryCardSubValue}>
                HRV: {summary.heart_rate.avgHrv.toFixed(0)} ms
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.summaryCardNoData}>No heart rate data</ThemedText>
          )}
        </LinearGradient>
      </View>
    );
  };

  // Render active protocols section
  const renderActiveProtocols = () => {
    if (activeProtocols.length === 0) {
      return (
        <ThemedView style={styles.emptyProtocolsContainer}>
          <Ionicons name="list-outline" size={32} color="#999" />
          <ThemedText style={styles.emptyText}>No active protocols</ThemedText>
          <TouchableOpacity 
            style={styles.addDataButton}
            onPress={() => router.push('protocols')}
          >
            <ThemedText style={styles.addDataButtonText}>Browse Protocols</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    return (
      <View style={styles.protocolsContainer}>
        {activeProtocols.map((protocol) => (
          <TouchableOpacity 
            key={protocol.id} 
            style={styles.protocolCard}
            onPress={() => router.push({
              pathname: 'protocols/[id]',
              params: { id: protocol.id }
            })}
          >
            <View style={styles.protocolCardHeader}>
              <ThemedText style={styles.protocolCardTitle}>
                {protocol.protocol?.name || 'Unnamed Protocol'}
              </ThemedText>
              <ThemedText style={styles.protocolCardStatus}>
                {protocol.status}
              </ThemedText>
            </View>
            <ThemedText style={styles.protocolCardDescription}>
              {protocol.protocol?.description || 'No description available'}
            </ThemedText>
            <View style={styles.protocolCardFooter}>
              <ThemedText style={styles.protocolCardDates}>
                {protocol.start_date} - {protocol.end_date || 'Ongoing'}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.greeting}>
          Hello, {user?.email ? user.email.split('@')[0] : 'User'}
        </ThemedText>
        <View style={styles.timePeriodSelector}>
          <TouchableOpacity
            style={[
              styles.timePeriodButton,
              timePeriod === 'today' && styles.timePeriodButtonActive,
            ]}
            onPress={() => setTimePeriod('today')}
          >
            <ThemedText
              style={[
                styles.timePeriodButtonText,
                timePeriod === 'today' && styles.timePeriodButtonTextActive,
              ]}
            >
              Today
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timePeriodButton,
              timePeriod === 'week' && styles.timePeriodButtonActive,
            ]}
            onPress={() => setTimePeriod('week')}
          >
            <ThemedText
              style={[
                styles.timePeriodButtonText,
                timePeriod === 'week' && styles.timePeriodButtonTextActive,
              ]}
            >
              Week
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timePeriodButton,
              timePeriod === 'month' && styles.timePeriodButtonActive,
            ]}
            onPress={() => setTimePeriod('month')}
          >
            <ThemedText
              style={[
                styles.timePeriodButtonText,
                timePeriod === 'month' && styles.timePeriodButtonTextActive,
              ]}
            >
              Month
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading your health data...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Health Summary</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>{getTimePeriodTitle()}</ThemedText>
            {renderSummary()}
          </View>

          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Active Protocols</ThemedText>
            {renderActiveProtocols()}
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timePeriodSelector: {
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  timePeriodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timePeriodButtonActive: {
    backgroundColor: '#0a7ea4',
  },
  timePeriodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timePeriodButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  summaryCardContent: {
    marginLeft: 32,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCardSubValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  summaryCardNoData: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 32,
    fontStyle: 'italic',
  },
  protocolsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  protocolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  protocolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  protocolCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  protocolCardStatus: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '500',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  protocolCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  protocolCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protocolCardDates: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyProtocolsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addDataButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addDataButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  metricValueContainer: {
    marginTop: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricSubValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scoreContainer: {
    backgroundColor: '#0a7ea4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  spacer: {
    height: 40,
  },
});
