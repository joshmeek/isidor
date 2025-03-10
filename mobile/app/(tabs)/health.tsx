import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

// Types for health metrics
interface HealthMetric {
  id: string;
  user_id: string;
  date: string;
  metric_type: string;
  value: any;
  source: string;
}

// Types for health metric input
interface HealthMetricInput {
  metric_type: string;
  value: any;
  source: string;
  date: string;
}

export default function HealthScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view');
  
  // Form state for adding new metrics
  const [metricType, setMetricType] = useState<'sleep' | 'activity' | 'heart_rate'>('sleep');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Sleep metric values
  const [sleepDuration, setSleepDuration] = useState('');
  const [deepSleep, setDeepSleep] = useState('');
  const [remSleep, setRemSleep] = useState('');
  const [sleepScore, setSleepScore] = useState('');
  
  // Activity metric values
  const [steps, setSteps] = useState('');
  const [activeCalories, setActiveCalories] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('');
  
  // Heart rate metric values
  const [restingHr, setRestingHr] = useState('');
  const [hrv, setHrv] = useState('');

  // Function to load data
  const loadData = async () => {
    try {
      console.log('Loading health data...');
      setError(null);
      setIsLoading(true);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch health metrics for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      
      console.log('Fetching health metrics from', startDate, 'to', today);
      const metricsResponse = await api.getHealthMetrics(startDate, today);
      console.log('Received', metricsResponse.length, 'health metrics');
      setMetrics(metricsResponse);

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading health data:', err);
      setError('Failed to load health data. Please try again.');
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Refresh function for pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  };

  // Function to submit a new health metric
  const submitHealthMetric = async () => {
    try {
      setIsLoading(true);
      
      let metricValue: any = {};
      
      // Prepare the metric value based on the selected type
      switch (metricType) {
        case 'sleep':
          if (!sleepDuration) {
            Alert.alert('Error', 'Sleep duration is required');
            setIsLoading(false);
            return;
          }
          
          metricValue = {
            duration_hours: parseFloat(sleepDuration),
            deep_sleep_hours: deepSleep ? parseFloat(deepSleep) : 0,
            rem_sleep_hours: remSleep ? parseFloat(remSleep) : 0,
            sleep_score: sleepScore ? parseInt(sleepScore) : 0
          };
          break;
          
        case 'activity':
          if (!steps) {
            Alert.alert('Error', 'Steps count is required');
            setIsLoading(false);
            return;
          }
          
          metricValue = {
            steps: parseInt(steps),
            active_calories: activeCalories ? parseInt(activeCalories) : 0,
            active_minutes: activeMinutes ? parseInt(activeMinutes) : 0
          };
          break;
          
        case 'heart_rate':
          if (!restingHr) {
            Alert.alert('Error', 'Resting heart rate is required');
            setIsLoading(false);
            return;
          }
          
          metricValue = {
            resting_hr: parseInt(restingHr),
            hrv: hrv ? parseInt(hrv) : 0
          };
          break;
      }
      
      // Create the health metric object
      const healthMetric: HealthMetricInput = {
        metric_type: metricType,
        value: metricValue,
        source: 'manual',
        date: date
      };
      
      // Submit the health metric
      await api.createHealthMetric(healthMetric);
      
      // Reset form fields
      resetFormFields();
      
      // Reload data and switch to view tab
      await loadData();
      setActiveTab('view');
      
      Alert.alert('Success', 'Health metric added successfully');
      
    } catch (err) {
      console.error('Error submitting health metric:', err);
      Alert.alert('Error', 'Failed to add health metric. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset form fields
  const resetFormFields = () => {
    setSleepDuration('');
    setDeepSleep('');
    setRemSleep('');
    setSleepScore('');
    setSteps('');
    setActiveCalories('');
    setActiveMinutes('');
    setRestingHr('');
    setHrv('');
  };

  // Render the form for adding a new health metric
  const renderAddForm = () => {
    return (
      <View style={styles.formContainer}>
        <View style={styles.formSection}>
          <ThemedText style={styles.formSectionTitle}>Metric Type</ThemedText>
          <View style={styles.metricTypeSelector}>
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === 'sleep' && styles.metricTypeButtonActive,
              ]}
              onPress={() => setMetricType('sleep')}
            >
              <Ionicons 
                name="moon-outline" 
                size={20} 
                color={metricType === 'sleep' ? '#fff' : '#0a7ea4'} 
              />
              <ThemedText
                style={[
                  styles.metricTypeButtonText,
                  metricType === 'sleep' && styles.metricTypeButtonTextActive,
                ]}
              >
                Sleep
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === 'activity' && styles.metricTypeButtonActive,
              ]}
              onPress={() => setMetricType('activity')}
            >
              <Ionicons 
                name="walk-outline" 
                size={20} 
                color={metricType === 'activity' ? '#fff' : '#0a7ea4'} 
              />
              <ThemedText
                style={[
                  styles.metricTypeButtonText,
                  metricType === 'activity' && styles.metricTypeButtonTextActive,
                ]}
              >
                Activity
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === 'heart_rate' && styles.metricTypeButtonActive,
              ]}
              onPress={() => setMetricType('heart_rate')}
            >
              <Ionicons 
                name="heart-outline" 
                size={20} 
                color={metricType === 'heart_rate' ? '#fff' : '#0a7ea4'} 
              />
              <ThemedText
                style={[
                  styles.metricTypeButtonText,
                  metricType === 'heart_rate' && styles.metricTypeButtonTextActive,
                ]}
              >
                Heart Rate
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formSection}>
          <ThemedText style={styles.formSectionTitle}>Date</ThemedText>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            keyboardType="default"
          />
          <ThemedText style={styles.inputHelper}>Format: YYYY-MM-DD (e.g., 2025-03-15)</ThemedText>
        </View>
        
        {metricType === 'sleep' && (
          <View style={styles.formSection}>
            <ThemedText style={styles.formSectionTitle}>Sleep Details</ThemedText>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Duration (hours)*</ThemedText>
              <TextInput
                style={styles.input}
                value={sleepDuration}
                onChangeText={setSleepDuration}
                placeholder="7.5"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Deep Sleep (hours)</ThemedText>
              <TextInput
                style={styles.input}
                value={deepSleep}
                onChangeText={setDeepSleep}
                placeholder="1.2"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>REM Sleep (hours)</ThemedText>
              <TextInput
                style={styles.input}
                value={remSleep}
                onChangeText={setRemSleep}
                placeholder="1.8"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Sleep Score (0-100)</ThemedText>
              <TextInput
                style={styles.input}
                value={sleepScore}
                onChangeText={setSleepScore}
                placeholder="85"
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}
        
        {metricType === 'activity' && (
          <View style={styles.formSection}>
            <ThemedText style={styles.formSectionTitle}>Activity Details</ThemedText>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Steps*</ThemedText>
              <TextInput
                style={styles.input}
                value={steps}
                onChangeText={setSteps}
                placeholder="8000"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Active Calories</ThemedText>
              <TextInput
                style={styles.input}
                value={activeCalories}
                onChangeText={setActiveCalories}
                placeholder="350"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Active Minutes</ThemedText>
              <TextInput
                style={styles.input}
                value={activeMinutes}
                onChangeText={setActiveMinutes}
                placeholder="45"
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}
        
        {metricType === 'heart_rate' && (
          <View style={styles.formSection}>
            <ThemedText style={styles.formSectionTitle}>Heart Rate Details</ThemedText>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Resting HR (bpm)*</ThemedText>
              <TextInput
                style={styles.input}
                value={restingHr}
                onChangeText={setRestingHr}
                placeholder="65"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>HRV (ms)</ThemedText>
              <TextInput
                style={styles.input}
                value={hrv}
                onChangeText={setHrv}
                placeholder="45"
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitHealthMetric}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Add Health Metric</ThemedText>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              resetFormFields();
              setActiveTab('view');
            }}
            disabled={isLoading}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render the list of health metrics
  const renderHealthMetrics = () => {
    if (metrics.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color="#999" />
          <ThemedText style={styles.emptyText}>No health data available</ThemedText>
          <TouchableOpacity 
            style={styles.addDataButton}
            onPress={() => setActiveTab('add')}
          >
            <ThemedText style={styles.addDataButtonText}>Add Health Data</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    // Group metrics by date
    const metricsByDate: Record<string, HealthMetric[]> = {};
    metrics.forEach(metric => {
      if (!metricsByDate[metric.date]) {
        metricsByDate[metric.date] = [];
      }
      metricsByDate[metric.date].push(metric);
    });

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(metricsByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    return (
      <View style={styles.metricsContainer}>
        {sortedDates.map(date => (
          <View key={date} style={styles.dateSection}>
            <ThemedText style={styles.dateHeader}>
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </ThemedText>
            
            {metricsByDate[date].map(metric => (
              <View key={metric.id} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={styles.metricTypeContainer}>
                    {metric.metric_type === 'sleep' && (
                      <Ionicons name="moon-outline" size={20} color="#0a7ea4" />
                    )}
                    {metric.metric_type === 'activity' && (
                      <Ionicons name="walk-outline" size={20} color="#0a7ea4" />
                    )}
                    {metric.metric_type === 'heart_rate' && (
                      <Ionicons name="heart-outline" size={20} color="#0a7ea4" />
                    )}
                    <ThemedText style={styles.metricType}>
                      {metric.metric_type.replace('_', ' ').toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.metricSource}>
                    Source: {metric.source}
                  </ThemedText>
                </View>
                
                <View style={styles.metricContent}>
                  {metric.metric_type === 'sleep' && (
                    <View>
                      <ThemedText style={styles.metricValue}>
                        {metric.value.duration_hours.toFixed(1)} hours
                      </ThemedText>
                      <View style={styles.metricDetails}>
                        <ThemedText style={styles.metricDetail}>
                          Deep: {metric.value.deep_sleep_hours.toFixed(1)}h
                        </ThemedText>
                        <ThemedText style={styles.metricDetail}>
                          REM: {metric.value.rem_sleep_hours.toFixed(1)}h
                        </ThemedText>
                        <ThemedText style={styles.metricDetail}>
                          Score: {metric.value.sleep_score}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                  
                  {metric.metric_type === 'activity' && (
                    <View>
                      <ThemedText style={styles.metricValue}>
                        {metric.value.steps.toLocaleString()} steps
                      </ThemedText>
                      <View style={styles.metricDetails}>
                        <ThemedText style={styles.metricDetail}>
                          Calories: {metric.value.active_calories}
                        </ThemedText>
                        <ThemedText style={styles.metricDetail}>
                          Active: {metric.value.active_minutes} min
                        </ThemedText>
                      </View>
                    </View>
                  )}
                  
                  {metric.metric_type === 'heart_rate' && (
                    <View>
                      <ThemedText style={styles.metricValue}>
                        {metric.value.resting_hr} bpm
                      </ThemedText>
                      <View style={styles.metricDetails}>
                        <ThemedText style={styles.metricDetail}>
                          HRV: {metric.value.hrv} ms
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Health Data</ThemedText>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'view' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('view')}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                activeTab === 'view' && styles.activeTabButtonText,
              ]}
            >
              View Data
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'add' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('add')}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                activeTab === 'add' && styles.activeTabButtonText,
              ]}
            >
              Add Data
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'view' ? (
        isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <ThemedText style={styles.loadingText}>Loading health data...</ThemedText>
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
            {renderHealthMetrics()}
            <View style={styles.spacer} />
          </ScrollView>
        )
      ) : (
        <ScrollView style={styles.scrollView}>
          {renderAddForm()}
          <View style={styles.spacer} />
        </ScrollView>
      )}
      
      {activeTab === 'view' && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setActiveTab('add')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: '#0a7ea4',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
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
  metricsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#0a7ea4',
  },
  metricSource: {
    fontSize: 12,
    color: '#999',
  },
  metricContent: {
    marginLeft: 28,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 8,
  },
  metricDetail: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formSection: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metricTypeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    gap: 8,
  },
  metricTypeButtonActive: {
    backgroundColor: '#0a7ea4',
  },
  metricTypeButtonText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  metricTypeButtonTextActive: {
    color: '#fff',
  },
  inputRow: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  inputHelper: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  spacer: {
    height: 80,
  },
}); 