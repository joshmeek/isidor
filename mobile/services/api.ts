import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // If we can't parse JSON, use the status text
      errorMessage = response.statusText || `Error ${response.status}`;
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  return response.json() as Promise<T>;
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
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      console.log('Token refresh failed:', response.status);
      // Clear invalid tokens
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    }
    
    const tokenData = await response.json() as TokenResponse;
    
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
}

export async function getCurrentUser(): Promise<User> {
  try {
    return await authenticatedRequest<User>('/api/v1/auth/me', 'GET');
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}

// Helper function for authenticated requests
export async function authenticatedRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<T> {
  let accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  
  // If no token, try to refresh
  if (!accessToken) {
    console.log('No access token, attempting refresh');
    const refreshResult = await refreshToken();
    if (!refreshResult) {
      console.log('No refresh token or refresh failed');
      throw new ApiError('Not authenticated', 401);
    }
    accessToken = refreshResult.access_token;
  }
  
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
    console.log(`Making ${method} request to ${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
      console.log('Received 401, attempting token refresh');
      const refreshResult = await refreshToken();
      if (!refreshResult) {
        console.log('Token refresh failed');
        throw new ApiError('Authentication failed', 401);
      }
      
      // Retry with new token
      console.log('Retrying request with new token');
      headers.Authorization = `Bearer ${refreshResult.access_token}`;
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          'Authorization': `Bearer ${refreshResult.access_token}`
        }
      });
      
      return handleResponse<T>(retryResponse);
    }
    
    return handleResponse<T>(response);
  } catch (error) {
    console.error(`Request to ${endpoint} failed:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Request failed: ${error}`, 500);
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

export async function createHealthMetric(metricData: any): Promise<any> {
  return authenticatedRequest<any>('/api/v1/health-metrics/', 'POST', metricData);
}

// Protocol API functions
export async function getProtocols(): Promise<any[]> {
  return authenticatedRequest<any[]>('/api/v1/protocols/');
}

export async function getUserProtocols(): Promise<any[]> {
  return authenticatedRequest<any[]>('/api/v1/user-protocols/');
}

export async function getActiveProtocols(): Promise<any[]> {
  try {
    console.log('Fetching active protocols');
    const protocols = await authenticatedRequest<any[]>('/api/v1/user-protocols/active');
    console.log(`Received ${protocols?.length || 0} active protocols`);
    return protocols || [];
  } catch (error) {
    console.error('Error fetching active protocols:', error);
    return []; // Return empty array on error
  }
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