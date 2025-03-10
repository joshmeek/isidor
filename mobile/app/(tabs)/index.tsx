import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';

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

  // Function to load data
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

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load data. Please try again.');
      setIsLoading(false);
    }
  };

  // Load data when authentication state or time period changes
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, timePeriod]);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Function to render a metric value based on its type
  const renderMetricValue = (metric: HealthMetric) => {
    try {
      switch (metric.metric_type) {
        case 'sleep':
          // Handle different sleep value formats
          if (metric.value.duration_hours) {
            return `${metric.value.duration_hours} hours`;
          } else if (metric.value.duration) {
            return `${metric.value.duration} hours`;
          } else {
            return JSON.stringify(metric.value);
          }
        case 'steps':
          // Handle different steps value formats
          if (metric.value.count) {
            return metric.value.count.toString();
          } else if (typeof metric.value === 'number') {
            return metric.value.toString();
          } else {
            return JSON.stringify(metric.value);
          }
        case 'heart_rate':
          // Handle different heart rate value formats
          if (metric.value.bpm) {
            return `${metric.value.bpm} bpm`;
          } else if (metric.value.average) {
            return `${metric.value.average} bpm`;
          } else {
            return JSON.stringify(metric.value);
          }
        default:
          // For unknown metric types, just stringify the value
          return typeof metric.value === 'object' 
            ? JSON.stringify(metric.value) 
            : String(metric.value);
      }
    } catch (error) {
      console.error('Error rendering metric value:', error, metric);
      return 'Error displaying value';
    }
  };

  // Function to get time period title
  const getTimePeriodTitle = (): string => {
    switch (timePeriod) {
      case 'today':
        return "Today's Health Summary";
      case 'week':
        return "Last Week's Health Summary";
      case 'month':
        return "Last Month's Health Summary";
    }
  };

  // Function to organize metrics by type and date
  const organizeMetrics = (metrics: HealthMetric[]) => {
    // For 'today' view, just return the metrics as is but sorted by type
    if (timePeriod === 'today') {
      return [...metrics].sort((a, b) => a.metric_type.localeCompare(b.metric_type));
    }
    
    // For 'week' and 'month' views, group metrics by type
    const metricsByType: Record<string, HealthMetric[]> = {};
    
    // Group metrics by type
    metrics.forEach(metric => {
      if (!metricsByType[metric.metric_type]) {
        metricsByType[metric.metric_type] = [];
      }
      metricsByType[metric.metric_type].push(metric);
    });
    
    // Sort each group by date (newest first)
    Object.keys(metricsByType).forEach(type => {
      metricsByType[type].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    
    // Flatten the groups back into an array, with type headers first
    const organizedMetrics: HealthMetric[] = [];
    Object.keys(metricsByType).sort().forEach(type => {
      organizedMetrics.push(...metricsByType[type]);
    });
    
    return organizedMetrics;
  };

  // Function to calculate summary statistics for metrics
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
          
        case 'steps':
          // Calculate step count averages
          try {
            const counts = typeMetrics.map(m => {
              if (m.value.count) return m.value.count;
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
              if (m.value.bpm) return m.value.bpm;
              if (m.value.average) return m.value.average;
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

  // Function to render summary statistics
  const renderSummary = () => {
    if (timePeriod === 'today' || metrics.length === 0) {
      return null;
    }
    
    const summaries = calculateSummary(metrics);
    if (!summaries || Object.keys(summaries).length === 0) {
      return null;
    }
    
    return (
      <ThemedView style={styles.summaryContainer}>
        <ThemedText type="subtitle">Summary</ThemedText>
        
        {Object.keys(summaries).map(type => (
          <ThemedView key={type} style={styles.summaryItem}>
            <ThemedText style={styles.summaryTitle}>{type.toUpperCase()}</ThemedText>
            <ThemedView style={styles.summaryRow}>
              <ThemedText>Average:</ThemedText>
              <ThemedText type="defaultSemiBold">{summaries[type].avg}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.summaryRow}>
              <ThemedText>Min:</ThemedText>
              <ThemedText>{summaries[type].min}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.summaryRow}>
              <ThemedText>Max:</ThemedText>
              <ThemedText>{summaries[type].max}</ThemedText>
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
    );
  };

  // Function to render metrics with type grouping
  const renderMetrics = () => {
    if (metrics.length === 0) {
      return <ThemedText style={styles.emptyText}>No health data for this period</ThemedText>;
    }

    const organizedMetrics = organizeMetrics(metrics);
    let currentType = '';
    
    return (
      <>
        {organizedMetrics.map((metric, index) => {
          // Check if we need to render a type header
          const showTypeHeader = metric.metric_type !== currentType;
          if (showTypeHeader) {
            currentType = metric.metric_type;
          }
          
          return (
            <React.Fragment key={metric.id || index}>
              {showTypeHeader && (
                <ThemedView style={styles.metricTypeHeader}>
                  <ThemedText style={styles.metricTypeText}>{metric.metric_type.toUpperCase()}</ThemedText>
                </ThemedView>
              )}
              
              <ThemedView style={styles.metricRow}>
                <ThemedView style={styles.metricInfo}>
                  {timePeriod !== 'today' && (
                    <ThemedText style={styles.metricDate}>{new Date(metric.date).toLocaleDateString()}</ThemedText>
                  )}
                </ThemedView>
                <ThemedText type="defaultSemiBold">{renderMetricValue(metric)}</ThemedText>
              </ThemedView>
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // Update navigation paths in the renderActiveProtocols function
  const renderActiveProtocols = () => {
    if (activeProtocols.length === 0) {
      return (
        <ThemedView style={styles.emptyText}>No active protocols</ThemedView>
      );
    }
    
    return (
      <>
        {activeProtocols.map((protocol, index) => (
          <ThemedView key={protocol.id || index} style={styles.protocolItem}>
            <ThemedText type="defaultSemiBold">{protocol.name || protocol.protocol?.name || 'Unnamed Protocol'}</ThemedText>
            <ThemedText style={styles.protocolDescription}>
              {protocol.description || protocol.protocol?.description || ''}
            </ThemedText>
            {protocol.start_date && (
              <ThemedText style={styles.protocolDate}>
                Started: {new Date(protocol.start_date).toLocaleDateString()}
                {protocol.end_date ? ` - Ends: ${new Date(protocol.end_date).toLocaleDateString()}` : ''}
              </ThemedText>
            )}
            {protocol.status && (
              <ThemedText style={styles.protocolStatus}>
                Status: <ThemedText type="defaultSemiBold">{protocol.status}</ThemedText>
              </ThemedText>
            )}
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => {
                console.log('Navigating to protocol details with ID:', protocol.id);
                router.push({
                  pathname: "/protocol-details",
                  params: { id: protocol.id }
                });
              }}
            >
              <ThemedText style={styles.viewDetailsText}>View Details</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ))}
      </>
    );
  };

  // Show loading indicator
  if (isLoading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading your health data...</ThemedText>
      </ThemedView>
    );
  }

  // If not authenticated, show a message
  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Please log in to view your health data</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Isidor</ThemedText>
        <ThemedText type="subtitle">Welcome, {user?.email}</ThemedText>
      </ThemedView>
      
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}
      
      <ThemedView style={styles.card}>
        <ThemedView style={styles.cardHeader}>
          <ThemedText type="subtitle">{getTimePeriodTitle()}</ThemedText>
          
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, timePeriod === 'today' && styles.toggleButtonActive]} 
              onPress={() => setTimePeriod('today')}
            >
              <ThemedText style={[styles.toggleText, timePeriod === 'today' && styles.toggleTextActive]}>Today</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleButton, timePeriod === 'week' && styles.toggleButtonActive]} 
              onPress={() => setTimePeriod('week')}
            >
              <ThemedText style={[styles.toggleText, timePeriod === 'week' && styles.toggleTextActive]}>Week</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleButton, timePeriod === 'month' && styles.toggleButtonActive]} 
              onPress={() => setTimePeriod('month')}
            >
              <ThemedText style={[styles.toggleText, timePeriod === 'month' && styles.toggleTextActive]}>Month</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
        
        {renderMetrics()}
      </ThemedView>
      
      {renderSummary()}
      
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Active Protocols</ThemedText>
        
        {renderActiveProtocols()}
      </ThemedView>
      
      <ThemedView style={styles.logoutContainer}>
        <ThemedView style={styles.logoutButton} onTouchEnd={logout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: '#fff',
  },
  cardHeader: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  toggleButtonActive: {
    backgroundColor: '#0a7ea4',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metricInfo: {
    flex: 1,
  },
  metricDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  metricTypeHeader: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  metricTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  protocolItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  protocolDescription: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#666',
  },
  protocolDate: {
    marginTop: 4,
    fontStyle: 'italic',
    fontSize: 12,
    color: '#666',
  },
  protocolStatus: {
    marginTop: 4,
    fontStyle: 'italic',
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
  },
  summaryContainer: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: '#fff',
  },
  summaryItem: {
    marginTop: 12,
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0a7ea4',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0a7ea4',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  logoutContainer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logoutText: {
    color: '#d32f2f',
  },
  viewDetailsButton: {
    marginTop: 4,
    padding: 8,
    backgroundColor: '#0a7ea4',
    borderRadius: 4,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
