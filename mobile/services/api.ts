import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Define UUID type for use in interfaces
export type UUID = string;

// API base URL - replace with your actual API URL when deploying
// For iOS simulator, localhost works
// For physical devices, you need to use your computer's IP address or a public URL

// IMPORTANT: If you're testing on a physical device, replace this with your computer's actual IP address
// Example: const MANUAL_IP = '192.168.1.123';
const MANUAL_IP = '192.168.0.48'; // Set to null to use automatic detection, or set to your IP as a string

const getApiUrl = () => {
  // If manual IP is set, use it for all devices
  if (MANUAL_IP) {
    const url = `http://${MANUAL_IP}:8000`;
    console.log('Using manually configured API URL:', url);
    return url;
  }

  if (Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV && __DEV__) {
    // iOS simulator can use localhost
    return 'http://localhost:8000';
  } else if (Platform.OS === 'android' && __DEV__) {
    // Android emulator needs the special IP for localhost
    return 'http://10.0.2.2:8000';
  } else {
    // Physical devices need your computer's IP or a public URL
    // You should set MANUAL_IP above for physical devices
    console.warn('No manual IP set for physical device. API calls will likely fail.');
    return 'http://localhost:8000'; // This will likely fail on physical devices
  }
};

export const API_URL = getApiUrl();
console.log('Using API URL:', API_URL);

// Storage keys
const ACCESS_TOKEN_KEY = 'isidor_access_token';
const REFRESH_TOKEN_KEY = 'isidor_refresh_token';
const USER_ID_KEY = 'user_id';

// Export constants for use in other files
export { USER_ID_KEY };

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

// API error class
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  console.log(`Handling response with status: ${response.status}`);
  
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorData;
    
    try {
      const responseText = await response.text();
      console.log(`Error response body: ${responseText}`);
      
      try {
        errorData = JSON.parse(responseText);
        errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch (parseError) {
        // If we can't parse JSON, use the response text
        errorMessage = responseText || response.statusText || `Error ${response.status}`;
      }
    } catch (e) {
      // If we can't get the response text, use the status text
      errorMessage = response.statusText || `Error ${response.status}`;
    }
    
    console.error(`API Error (${response.status}): ${errorMessage}`);
    throw new ApiError(errorMessage, response.status);
  }
  
  try {
    const data = await response.json() as T;
    return data;
  } catch (error) {
    console.error('Error parsing response JSON:', error);
    throw new ApiError('Invalid response format', 500);
  }
}

// Helper function to check API connectivity
export async function checkApiConnectivity(): Promise<boolean> {
  try {
    console.log('Checking API connectivity to:', API_URL);
    
    // First try the health endpoint
    try {
      const response = await fetch(`${API_URL}/api/v1/health`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        console.log('API connectivity check successful via health endpoint');
        return true;
      }
      console.log('Health endpoint not available, status:', response.status);
    } catch (error) {
      console.log('Health endpoint not available, trying docs endpoint');
    }
    
    // If health endpoint fails, try the docs endpoint which should be available in FastAPI
    try {
      const docsResponse = await fetch(`${API_URL}/api/v1/docs`, { 
        method: 'GET',
      });
      
      if (docsResponse.ok) {
        console.log('API connectivity check successful via docs endpoint');
        return true;
      }
      console.log('Docs endpoint not available, status:', docsResponse.status);
    } catch (error) {
      console.log('Docs endpoint not available, trying root endpoint');
    }
    
    // Last resort, try the root endpoint
    try {
      const rootResponse = await fetch(`${API_URL}/`, { 
        method: 'GET',
      });
      
      if (rootResponse.ok) {
        console.log('API connectivity check successful via root endpoint');
        return true;
      }
      console.warn('API connectivity check failed with status:', rootResponse.status);
    } catch (error) {
      console.error('Root endpoint not available:', error);
    }
    
    console.error('All API connectivity checks failed');
    return false;
  } catch (error) {
    console.error('API connectivity check failed with error:', error);
    return false;
  }
}

