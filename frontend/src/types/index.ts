/**
 * Type definitions for Isidor Mobile App
 */

// User types
export interface User {
  id: string;
  email: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  aiInteractionFrequency?: 'minimal' | 'moderate' | 'proactive';
  notificationPreferences?: NotificationPreferences;
  displayPreferences?: DisplayPreferences;
}

export interface NotificationPreferences {
  enablePushNotifications?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface DisplayPreferences {
  units?: 'metric' | 'imperial';
  darkMode?: boolean;
}

// Auth types
export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

// Health metric types
export interface HealthMetric {
  id: string;
  user_id: string;
  date: string;
  metric_type: string;
  value: any;
  source: string;
}

export interface SleepData {
  duration: number;
  quality: number;
  deep_sleep?: number;
  rem_sleep?: number;
  light_sleep?: number;
  awake?: number;
}

export interface ActivityData {
  steps: number;
  active_calories?: number;
  total_calories?: number;
  distance?: number;
  floors?: number;
}

export interface HeartData {
  resting_heart_rate?: number;
  heart_rate_variability?: number;
  average_heart_rate?: number;
}

// Protocol types
export interface Protocol {
  id: string;
  name: string;
  description: string;
  target_metrics: string[];
  duration_type: 'fixed' | 'ongoing';
  duration_days?: number;
}

export interface UserProtocol {
  id: string;
  user_id: string;
  protocol_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
} 