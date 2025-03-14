import { Platform, NativeModules } from 'react-native';
import { MetricType } from './api';

// Import HealthKit correctly
const HealthKit = require('react-native-health');

// Check if the native module is available
const hasNativeModule = NativeModules.AppleHealthKit !== null && NativeModules.AppleHealthKit !== undefined;
console.log('Has AppleHealthKit native module:', hasNativeModule);

// Define the types of health data we want to access
export enum HealthDataType {
  STEPS = 'steps',
  DISTANCE = 'distance',
  FLIGHTS_CLIMBED = 'flightsClimbed',
  ACTIVE_ENERGY_BURNED = 'activeEnergyBurned',
  HEART_RATE = 'heartRate',
  SLEEP = 'sleep',
  WEIGHT = 'weight',
  BODY_FAT = 'bodyFat',
}

// Define the permissions we need
const permissions = {
  permissions: {
    read: [
      'Steps',
      'DistanceWalkingRunning',
      'FlightsClimbed',
      'ActiveEnergyBurned',
      'HeartRate',
      'SleepAnalysis',
      'Weight',
      'BodyFatPercentage',
    ],
    write: [],
  },
};

// Check if HealthKit is available (only on iOS)
export const isHealthKitAvailable = (): boolean => {
  return Platform.OS === 'ios' && hasNativeModule;
};

// Initialize HealthKit
export const initHealthKit = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      const reason = Platform.OS !== 'ios' 
        ? 'HealthKit is only available on iOS' 
        : 'HealthKit native module is not available';
      reject(reason);
      return;
    }

    // Log what we're working with
    console.log('HealthKit module:', HealthKit);
    console.log('AppleHealthKit native module:', NativeModules.AppleHealthKit);
    
    try {
      // Use the native module directly
      NativeModules.AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('Error initializing HealthKit:', error);
          reject(`Error initializing HealthKit: ${error}`);
          return;
        }
        resolve(true);
      });
    } catch (err) {
      console.error('Exception initializing HealthKit:', err);
      reject(`Exception initializing HealthKit: ${err}`);
    }
  });
};

// Get step count for a specific date
export const getStepCount = (date: string = new Date().toISOString()): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      reject('HealthKit is only available on iOS');
      return;
    }

    const options = {
      date,
    };

    NativeModules.AppleHealthKit.getStepCount(options, (error: string, results: any) => {
      if (error) {
        reject(`Error getting step count: ${error}`);
        return;
      }
      resolve(results.value);
    });
  });
};

// Get distance walking/running for a specific date
export const getDistanceWalkingRunning = (date: string = new Date().toISOString()): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      reject('HealthKit is only available on iOS');
      return;
    }

    const options = {
      date,
      unit: 'meter',
    };

    NativeModules.AppleHealthKit.getDistanceWalkingRunning(options, (error: string, results: any) => {
      if (error) {
        reject(`Error getting distance: ${error}`);
        return;
      }
      resolve(results.value);
    });
  });
};

// Get flights climbed for a specific date
export const getFlightsClimbed = (date: string = new Date().toISOString()): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      reject('HealthKit is only available on iOS');
      return;
    }

    const options = {
      date,
    };

    NativeModules.AppleHealthKit.getFlightsClimbed(options, (error: string, results: any) => {
      if (error) {
        reject(`Error getting flights climbed: ${error}`);
        return;
      }
      resolve(results.value);
    });
  });
};

// Get active energy burned for a specific date
export const getActiveEnergyBurned = (date: string = new Date().toISOString()): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      reject('HealthKit is only available on iOS');
      return;
    }

    const options = {
      date,
      unit: 'kilocalorie',
    };

    NativeModules.AppleHealthKit.getActiveEnergyBurned(options, (error: string, results: any) => {
      if (error) {
        reject(`Error getting active energy burned: ${error}`);
        return;
      }
      resolve(results.value);
    });
  });
};