// Authentication functions
export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  console.log('Attempting login for user:', credentials.username);
  
  try {
    // First check API connectivity
    const isConnected = await checkApiConnectivity();
    if (!isConnected) {
      console.error('Cannot connect to API. Please check your network and API URL configuration.');
      throw new ApiError('Cannot connect to API. Please check your network settings and make sure the backend server is running.', 0);
    }
    
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    console.log('Sending login request to:', `${API_URL}/api/v1/auth/login`);
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    console.log('Login response status:', response.status);
    const tokenData = await handleResponse<TokenResponse>(response);
    
    // Store tokens
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh_token);
    
    console.log('Login successful, tokens stored');
    return tokenData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function refreshToken(): Promise<TokenResponse | null> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!refreshToken) {
    console.log('No refresh token found');
    return null;
  }
  
  try {
    console.log('Attempting to refresh token');
    console.log(`Using refresh token: ${refreshToken.substring(0, 10)}...`);
    
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    console.log(`Refresh token response status: ${response.status}`);
    
    if (!response.ok) {
      console.log('Token refresh failed:', response.status);
      // Try to get response body for more details
      try {
        const errorText = await response.text();
        console.log('Refresh error response:', errorText);
      } catch (e) {
        console.log('Could not read error response');
      }
      
      // Clear invalid tokens
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    }
    
    const tokenData = await response.json() as TokenResponse;
    console.log('Token refresh response:', JSON.stringify({
      access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 10)}...` : 'missing',
      refresh_token: tokenData.refresh_token ? `${tokenData.refresh_token.substring(0, 10)}...` : 'missing',
      token_type: tokenData.token_type
    }));
    
    // Store new tokens
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh_token);
    
    console.log('Token refreshed successfully');
    return tokenData;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear invalid tokens
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    return null;
  }
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_ID_KEY);
}

export async function getCurrentUser(): Promise<User> {
  try {
    const user = await authenticatedRequest<User>('/api/v1/auth/me', 'GET');
    
    // Store user ID in AsyncStorage
    if (user && user.id) {
      await AsyncStorage.setItem(USER_ID_KEY, user.id);
      console.log('Stored user ID in AsyncStorage:', user.id);
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}

// Helper function for authenticated requests
export async function authenticatedRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  forceRefresh: boolean = false
): Promise<T> {
  let accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  
  // Force refresh token if requested
  if (forceRefresh) {
    console.log('Force refreshing token before request');
    const refreshResult = await refreshToken();
    if (!refreshResult) {
      console.log('Force refresh failed');
      throw new ApiError('Authentication failed', 401);
    }
    accessToken = refreshResult.access_token;
  }
  // If no token, try to refresh
  else if (!accessToken) {
    console.log('No access token, attempting refresh');
    const refreshResult = await refreshToken();
    if (!refreshResult) {
      console.log('No refresh token or refresh failed');
      throw new ApiError('Not authenticated', 401);
    }
    accessToken = refreshResult.access_token;
  }
  
  console.log(`Using access token: ${accessToken.substring(0, 10)}...`);
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`Making ${method} request to ${url}`);
    console.log('Request headers:', JSON.stringify(headers));
    
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status}`);
    
    // If unauthorized, try to refresh token and retry once
    if (response.status === 401) {
      console.log('Received 401, attempting to refresh token and retry');
      const refreshResult = await refreshToken();
      if (!refreshResult) {
        console.log('Token refresh failed');
        throw new ApiError('Authentication failed', 401);
      }
      
      // Update headers with new token
      const newToken = refreshResult.access_token;
      console.log(`Using new access token: ${newToken.substring(0, 10)}...`);
      headers.Authorization = `Bearer ${newToken}`;
      options.headers = headers;
      
      // Retry the request
      console.log(`Retrying ${method} request to ${url} with new token`);
      const retryResponse = await fetch(url, options);
      console.log(`Retry response status: ${retryResponse.status}`);
      
      // If still unauthorized after refresh, throw error
      if (retryResponse.status === 401) {
        console.log('Still unauthorized after token refresh');
        throw new ApiError('Authentication failed after token refresh', 401);
      }
      
      return handleResponse<T>(retryResponse);
    }
    
    // Handle 500 errors with more details
    if (response.status === 500) {
      console.log('Received 500 Internal Server Error');
      try {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new ApiError(`Server error: ${errorText}`, 500);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        throw new ApiError('Internal server error', 500);
      }
    }
    
    return handleResponse<T>(response);
  } catch (error) {
    console.error(`Error in ${method} request to ${endpoint}:`, error);
    throw error;
  }
}

