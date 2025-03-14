import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, ThemedView, Button, Card, MetricCard, TextInput } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { MetricType } from '@/services/api';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import HealthKitSync from '@/components/HealthKitSync';

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
  metric_type: MetricType;
  value: any;
  source: string;
  date: string;
  user_id: string;
}

export default function HealthScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view');
  
  // Get URL parameters
  const params = useLocalSearchParams();
  const activeMetricTab = params.activeTab as string | undefined;
  
  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary') as string;
  const secondaryColor = useThemeColor({}, 'secondary') as string;
  const backgroundColor = useThemeColor({}, 'backgroundSecondary') as string;
  const errorColor = useThemeColor({}, 'error') as string;
  const successColor = useThemeColor({}, 'success') as string;
  
  // Form state for adding new metrics
  const [metricType, setMetricType] = useState<MetricType>(MetricType.SLEEP);
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

  // Weight metric values
  const [weight, setWeight] = useState('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [waterPercentage, setWaterPercentage] = useState('');
  const [boneMass, setBoneMass] = useState('');

  // Calories metric values
  const [totalCalories, setTotalCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [mealType, setMealType] = useState('');
  const [mealName, setMealName] = useState('');
  const [caloriesNotes, setCaloriesNotes] = useState('');

  // Event metric values
  const [eventType, setEventType] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [eventDuration, setEventDuration] = useState('');
  const [eventIntensity, setEventIntensity] = useState('');

  // Set active metric type from URL parameter if provided
  useEffect(() => {
    if (activeMetricTab && Object.values(MetricType).includes(activeMetricTab as MetricType)) {
      setMetricType(activeMetricTab as MetricType);
    }
  }, [activeMetricTab]);

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
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        Alert.alert('Error', 'Date must be in YYYY-MM-DD format');
        setIsLoading(false);
        return;
      }
      
      let metricValue: any = {};
      
      // Prepare the metric value based on the selected type
      switch (metricType) {
        case MetricType.SLEEP:
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
          
        case MetricType.ACTIVITY:
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
          
        case MetricType.HEART_RATE:
          if (!restingHr) {
            Alert.alert('Error', 'Resting heart rate is required');
            setIsLoading(false);
            return;
          }
          
          metricValue = {
            average_bpm: parseInt(restingHr),
            resting_bpm: parseInt(restingHr),
            hrv_ms: hrv ? parseFloat(hrv) : 0
          };
          break;

        case MetricType.WEIGHT:
          if (!weight) {
            Alert.alert('Error', 'Weight is required');
            setIsLoading(false);
            return;
          }
          
          metricValue = {
            value: parseFloat(weight),
            body_fat_percentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
            muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
            water_percentage: waterPercentage ? parseFloat(waterPercentage) : null,
            bone_mass: boneMass ? parseFloat(boneMass) : null
          };
          break;

        case MetricType.CALORIES:
          if (!totalCalories) {
            Alert.alert('Error', 'Total calories is required');
            setIsLoading(false);
            return;
          }
          
          metricValue = {
            total: parseInt(totalCalories),
            protein: protein ? parseFloat(protein) : null,
            fat: fat ? parseFloat(fat) : null,
            carbs: carbs ? parseFloat(carbs) : null,
            meal_type: mealType || null,
            meal_name: mealName || null,
            notes: caloriesNotes || null
          };
          break;

        case MetricType.EVENT:
          if (!eventType) {
            Alert.alert('Error', 'Event type is required');
            setIsLoading(false);
            return;
          }
          
          metricValue = {
            event_type: eventType,
            notes: eventNotes || null,
            duration_minutes: eventDuration ? parseInt(eventDuration) : null,
            intensity: eventIntensity ? parseInt(eventIntensity) : null
          };
          break;
      }
      
      // Get the current user ID
      const currentUser = await api.getCurrentUser();
      
      // Create the health metric object
      const healthMetric: HealthMetricInput = {
        metric_type: metricType,
        value: metricValue,
        source: 'manual',
        date: date,
        user_id: currentUser.id
      };
      
      console.log('Creating health metric:', healthMetric);
      
      // Submit the health metric
      await api.createHealthMetric(healthMetric);
      
      // Reset form fields
      resetFormFields();
      
      // Reload data and switch to view tab
      await loadData();
      setActiveTab('view');
      
      // Show success message
      Alert.alert('Success', 'Health metric added successfully');
    } catch (error) {
      console.error('Error submitting health metric:', error);
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
    setWeight('');
    setBodyFatPercentage('');
    setMuscleMass('');
    setWaterPercentage('');
    setBoneMass('');
    setTotalCalories('');
    setProtein('');
    setFat('');
    setCarbs('');
    setMealType('');
    setMealName('');
    setCaloriesNotes('');
    setEventType('');
    setEventNotes('');
    setEventDuration('');
    setEventIntensity('');
  };

  // Render the form to add new health metrics
  const renderAddForm = () => {
    return (
      <Card style={styles.formContainer}>
        <View style={styles.formSection}>
          <ThemedText variant="headingMedium" style={styles.formSectionTitle}>
            Metric Type
          </ThemedText>
          <View style={styles.metricTypeSelector}>
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === MetricType.SLEEP && styles.metricTypeButtonActive,
              ]}
              onPress={() => setMetricType(MetricType.SLEEP)}
            >
              <Ionicons 
                name="moon" 
                size={24} 
                color={metricType === MetricType.SLEEP ? '#fff' : '#5E5CE6'} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.metricTypeButtonText,
                  metricType === MetricType.SLEEP && styles.metricTypeButtonTextActive,
                  { color: metricType === MetricType.SLEEP ? '#fff' : '#5E5CE6' }
                ]}
              >
                Sleep
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === MetricType.ACTIVITY && styles.metricTypeButtonActive,
                { borderColor: '#FF9500' }
              ]}
              onPress={() => setMetricType(MetricType.ACTIVITY)}
            >
              <Ionicons 
                name="footsteps" 
                size={24} 
                color={metricType === MetricType.ACTIVITY ? '#fff' : '#FF9500'} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.metricTypeButtonText,
                  metricType === MetricType.ACTIVITY && styles.metricTypeButtonTextActive,
                  { color: metricType === MetricType.ACTIVITY ? '#fff' : '#FF9500' }
                ]}
              >
                Activity
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === MetricType.HEART_RATE && styles.metricTypeButtonActive,
                { borderColor: '#FF2D55' }
              ]}
              onPress={() => setMetricType(MetricType.HEART_RATE)}
            >
              <Ionicons 
                name="heart" 
                size={24} 
                color={metricType === MetricType.HEART_RATE ? '#fff' : '#FF2D55'} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.metricTypeButtonText,
                  metricType === MetricType.HEART_RATE && styles.metricTypeButtonTextActive,
                  { color: metricType === MetricType.HEART_RATE ? '#fff' : '#FF2D55' }
                ]}
              >
                Heart Rate
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.metricTypeSelector}>
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === MetricType.WEIGHT && styles.metricTypeButtonActive,
                { borderColor: '#AF52DE' }
              ]}
              onPress={() => setMetricType(MetricType.WEIGHT)}
            >
              <Ionicons 
                name="fitness" 
                size={24} 
                color={metricType === MetricType.WEIGHT ? '#fff' : '#AF52DE'} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.metricTypeButtonText,
                  metricType === MetricType.WEIGHT && styles.metricTypeButtonTextActive,
                  { color: metricType === MetricType.WEIGHT ? '#fff' : '#AF52DE' }
                ]}
              >
                Weight
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === MetricType.CALORIES && styles.metricTypeButtonActive,
                { borderColor: '#34C759' }
              ]}
              onPress={() => setMetricType(MetricType.CALORIES)}
            >
              <Ionicons 
                name="restaurant" 
                size={24} 
                color={metricType === MetricType.CALORIES ? '#fff' : '#34C759'} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.metricTypeButtonText,
                  metricType === MetricType.CALORIES && styles.metricTypeButtonTextActive,
                  { color: metricType === MetricType.CALORIES ? '#fff' : '#34C759' }
                ]}
              >
                Calories
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.metricTypeButton,
                metricType === MetricType.EVENT && styles.metricTypeButtonActive,
                { borderColor: '#007AFF' }
              ]}
              onPress={() => setMetricType(MetricType.EVENT)}
            >
              <Ionicons 
                name="calendar" 
                size={24} 
                color={metricType === MetricType.EVENT ? '#fff' : '#007AFF'} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.metricTypeButtonText,
                  metricType === MetricType.EVENT && styles.metricTypeButtonTextActive,
                  { color: metricType === MetricType.EVENT ? '#fff' : '#007AFF' }
                ]}
              >
                Event
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formSection}>
          <ThemedText variant="headingMedium" style={styles.formSectionTitle}>
            Date
          </ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              label="Date (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              helper="Format: YYYY-MM-DD (e.g., 2023-10-15)"
            />
          </View>
        </View>
        
        {metricType === MetricType.SLEEP && (
          <View style={styles.formSection}>
            <ThemedText variant="headingMedium" style={styles.formSectionTitle}>
              Sleep Details
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Duration (hours)"
                value={sleepDuration}
                onChangeText={setSleepDuration}
                placeholder="7.5"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Deep Sleep (hours)"
                value={deepSleep}
                onChangeText={setDeepSleep}
                placeholder="1.5"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="REM Sleep (hours)"
                value={remSleep}
                onChangeText={setRemSleep}
                placeholder="2.0"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Sleep Score (0-100)"
                value={sleepScore}
                onChangeText={setSleepScore}
                placeholder="85"
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}
        
        {metricType === MetricType.ACTIVITY && (
          <View style={styles.formSection}>
            <ThemedText variant="headingMedium" style={styles.formSectionTitle}>
              Activity Details
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Steps"
                value={steps}
                onChangeText={setSteps}
                placeholder="10000"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Active Calories"
                value={activeCalories}
                onChangeText={setActiveCalories}
                placeholder="350"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Active Minutes"
                value={activeMinutes}
                onChangeText={setActiveMinutes}
                placeholder="45"
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}
        
        {metricType === MetricType.HEART_RATE && (
          <View style={styles.formSection}>
            <ThemedText variant="headingMedium" style={styles.formSectionTitle}>
              Heart Rate Details
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Resting Heart Rate (bpm)"
                value={restingHr}
                onChangeText={setRestingHr}
                placeholder="65"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Heart Rate Variability (ms)"
                value={hrv}
                onChangeText={setHrv}
                placeholder="45"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}

        {metricType === MetricType.WEIGHT && (
          <View style={styles.formSection}>
            <ThemedText variant="headingMedium" style={styles.formSectionTitle}>
              Weight Details
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Weight (lbs/kg)"
                value={weight}
                onChangeText={setWeight}
                placeholder="150"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Body Fat Percentage (%)"
                value={bodyFatPercentage}
                onChangeText={setBodyFatPercentage}
                placeholder="20"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Muscle Mass (lbs/kg)"
                value={muscleMass}
                onChangeText={setMuscleMass}
                placeholder="65"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Water Percentage (%)"
                value={waterPercentage}
                onChangeText={setWaterPercentage}
                placeholder="60"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Bone Mass (lbs/kg)"
                value={boneMass}
                onChangeText={setBoneMass}
                placeholder="3.5"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}

        {metricType === MetricType.CALORIES && (
          <View style={styles.formSection}>
            <ThemedText variant="headingMedium" style={styles.formSectionTitle}>
              Calories Details
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Total Calories"
                value={totalCalories}
                onChangeText={setTotalCalories}
                placeholder="500"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Protein (g)"
                value={protein}
                onChangeText={setProtein}
                placeholder="25"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Fat (g)"
                value={fat}
                onChangeText={setFat}
                placeholder="15"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Carbs (g)"
                value={carbs}
                onChangeText={setCarbs}
                placeholder="60"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Meal Type"
                value={mealType}
                onChangeText={setMealType}
                placeholder="Breakfast, Lunch, Dinner, Snack"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Meal Name"
                value={mealName}
                onChangeText={setMealName}
                placeholder="Chicken Salad"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Notes"
                value={caloriesNotes}
                onChangeText={setCaloriesNotes}
                placeholder="Additional details about the meal"
                multiline
              />
            </View>
          </View>
        )}

        {metricType === MetricType.EVENT && (
          <View style={styles.formSection}>
            <ThemedText variant="headingMedium" style={styles.formSectionTitle}>
              Event Details
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Event Type"
                value={eventType}
                onChangeText={setEventType}
                placeholder="Alcohol, Travel, Stress, etc."
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Duration (minutes)"
                value={eventDuration}
                onChangeText={setEventDuration}
                placeholder="60"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Intensity (1-10)"
                value={eventIntensity}
                onChangeText={setEventIntensity}
                placeholder="5"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Notes"
                value={eventNotes}
                onChangeText={setEventNotes}
                placeholder="Additional details about the event"
                multiline
              />
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            title="Add Health Metric"
            onPress={submitHealthMetric}
            disabled={isLoading}
            isLoading={isLoading}
            variant="primary"
            fullWidth
          />
          
          <Button
            title="Cancel"
            onPress={() => {
              resetFormFields();
              setActiveTab('view');
            }}
            disabled={isLoading}
            variant="outline"
            fullWidth
          />
        </View>
      </Card>
    );
  };

  // Render the list of health metrics
  const renderHealthMetrics = () => {
    if (metrics.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <ThemedText variant="bodyMedium" style={styles.emptyText}>
            No health data available
          </ThemedText>
          <Button 
            title="Add Health Data" 
            onPress={() => setActiveTab('add')} 
            variant="primary"
            leftIcon="add"
            style={styles.addButton}
          />
        </Card>
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

    // Helper function to get icon and color for metric type
    const getMetricTypeInfo = (type: string) => {
      switch (type) {
        case 'sleep':
          return { 
            icon: 'moon', 
            color: '#5E5CE6', // Purple
            bgColor: 'rgba(94, 92, 230, 0.1)' 
          };
        case 'activity':
          return { 
            icon: 'footsteps', 
            color: '#FF9500', // Orange
            bgColor: 'rgba(255, 149, 0, 0.1)' 
          };
        case 'heart_rate':
          return { 
            icon: 'heart', 
            color: '#FF2D55', // Red
            bgColor: 'rgba(255, 45, 85, 0.1)' 
          };
        case 'mood':
          return { 
            icon: 'happy', 
            color: '#34C759', // Green
            bgColor: 'rgba(52, 199, 89, 0.1)' 
          };
        case 'weight':
          return { 
            icon: 'fitness', 
            color: '#AF52DE', // Purple
            bgColor: 'rgba(175, 82, 222, 0.1)' 
          };
        case 'blood_pressure':
          return { 
            icon: 'pulse', 
            color: '#FF3B30', // Red
            bgColor: 'rgba(255, 59, 48, 0.1)' 
          };
        case 'calories':
          return { 
            icon: 'restaurant', 
            color: '#34C759', // Green
            bgColor: 'rgba(52, 199, 89, 0.1)' 
          };
        case 'event':
          return { 
            icon: 'calendar', 
            color: '#007AFF', // Blue
            bgColor: 'rgba(0, 122, 255, 0.1)' 
          };
        default:
          return { 
            icon: 'analytics', 
            color: '#0066CC', // Primary blue
            bgColor: 'rgba(0, 102, 204, 0.1)' 
          };
      }
    };

    // Helper function to format metric value
    const formatMetricValue = (metric: HealthMetric) => {
      try {
        switch (metric.metric_type) {
          case 'sleep':
            const duration = metric.value.duration_hours?.toFixed(1) || '0';
            return {
              primary: `${duration} hrs`,
              details: [
                { label: 'Deep Sleep', value: `${metric.value.deep_sleep_hours?.toFixed(1) || '0'} hrs` },
                { label: 'REM Sleep', value: `${metric.value.rem_sleep_hours?.toFixed(1) || '0'} hrs` },
                { label: 'Score', value: `${metric.value.sleep_score || 'N/A'}` },
              ]
            };
          case 'activity':
            const steps = parseInt(metric.value.steps || '0');
            return {
              primary: `${steps.toLocaleString()} steps`,
              details: [
                { label: 'Active Calories', value: `${metric.value.active_calories || '0'} cal` },
                { label: 'Active Minutes', value: `${metric.value.active_minutes || '0'} min` },
              ]
            };
          case 'heart_rate':
            const heartRate = metric.value.average_bpm || metric.value.resting_bpm || '0';
            return {
              primary: `${heartRate} bpm`,
              details: [
                { label: 'Resting HR', value: `${metric.value.resting_bpm || '0'} bpm` },
                { label: 'HRV', value: `${metric.value.hrv_ms || '0'} ms` },
              ]
            };
          case 'weight':
            const weightValue = metric.value.value?.toFixed(1) || '0';
            return {
              primary: `${weightValue} lbs`,
              details: [
                { label: 'Body Fat', value: `${metric.value.body_fat_percentage?.toFixed(1) || 'N/A'}%` },
                { label: 'Muscle Mass', value: `${metric.value.muscle_mass?.toFixed(1) || 'N/A'} lbs` },
                { label: 'Water %', value: `${metric.value.water_percentage?.toFixed(1) || 'N/A'}%` },
                { label: 'Bone Mass', value: `${metric.value.bone_mass?.toFixed(1) || 'N/A'} lbs` },
              ]
            };
          case 'calories':
            const calories = metric.value.total || '0';
            return {
              primary: `${calories} cal`,
              details: [
                { label: 'Protein', value: `${metric.value.protein?.toFixed(1) || '0'} g` },
                { label: 'Fat', value: `${metric.value.fat?.toFixed(1) || '0'} g` },
                { label: 'Carbs', value: `${metric.value.carbs?.toFixed(1) || '0'} g` },
                { label: 'Meal', value: metric.value.meal_name || metric.value.meal_type || 'N/A' },
              ]
            };
          case 'event':
            return {
              primary: metric.value.event_type || 'Event',
              details: [
                { label: 'Duration', value: metric.value.duration_minutes ? `${metric.value.duration_minutes} min` : 'N/A' },
                { label: 'Intensity', value: metric.value.intensity ? `${metric.value.intensity}/10` : 'N/A' },
                { label: 'Notes', value: metric.value.notes || 'No notes' },
              ]
            };
          case 'mood':
            const score = metric.value.score || metric.value.rating || '0';
            return {
              primary: `${score}/10`,
              details: [
                { label: 'Notes', value: metric.value.notes || 'No notes' },
                { label: 'Energy', value: `${metric.value.energy_level || metric.value.energy || 'N/A'}/10` },
              ]
            };
          default:
            // For unknown metric types, try to extract meaningful data
            if (typeof metric.value === 'object') {
              // Try to find a main value to display
              const mainValue = 
                metric.value.value || 
                metric.value.score || 
                metric.value.count || 
                metric.value.average_bpm || 
                'N/A';
              
              // Create details from other properties
              const details = Object.entries(metric.value)
                .filter(([key]) => key !== 'value' && key !== 'score' && key !== 'count' && key !== 'average_bpm')
                .map(([key, value]) => ({
                  label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  value: typeof value === 'number' ? value.toString() : String(value)
                }));
              
              return {
                primary: mainValue.toString(),
                details
              };
            }
            
            return {
              primary: typeof metric.value === 'object' ? 
                JSON.stringify(metric.value).substring(0, 30) + '...' : 
                String(metric.value),
              details: []
            };
        }
      } catch (error) {
        console.error('Error formatting metric value:', error, metric);
        return { 
          primary: 'Error', 
          details: [{ label: 'Error', value: 'Could not format metric data' }] 
        };
      }
    };

    return (
      <View style={styles.metricsContainer}>
        {sortedDates.map(date => {
          // Format the date in a more readable way
          const formattedDate = new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          // Sort metrics by type for consistent ordering
          const sortedMetrics = [...metricsByDate[date]].sort((a, b) => 
            a.metric_type.localeCompare(b.metric_type)
          );
          
          return (
            <View key={date} style={styles.dateSection}>
              <ThemedText variant="headingSmall" style={styles.dateHeader}>
                {formattedDate}
              </ThemedText>
              
              <Card style={styles.dateCard}>
                {sortedMetrics.map((metric, index) => {
                  const typeInfo = getMetricTypeInfo(metric.metric_type);
                  const formattedValue = formatMetricValue(metric);
                  
                  return (
                    <View key={metric.id}>
                      <View style={styles.metricRow}>
                        <View style={styles.metricTypeContainer}>
                          <View style={[styles.iconContainer, { backgroundColor: typeInfo.bgColor }]}>
                            <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
                          </View>
                          <View>
                            <ThemedText variant="labelMedium" style={styles.metricType}>
                              {metric.metric_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </ThemedText>
                            <ThemedText variant="caption" secondary style={styles.metricSource}>
                              {metric.source.charAt(0).toUpperCase() + metric.source.slice(1)}
                            </ThemedText>
                          </View>
                        </View>
                        
                        <View style={styles.metricValueContainer}>
                          <ThemedText variant="headingMedium" style={styles.metricValue}>
                            {formattedValue.primary}
                          </ThemedText>
                        </View>
                      </View>
                      
                      {formattedValue.details.length > 0 && (
                        <View style={styles.metricDetails}>
                          {formattedValue.details.map((detail, detailIndex) => (
                            <View key={detailIndex} style={styles.detailItem}>
                              <ThemedText variant="labelSmall" secondary>
                                {detail.label}:
                              </ThemedText>
                              <ThemedText variant="bodySmall" style={styles.detailValue}>
                                {detail.value}
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {index < sortedMetrics.length - 1 && <View style={styles.divider} />}
                    </View>
                  );
                })}
              </Card>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText variant="bodyMedium" style={styles.loadingText}>
            Loading health data...
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[primaryColor as string]} 
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <ThemedText variant="displaySmall" style={styles.title}>
            Health Metrics
          </ThemedText>
          
          {/* Add HealthKit Sync Component */}
          {Platform.OS === 'ios' && (
            <HealthKitSync onSync={onRefresh} />
          )}
          
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'view' && styles.activeTabButton,
                { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
              ]}
              onPress={() => setActiveTab('view')}
            >
              <ThemedText
                variant="labelMedium"
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
                { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
              ]}
              onPress={() => setActiveTab('add')}
            >
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.tabButtonText,
                  activeTab === 'add' && styles.activeTabButtonText,
                ]}
              >
                Add Data
              </ThemedText>
            </TouchableOpacity>
          </View>

          {activeTab === 'view' ? (
            error ? (
              <Card style={styles.errorCard}>
                <ThemedText variant="bodyMedium" style={styles.errorText}>
                  {error}
                </ThemedText>
                <Button 
                  title="Retry" 
                  onPress={loadData} 
                  variant="primary"
                  size="sm"
                  leftIcon="refresh"
                  style={styles.retryButton}
                />
              </Card>
            ) : (
              renderHealthMetrics()
            )
          ) : (
            renderAddForm()
          )}
        </ScrollView>
      )}
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  metricsContainer: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  dateSection: {
    marginBottom: spacing.md,
  },
  dateHeader: {
    marginBottom: spacing.sm,
    color: '#667085',
    fontSize: 16,
    fontWeight: '600',
  },
  dateCard: {
    padding: 0,
    borderRadius: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  metricTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  metricValueContainer: {
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  metricSource: {
    fontSize: 12,
    color: '#667085',
  },
  metricDetails: {
    marginTop: 0,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailValue: {
    marginLeft: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  addButton: {
    marginTop: spacing.sm,
  },
  formContainer: {
    padding: spacing.md,
    borderRadius: spacing.md,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  formSectionTitle: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  metricTypeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricTypeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1.5,
    borderColor: '#5E5CE6',
    gap: spacing.xs,
  },
  metricTypeButtonActive: {
    backgroundColor: '#5E5CE6',
  },
  metricTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  metricTypeButtonTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
}); 