// Get heart rate samples for a specific date range
export const getHeartRateSamples = (
  startDate: string = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  endDate: string = new Date().toISOString()
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      reject('HealthKit is only available on iOS');
      return;
    }

    const options = {
      startDate,
      endDate,
      limit: 100,
      ascending: false,
    };

    NativeModules.AppleHealthKit.getHeartRateSamples(options, (error: string, results: any[]) => {
      if (error) {
        reject(`Error getting heart rate samples: ${error}`);
        return;
      }
      resolve(results);
    });
  });
};

// Get sleep samples for a specific date range
export const getSleepSamples = (
  startDate: string = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  endDate: string = new Date().toISOString()
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      reject('HealthKit is only available on iOS');
      return;
    }

    const options = {
      startDate,
      endDate,
      limit: 100,
      ascending: false,
    };

    NativeModules.AppleHealthKit.getSleepSamples(options, (error: string, results: any[]) => {
      if (error) {
        reject(`Error getting sleep samples: ${error}`);
        return;
      }
      resolve(results);
    });
  });
};

// Get weight samples for a specific date range
export const getWeightSamples = (
  startDate: string = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
  endDate: string = new Date().toISOString()
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      reject('HealthKit is only available on iOS');
      return;
    }

    const options = {
      startDate,
      endDate,
      unit: 'pound',
      limit: 100,
      ascending: false,
    };

    NativeModules.AppleHealthKit.getWeightSamples(options, (error: string, results: any[]) => {
      if (error) {
        reject(`Error getting weight samples: ${error}`);
        return;
      }
      resolve(results);
    });
  });
};

// Get body fat percentage samples for a specific date range
export const getBodyFatPercentageSamples = (
  startDate: string = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
  endDate: string = new Date().toISOString()
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!isHealthKitAvailable()) {
      reject('HealthKit is only available on iOS');
      return;
    }

    const options = {
      startDate,
      endDate,
      limit: 100,
      ascending: false,
    };

    NativeModules.AppleHealthKit.getBodyFatPercentageSamples(options, (error: string, results: any[]) => {
      if (error) {
        reject(`Error getting body fat percentage samples: ${error}`);
        return;
      }
      resolve(results);
    });
  });
};

// Convert HealthKit data to our app's health metric format
export const convertToHealthMetric = (
  type: HealthDataType,
  value: any,
  date: string,
  userId: string
): {
  metric_type: MetricType;
  value: any;
  source: string;
  date: string;
  user_id: string;
} => {
  let metricType: MetricType;
  let formattedValue: any = value;

  switch (type) {
    case HealthDataType.STEPS:
      metricType = MetricType.ACTIVITY;
      formattedValue = { steps: value };
      break;
    case HealthDataType.DISTANCE:
      metricType = MetricType.ACTIVITY;
      formattedValue = { distance: value };
      break;
    case HealthDataType.FLIGHTS_CLIMBED:
      metricType = MetricType.ACTIVITY;
      formattedValue = { flights_climbed: value };
      break;
    case HealthDataType.ACTIVE_ENERGY_BURNED:
      metricType = MetricType.CALORIES;
      formattedValue = { active_calories: value };
      break;
    case HealthDataType.HEART_RATE:
      metricType = MetricType.HEART_RATE;
      formattedValue = { bpm: value };
      break;
    case HealthDataType.SLEEP:
      metricType = MetricType.SLEEP;
      formattedValue = value; // Sleep data is already structured
      break;
    case HealthDataType.WEIGHT:
      metricType = MetricType.WEIGHT;
      formattedValue = { weight: value };
      break;
    case HealthDataType.BODY_FAT:
      metricType = MetricType.WEIGHT;
      formattedValue = { body_fat_percentage: value };
      break;
    default:
      metricType = MetricType.EVENT;
      formattedValue = { value };
  }

  return {
    metric_type: metricType,
    value: formattedValue,
    source: 'Apple HealthKit',
    date: date.split('T')[0], // Format as YYYY-MM-DD
    user_id: userId,
  };
}; 