// Health metrics API functions
export async function getHealthMetrics(startDate?: string, endDate?: string): Promise<any[]> {
  // Build the endpoint based on provided dates
  let endpoint = '/api/v1/health-metrics/user/me';
  
  // If both dates are provided, use them as start_date and end_date
  if (startDate && endDate) {
    endpoint = `/api/v1/health-metrics/user/me?start_date=${startDate}&end_date=${endDate}`;
  }
  // If only startDate is provided, use it for both start_date and end_date (single day)
  else if (startDate) {
    endpoint = `/api/v1/health-metrics/user/me?start_date=${startDate}&end_date=${startDate}`;
  }
  
  console.log(`Fetching health metrics with endpoint: ${endpoint}`);
  
  try {
    // Get the current user's ID first
    const user = await getCurrentUser();
    
    // Use the actual user ID instead of 'me'
    endpoint = endpoint.replace('/me', `/${user.id}`);
    console.log(`Updated endpoint with user ID: ${endpoint}`);
    
    return await authenticatedRequest<any[]>(endpoint);
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    return []; // Return empty array on error
  }
}

export enum MetricType {
  SLEEP = "sleep",
  ACTIVITY = "activity",
  HEART_RATE = "heart_rate",
  BLOOD_PRESSURE = "blood_pressure",
  WEIGHT = "weight",
  MOOD = "mood",
  CALORIES = "calories",
  EVENT = "event"
}

export interface HealthMetricInput {
  metric_type: MetricType;
  value: any;
  source: string;
  date: string;
  user_id: string;
}

export async function createHealthMetric(metricData: HealthMetricInput): Promise<any> {
  console.log('Creating health metric:', JSON.stringify(metricData, null, 2));
  return authenticatedRequest<any>('/api/v1/health-metrics/', 'POST', metricData);
}

