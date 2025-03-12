import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, ThemedView, Button, Card, MetricCard } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { MetricType } from '@/services/api';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the USER_ID_KEY constant from the API service
const { USER_ID_KEY } = api;

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

// Time period for AI trend analysis
type TrendTimePeriod = 'last_day' | 'last_week';

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
  const [trendTimePeriod, setTrendTimePeriod] = useState<TrendTimePeriod>('last_day');
  const [healthInsight, setHealthInsight] = useState<any>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [timePeriod]);

  // Load health insights when trend time period changes
  useEffect(() => {
    loadHealthInsights();
  }, [trendTimePeriod]);

  // Check if user ID is stored in AsyncStorage
  useEffect(() => {
    const checkUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem(USER_ID_KEY);
        if (!userId && user) {
          // If user is authenticated but user ID is not stored, store it
          console.log('User ID not found in AsyncStorage, storing it now:', user.id);
          await AsyncStorage.setItem(USER_ID_KEY, user.id);
        }
      } catch (err) {
        console.error('Error checking user ID:', err);
      }
    };

    if (isAuthenticated) {
      checkUserId();
    }
  }, [isAuthenticated, user]);

  // Load health insights data
  const loadHealthInsights = async () => {
    try {
      console.log('Loading health insights data...');
      setInsightError(null);
      setIsInsightLoading(true);

      // Create query based on time period
      const timeFrame = trendTimePeriod === 'last_day' ? 'the past day' : 'the past week';
      const apiTimeFrame = trendTimePeriod; // Use the trendTimePeriod directly for the API
      const query = `Analyze my health over ${timeFrame} in relation to my active protocols and provide a brief summary of the most important patterns.`;
      
      // Define metric types to include
      const metricTypes = ['sleep', 'activity', 'heart_rate'];
      
      // Fetch health insights
      try {
        console.log('Calling getHealthInsight API with query:', query);
        const result = await api.getHealthInsight(query, metricTypes, apiTimeFrame);
        console.log('Health insight API response:', JSON.stringify(result, null, 2));
        
        if (result && result.response) {
          console.log('Received health insight:', result.response.substring(0, 50) + '...');
          setHealthInsight(result);
        } else if (result && result.has_data === false) {
          console.log('API returned no data available');
          setHealthInsight({
            response: 'No health data available for analysis in this time period. Please sync your health data to get personalized insights.',
            has_data: false,
            metadata: {
              has_active_protocols: false,
              protocol_count: 0
            }
          });
        } else {
          console.log('No health insight data available');
          setHealthInsight({
            response: 'No health data available for analysis in this time period. Please sync your health data to get personalized insights.',
            has_data: false,
            metadata: {
              has_active_protocols: false,
              protocol_count: 0
            }
          });
        }
      } catch (err: any) {
        console.error('Error fetching health insights:', err);
        // Set a more user-friendly error message
        if (err.message && err.message.includes('User ID not found')) {
          setInsightError('User ID not found. Please log out and log in again to fix this issue.');
        } else if (err.message) {
          setInsightError(err.message);
        } else {
          setInsightError('Failed to load health insights. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error in loadHealthInsights:', err);
      setInsightError('An unexpected error occurred. Please try again.');
    } finally {
      setIsInsightLoading(false);
    }
  };

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

      // Load health insights - always do this, even if there are no metrics
      await loadHealthInsights();

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load data. Please try again.');
      
      // Still try to load health insights even if other data fails
      try {
        await loadHealthInsights();
      } catch (insightErr) {
        console.error('Error loading health insights after main data load failed:', insightErr);
      }
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

    // Always render the health insights and time period selector, regardless of metrics
    return (
      <View style={styles.summaryContainer}>
        {/* Trend Time Period Selector */}
        <View style={styles.timePeriodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              trendTimePeriod === 'last_day' && styles.activePeriodButton,
              { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
            ]}
            onPress={() => setTrendTimePeriod('last_day')}
          >
            <ThemedText
              variant="labelMedium"
              style={[
                styles.periodButtonText,
                trendTimePeriod === 'last_day' && styles.activePeriodButtonText,
              ]}
            >
              Today
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              trendTimePeriod === 'last_week' && styles.activePeriodButton,
              { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
            ]}
            onPress={() => setTrendTimePeriod('last_week')}
          >
            <ThemedText
              variant="labelMedium"
              style={[
                styles.periodButtonText,
                trendTimePeriod === 'last_week' && styles.activePeriodButtonText,
              ]}
            >
              Week
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Health Insights */}
        {renderHealthInsight()}

        {/* Render Metrics if available */}
        {renderMetrics()}
      </View>
    );
  };

  // Function to manually set user ID (for debugging)
  const setUserIdManually = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to set user ID');
      return;
    }
    
    try {
      await AsyncStorage.setItem(USER_ID_KEY, user.id);
      Alert.alert('Success', 'User ID has been manually set in AsyncStorage');
      // Reload health insights
      loadHealthInsights();
    } catch (err) {
      console.error('Error setting user ID manually:', err);
      Alert.alert('Error', 'Failed to set user ID manually');
    }
  };

  // Function to force sync health data
  const forceSyncHealthData = async () => {
    try {
      setIsLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get a date 7 days ago
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const startDate = weekAgo.toISOString().split('T')[0];
      
      // Mock health data for testing
      const mockHealthData = [
        {
          metric_type: MetricType.SLEEP,
          value: {
            duration_hours: 7.5,
            sleep_score: 85,
            deep_sleep_minutes: 120,
            rem_sleep_minutes: 90
          },
          source: 'healthkit',
          date: today,
          user_id: user?.id || ''
        },
        {
          metric_type: MetricType.ACTIVITY,
          value: {
            steps: 8500,
            active_calories: 320,
            distance_km: 6.2,
            active_minutes: 45
          },
          source: 'healthkit',
          date: today,
          user_id: user?.id || ''
        },
        {
          metric_type: MetricType.HEART_RATE,
          value: {
            average_bpm: 68,
            resting_bpm: 62,
            max_bpm: 142,
            min_bpm: 58
          },
          source: 'healthkit',
          date: today,
          user_id: user?.id || ''
        }
      ];
      
      // Create health metrics
      for (const data of mockHealthData) {
        try {
          await api.createHealthMetric(data);
          console.log(`Created mock ${data.metric_type} data`);
        } catch (err) {
          console.error(`Error creating mock ${data.metric_type} data:`, err);
        }
      }
      
      // Reload data
      await loadData();
      
      // Explicitly load health insights to ensure they're updated
      await loadHealthInsights();
      
      Alert.alert('Success', 'Health data synced successfully');
    } catch (err) {
      console.error('Error syncing health data:', err);
      Alert.alert('Error', 'Failed to sync health data');
      
      // Still try to load health insights even if sync fails
      try {
        await loadHealthInsights();
      } catch (insightErr) {
        console.error('Error loading health insights after sync failed:', insightErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render AI health insights
  const renderHealthInsight = () => {
    if (isInsightLoading) {
      return (
        <Card style={styles.healthInsightCard}>
          <View style={styles.healthInsightLoadingContainer}>
            <ActivityIndicator size="small" color={primaryColor as string} />
            <ThemedText variant="bodySmall" style={styles.healthInsightLoadingText}>
              Analyzing your health trends...
            </ThemedText>
          </View>
        </Card>
      );
    }

    if (insightError) {
      // Check if it's a user ID not found error
      const isUserIdError = insightError.includes('User ID not found');
      
      return (
        <Card style={styles.healthInsightCard}>
          <ThemedText variant="bodyMedium" style={styles.errorText}>
            {insightError}
          </ThemedText>
          {isUserIdError ? (
            <View style={styles.errorButtonsContainer}>
              <Button 
                title="Log Out" 
                onPress={logout} 
                variant="primary"
                size="sm"
                leftIcon="log-out"
                style={styles.errorButton}
              />
              <Button 
                title="Set User ID Manually" 
                onPress={setUserIdManually} 
                variant="outline"
                size="sm"
                leftIcon="save"
                style={styles.errorButton}
              />
            </View>
          ) : (
            <Button 
              title="Retry" 
              onPress={loadHealthInsights} 
              variant="primary"
              size="sm"
              leftIcon="refresh"
              style={styles.retryButton}
            />
          )}
        </Card>
      );
    }

    // Always show the health insights card, even if there's no data
    const insightData = healthInsight;
    const hasActiveProtocols = insightData?.metadata?.has_active_protocols;
    const protocolCount = insightData?.metadata?.protocol_count || 0;
    const hasData = insightData?.has_data;
    
    return (
      <Card style={styles.healthInsightCard}>
        <View style={styles.healthInsightHeader}>
          <View style={styles.healthInsightIconContainer}>
            <Ionicons name="pulse" size={24} color="#FF9500" />
          </View>
          <ThemedText variant="headingSmall" style={styles.healthInsightTitle}>
            Health Insights
            {hasActiveProtocols && (
              <ThemedText variant="caption" style={styles.protocolBadge}>
                {" "}• Protocol-aware
              </ThemedText>
            )}
          </ThemedText>
          {__DEV__ && (
            <TouchableOpacity 
              onPress={() => {
                AsyncStorage.getItem(USER_ID_KEY).then(userId => {
                  Alert.alert('Debug Info', `User ID: ${userId || 'Not found'}\nAuthenticated: ${isAuthenticated}\nUser: ${user ? user.id : 'null'}\nActive Protocols: ${protocolCount}\nHas Data: ${hasData}`);
                });
              }}
              style={styles.debugButton}
            >
              <Ionicons name="bug" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        {!insightData || !insightData.response ? (
          <View>
            <ThemedText variant="bodyMedium" style={styles.noDataText}>
              No health data available for analysis. Please sync your health data to get personalized insights.
            </ThemedText>
            <Button 
              title="Sync Health Data" 
              onPress={forceSyncHealthData} 
              variant="primary"
              size="sm"
              leftIcon="sync"
              style={styles.syncButton}
            />
          </View>
        ) : (
          <>
            <ThemedText variant="bodyMedium" style={styles.healthInsightText}>
              {insightData.response}
            </ThemedText>
            {hasActiveProtocols && (
              <TouchableOpacity 
                onPress={() => router.push('/protocols')}
                style={styles.viewProtocolsButton}
              >
                <ThemedText variant="labelSmall" style={styles.viewProtocolsText}>
                  View Active Protocols ({protocolCount})
                </ThemedText>
                <Ionicons name="chevron-forward" size={12} color={primaryColor as string} />
              </TouchableOpacity>
            )}
          </>
        )}
        
        <View style={styles.healthInsightFooter}>
          <ThemedText variant="caption" secondary>
            {trendTimePeriod === 'last_day' ? 'Past 24 hours' : 'Past 7 days'}
          </ThemedText>
          <TouchableOpacity 
            onPress={() => loadHealthInsights()}
            style={styles.refreshButton}
          >
            <ThemedText variant="labelSmall" style={styles.refreshButtonText}>
              Refresh
            </ThemedText>
            <Ionicons name="refresh" size={12} color={primaryColor as string} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // Render metrics section
  const renderMetrics = () => {
    const organizedMetrics = organizeMetrics(metrics);
    const metricTypes = Object.keys(organizedMetrics);

    if (metricTypes.length === 0) {
      return (
        <Card style={styles.noDataCard}>
          <ThemedText variant="bodyMedium" style={styles.noDataText}>
            No health data available for {getTimePeriodTitle().toLowerCase()}.
          </ThemedText>
          <Button 
            title="Sync Health Data" 
            onPress={forceSyncHealthData} 
            variant="primary"
            leftIcon="sync"
            style={styles.syncButton}
          />
        </Card>
      );
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
        {activeProtocols.map((protocol) => {
          // Ensure we have the protocol name and description
          const protocolName = protocol.name || protocol.protocol?.name || 'Protocol';
          const protocolDescription = protocol.description || protocol.protocol?.description || 'No description available';
          
          return (
            <Card
              key={protocol.id}
              title={protocolName}
              subtitle={`Started: ${new Date(protocol.start_date || '').toLocaleDateString()}`}
              leftIcon={<Ionicons name="list" size={24} color={secondaryColor as string} />}
              style={styles.protocolCard}
              onPress={() => router.push(`/protocol-details?id=${protocol.id}&type=user`)}
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
                    onPress={() => router.push(`/protocol-details?id=${protocol.id}&type=user`)}
                  />
                </View>
              }
            >
              <ThemedText variant="bodySmall" secondary numberOfLines={2}>
                {protocolDescription}
              </ThemedText>
            </Card>
          );
        })}
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  activePeriodButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: '#0066CC',
    fontWeight: '600',
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
  healthInsightCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  healthInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  healthInsightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  healthInsightTitle: {
    flex: 1,
  },
  healthInsightText: {
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  healthInsightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#0066CC',
    marginRight: 4,
  },
  healthInsightLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  healthInsightLoadingText: {
    marginLeft: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  errorButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  debugButton: {
    padding: 4,
  },
  protocolBadge: {
    color: '#34C759',
    fontSize: 12,
  },
  viewProtocolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  viewProtocolsText: {
    color: '#0066CC',
    marginRight: 4,
  },
});
