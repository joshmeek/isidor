/**
 * Environment Configuration
 * 
 * This file contains environment-specific configuration values.
 * For local development on a physical device, change API_HOST to your computer's local IP address.
 */

// For testing on a physical device, change this to your computer's local IP address
// For example: '192.168.1.100:8000'
export const API_HOST = 'localhost:8000';

// API base URL
export const API_BASE_URL = `http://${API_HOST}/api/v1`;

// App configuration
export const APP_CONFIG = {
  // App version
  version: '0.1.0',
  
  // Feature flags
  features: {
    enableHealthKit: false,
    enableNotifications: false,
  },
};

export default {
  API_HOST,
  API_BASE_URL,
  APP_CONFIG,
}; 