// Protocol and UserProtocol interfaces
export interface Protocol {
  id: UUID;
  name: string;
  description?: string;
  target_metrics: string[];
  duration_type: string;
  duration_days?: number;
  steps?: string[];
  recommendations?: string[];
  expected_outcomes?: string[];
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProtocol {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
  template_id?: string;
  target_metrics: string[];
  custom_fields: Record<string, any>;
  steps: string[];
  recommendations: string[];
  expected_outcomes: string[];
  category?: string;
  created_at: string;
  updated_at: string;
  protocol?: Protocol;
}

export interface UserProtocolWithProtocol extends UserProtocol {
  protocol: Protocol;
}

export interface UserProtocolCreate {
  protocol_id: string;
  start_date?: string;
}

export interface UserProtocolProgress {
  user_protocol_id: string;
  protocol_id: string;
  protocol_name: string;
  status: string;
  start_date: string;
  end_date?: string;
  days_elapsed: number;
  days_remaining?: number;
  completion_percentage?: number;
  duration_type: string;
  duration_days?: number;
  target_metrics: string[];
}

export interface UserProtocolStatusUpdate {
  status: string;
}

// Protocol API functions
export async function getProtocols(): Promise<Protocol[]> {
  console.log('Fetching available protocols');
  try {
    // Force refresh token before making the request
    const protocols = await authenticatedRequest<Protocol[]>(
      '/api/v1/protocols?skip=0&limit=100',
      'GET',
      undefined,
      true // Force refresh token
    );
    
    // Check if protocols is null or undefined
    if (!protocols) {
      console.log('Received null or undefined protocols');
      return [];
    }
    
    // Check if protocols is an array
    if (!Array.isArray(protocols)) {
      console.log('Received non-array protocols:', typeof protocols);
      return [];
    }
    
    console.log(`Received ${protocols.length} available protocols`);
    return protocols;
  } catch (error) {
    console.error('Error fetching available protocols:', error);
    // Check if it's an authentication error
    if (error instanceof ApiError && error.status === 401) {
      console.log('Authentication error when fetching protocols');
    }
    return [];
  }
}

export async function getUserProtocols(status?: string): Promise<UserProtocolWithProtocol[]> {
  console.log('Fetching user protocols', status ? `with status: ${status}` : '');
  try {
    const endpoint = status 
      ? `/api/v1/user-protocols?skip=0&limit=100&status=${status}`
      : '/api/v1/user-protocols?skip=0&limit=100';
      
    const protocols = await authenticatedRequest<UserProtocolWithProtocol[]>(
      endpoint,
      'GET',
      undefined,
      true // Force refresh token
    );
    
    // Check if protocols is null or undefined
    if (!protocols) {
      console.log('Received null or undefined user protocols');
      return [];
    }
    
    // Check if protocols is an array
    if (!Array.isArray(protocols)) {
      console.log('Received non-array user protocols:', typeof protocols);
      return [];
    }
    
    console.log(`Received ${protocols.length} user protocols`);
    return protocols;
  } catch (error) {
    console.error('Error fetching user protocols:', error);
    return [];
  }
}

export async function getActiveProtocols(): Promise<UserProtocolWithProtocol[]> {
  try {
    console.log('Fetching active protocols');
    const protocols = await authenticatedRequest<UserProtocolWithProtocol[]>(
      '/api/v1/user-protocols/active?skip=0&limit=100',
      'GET',
      undefined,
      true // Force refresh token
    );
    
    // Check if protocols is null or undefined
    if (!protocols) {
      console.log('Received null or undefined active protocols');
      return [];
    }
    
    // Check if protocols is an array
    if (!Array.isArray(protocols)) {
      console.log('Received non-array active protocols:', typeof protocols);
      return [];
    }
    
    console.log(`Received ${protocols.length} active protocols`);
    return protocols;
  } catch (error) {
    console.error('Error fetching active protocols:', error);
    return [];
  }
}

export async function enrollInProtocol(protocolId: string): Promise<UserProtocol> {
  console.log(`Enrolling in protocol: ${protocolId}`);
  
  try {
    // First, get the protocol details
    const protocol = await getProtocolDetails(protocolId);
    console.log('Got protocol details:', JSON.stringify(protocol));
    
    if (!protocol) {
      throw new Error('Protocol not found');
    }
    
    // Create the enrollment data using the protocol details
    const enrollmentData = {
      name: protocol.name,
      description: protocol.description || '',
      duration_days: protocol.duration_days || 30, // Default to 30 days if not specified
      target_metrics: protocol.target_metrics || [],
      steps: protocol.steps || [],
      recommendations: protocol.recommendations || [],
      expected_outcomes: protocol.expected_outcomes || [],
      category: protocol.category,
      start_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      template_id: protocolId // Use the protocol ID as the template ID
    };
    
    console.log('Enrollment data:', JSON.stringify(enrollmentData));
    
    // Use the create-and-enroll endpoint
    return authenticatedRequest<UserProtocol>('/api/v1/user-protocols/create-and-enroll', 'POST', enrollmentData);
  } catch (error) {
    console.error('Error in enrollInProtocol:', error);
    throw error;
  }
}

export async function getProtocolDetails(protocolId: string): Promise<Protocol> {
  console.log(`Fetching details for protocol: ${protocolId}`);
  return authenticatedRequest<Protocol>(`/api/v1/protocols/${protocolId}`);
}

export async function getUserProtocolDetails(userProtocolId: string): Promise<UserProtocolWithProtocol> {
  console.log(`Fetching details for user protocol: ${userProtocolId}`);
  try {
    const endpoint = `/api/v1/user-protocols/${userProtocolId}`;
    console.log(`Making request to: ${endpoint}`);
    const result = await authenticatedRequest<UserProtocolWithProtocol>(endpoint);
    console.log(`Received user protocol details:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error fetching user protocol details:`, error);
    throw error;
  }
}

export async function getUserProtocolProgress(userProtocolId: string): Promise<UserProtocolProgress> {
  console.log(`Fetching progress for user protocol: ${userProtocolId}`);
  return authenticatedRequest<UserProtocolProgress>(`/api/v1/user-protocols/${userProtocolId}/progress`);
}

export async function getProtocolEffectiveness(userProtocolId: string): Promise<any> {
  console.log(`Fetching effectiveness for user protocol: ${userProtocolId}`);
  return authenticatedRequest<any>(`/api/v1/user-protocols/${userProtocolId}/effectiveness`);
}

export interface TrendAnalysisRequest {
  metric_type: string;
  time_period: string;
  use_cache?: boolean;
}

export interface HealthInsightRequest {
  query: string;
  metric_types?: string[];
  update_memory?: boolean;
  time_frame?: string;
}

export async function getHealthInsight(query: string, metric_types?: string[], time_frame: string = "last_day", update_memory: boolean = true): Promise<any> {
  console.log(`Fetching health insight for query: "${query}", metrics: ${metric_types?.join(', ') || 'all'}, time_frame: ${time_frame}`);
  const userId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!userId) {
    console.error('User ID not found in AsyncStorage. Make sure you are logged in and have completed the authentication flow.');
    throw new Error('User ID not found. Please log out and log in again to fix this issue.');
  }
  
