import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as healthkit from '@/services/healthkit';
import * as api from '@/services/api';

// Define the return type for the hook
interface HealthKitData {
  isAvailable: boolean;
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;
  steps: number;
  distance: number;
  flightsClimbed: number;
  activeEnergyBurned: number;
  heartRate: number | null;
  weight: number | null;
  bodyFat: number | null;
  syncWithHealthKit: (userId: string) => Promise<void>;
}

// Storage key for permissions
const HEALTHKIT_PERMISSIONS_KEY = 'healthkit_permissions';

const useHealthKit = (): HealthKitData => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Health data states
  const [steps, setSteps] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [flightsClimbed, setFlightsClimbed] = useState<number>(0);
  const [activeEnergyBurned, setActiveEnergyBurned] = useState<number>(0);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);

  // Check if HealthKit is available and initialize it
  useEffect(() => {
    const checkHealthKit = async () => {
      try {
        // Check if HealthKit is available (iOS only)
        const available = healthkit.isHealthKitAvailable();
        setIsAvailable(available);

        if (!available) {
          setIsLoading(false);
          return;
        }

        // Check if we already have permissions
        const storedPermissions = await AsyncStorage.getItem(HEALTHKIT_PERMISSIONS_KEY);
        if (storedPermissions === 'true') {
          setHasPermissions(true);
        }

        // Initialize HealthKit
        await healthkit.initHealthKit();
        
        // If we get here without errors, we have permissions
        setHasPermissions(true);
        await AsyncStorage.setItem(HEALTHKIT_PERMISSIONS_KEY, 'true');
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing HealthKit:', err);
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    };

    checkHealthKit();
  }, []);

  // Fetch health data when permissions are granted
  useEffect(() => {
    if (!isAvailable || !hasPermissions || isLoading) {
      return;
    }

    const fetchHealthData = async () => {
      try {
        setIsLoading(true);
        
        // Get today's date
        const today = new Date().toISOString();
        
        // Fetch health data
        const [stepsData, distanceData, flightsData, caloriesData] = await Promise.all([
          healthkit.getStepCount(today),
          healthkit.getDistanceWalkingRunning(today),
          healthkit.getFlightsClimbed(today),
          healthkit.getActiveEnergyBurned(today),
        ]);
        
        // Update state with fetched data
        setSteps(stepsData);
        setDistance(distanceData);
        setFlightsClimbed(flightsData);
        setActiveEnergyBurned(caloriesData);
        
        // Get heart rate (most recent)
        try {
          const heartRateData = await healthkit.getHeartRateSamples();
          if (heartRateData && heartRateData.length > 0) {
            setHeartRate(heartRateData[0].value);
          }
        } catch (err) {
          console.log('Error fetching heart rate:', err);
        }
        
        // Get weight (most recent)
        try {
          const weightData = await healthkit.getWeightSamples();
          if (weightData && weightData.length > 0) {
            setWeight(weightData[0].value);
          }
        } catch (err) {
          console.log('Error fetching weight:', err);
        }
        
        // Get body fat percentage (most recent)
        try {
          const bodyFatData = await healthkit.getBodyFatPercentageSamples();
          if (bodyFatData && bodyFatData.length > 0) {
            setBodyFat(bodyFatData[0].value);
          }
        } catch (err) {
          console.log('Error fetching body fat percentage:', err);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    };

    fetchHealthData();
  }, [isAvailable, hasPermissions]);

  // Function to sync HealthKit data with the backend
  const syncWithHealthKit = async (userId: string) => {
    if (!isAvailable) {
      Alert.alert('Not Available', 'HealthKit is only available on iOS devices.');
      return;
    }

    if (!hasPermissions) {
      Alert.alert('Permission Required', 'Please grant permission to access your health data.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get today's date
      const today = new Date().toISOString();
      const todayFormatted = today.split('T')[0]; // YYYY-MM-DD format
      
      // Fetch health data
      const [stepsData, distanceData, flightsData, caloriesData] = await Promise.all([
        healthkit.getStepCount(today),
        healthkit.getDistanceWalkingRunning(today),
        healthkit.getFlightsClimbed(today),
        healthkit.getActiveEnergyBurned(today),
      ]);
      
      // Create health metrics for the backend
      const activityMetric = {
        metric_type: api.MetricType.ACTIVITY,
        value: {
          steps: stepsData,
          distance: distanceData,
          flights_climbed: flightsData,
        },
        source: 'Apple HealthKit',
        date: todayFormatted,
        user_id: userId,
      };
      
      const caloriesMetric = {
        metric_type: api.MetricType.CALORIES,
        value: {
          active_calories: caloriesData,
        },
        source: 'Apple HealthKit',
        date: todayFormatted,
        user_id: userId,
      };
      
      // Send data to backend
      await Promise.all([
        api.createHealthMetric(activityMetric),
        api.createHealthMetric(caloriesMetric),
      ]);
      
      // Try to get and sync heart rate data
      try {
        const heartRateData = await healthkit.getHeartRateSamples();
        if (heartRateData && heartRateData.length > 0) {
          const latestHeartRate = heartRateData[0];
          const heartRateMetric = {
            metric_type: api.MetricType.HEART_RATE,
            value: {
              bpm: latestHeartRate.value,
              resting: false,
            },
            source: 'Apple HealthKit',
            date: todayFormatted,
            user_id: userId,
          };
          await api.createHealthMetric(heartRateMetric);
        }
      } catch (err) {
        console.log('Error syncing heart rate:', err);
      }
      
      // Try to get and sync weight data
      try {
        const weightData = await healthkit.getWeightSamples();
        if (weightData && weightData.length > 0) {
          const latestWeight = weightData[0];
          const weightMetric = {
            metric_type: api.MetricType.WEIGHT,
            value: {
              weight: latestWeight.value,
              unit: 'lb',
            },
            source: 'Apple HealthKit',
            date: todayFormatted,
            user_id: userId,
          };
          await api.createHealthMetric(weightMetric);
        }
      } catch (err) {
        console.log('Error syncing weight:', err);
      }
      
      Alert.alert('Success', 'Health data synced successfully!');
      setIsLoading(false);
    } catch (err) {
      console.error('Error syncing health data:', err);
      setError(err instanceof Error ? err.message : String(err));
      Alert.alert('Error', `Failed to sync health data: ${err}`);
      setIsLoading(false);
    }
  };

  return {
    isAvailable,
    hasPermissions,
    isLoading,
    error,
    steps,
    distance,
    flightsClimbed,
    activeEnergyBurned,
    heartRate,
    weight,
    bodyFat,
    syncWithHealthKit,
  };
};

export default useHealthKit; 