  const requestData: HealthInsightRequest = {
    query,
    metric_types,
    update_memory,
    time_frame
  };
  
  return authenticatedRequest<any>(`/api/v1/ai/insights/${userId}`, 'POST', requestData);
}

export async function getTrendAnalysis(metric_type: string, time_period: string = "last_week", use_cache: boolean = true): Promise<any> {
  console.log(`Fetching trend analysis for metric: ${metric_type}, time period: ${time_period}, use_cache: ${use_cache}`);
  const userId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!userId) {
    console.error('User ID not found in AsyncStorage. Make sure you are logged in and have completed the authentication flow.');
    throw new Error('User ID not found. Please log out and log in again to fix this issue.');
  }
  
  // Map UI time periods to API time periods
  let apiTimePeriod = time_period;
  if (time_period === 'last_day') {
    apiTimePeriod = 'last_day';
  } else if (time_period === 'last_week') {
    apiTimePeriod = 'last_week';
  }
  
  const requestData: TrendAnalysisRequest = {
    metric_type,
    time_period: apiTimePeriod,
    use_cache
  };
  
  return authenticatedRequest<any>(`/api/v1/ai/trends/${userId}`, 'POST', requestData);
}

// Function to check if the 'me' endpoint works, which indicates if the API is properly configured
export async function checkApiHealth(): Promise<boolean> {
  try {
    // Try to access a simple endpoint that should always work if the API is running
    // The docs are at /api/v1/docs, not /docs
    const response = await fetch(`${API_URL}/api/v1/docs`, { 
      method: 'GET',
    });
    
    if (response.ok) {
      console.log('API health check successful via docs endpoint');
      return true;
    }
    
    // If docs endpoint fails, try the root endpoint as fallback
    console.log('Docs endpoint not available, trying root endpoint');
    const rootResponse = await fetch(`${API_URL}/`, { 
      method: 'GET',
    });
    
    if (rootResponse.ok) {
      console.log('API health check successful via root endpoint');
      return true;
    }
    
    console.warn('API health check failed: API is not responding');
    return false;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

export async function updateUserProtocolStatus(userProtocolId: string, status: string): Promise<UserProtocol> {
  console.log(`Updating status for user protocol: ${userProtocolId} to ${status}`);
  const statusUpdate: UserProtocolStatusUpdate = {
    status
  };
  return authenticatedRequest<UserProtocol>(
    `/api/v1/user-protocols/${userProtocolId}/status`,
    'PUT',
    statusUpdate
  );
}

export interface ProtocolCreate {
  name: string;
  description: string;
  duration_days: number;
  target_metrics: string[];
  steps?: string[];
  recommendations?: string[];
  expected_outcomes?: string[];
  category?: string;
}

export interface ProtocolCreateAndEnroll {
  name: string;
  description: string;
  duration_days: number;
  target_metrics: string[];
  steps?: string[];
  recommendations?: string[];
  expected_outcomes?: string[];
  category?: string;
  start_date?: string;
  template_id?: string;
}

export async function createProtocol(protocol: ProtocolCreate): Promise<Protocol> {
  console.log('Creating custom protocol:', JSON.stringify(protocol, null, 2));
  return authenticatedRequest<Protocol>('/api/v1/protocols', 'POST', protocol);
}

export async function createAndEnrollProtocol(protocol: ProtocolCreateAndEnroll): Promise<UserProtocolWithProtocol> {
  console.log('Creating and enrolling in protocol:', JSON.stringify(protocol, null, 2));
  return authenticatedRequest<UserProtocolWithProtocol>('/api/v1/user-protocols/create-and-enroll', 'POST', protocol);
} 