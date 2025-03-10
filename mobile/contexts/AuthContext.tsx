import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../services/api';

// Types
interface AuthContextType {
  user: api.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  error: null,
  clearError: () => {},
});

// Access token storage key
const ACCESS_TOKEN_KEY = 'isidor_access_token';
const REFRESH_TOKEN_KEY = 'isidor_refresh_token';

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<api.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Clear error function
  const clearError = useCallback(() => setError(null), []);

  // Helper to clear tokens
  const clearTokens = useCallback(async () => {
    console.log('Clearing auth tokens');
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('Checking auth status...');
      setIsLoading(true);
      
      try {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        
        if (token) {
          console.log('Found access token, verifying...');
          // Token exists, try to get user data
          try {
            const userData = await api.getCurrentUser();
            setUser(userData);
            console.log('User authenticated:', userData.email);
          } catch (err) {
            console.log('Token exists but invalid, trying refresh...');
            // Try to refresh the token
            const refreshResult = await api.refreshToken();
            if (refreshResult) {
              // Refresh successful, try to get user data again
              try {
                const userData = await api.getCurrentUser();
                setUser(userData);
                console.log('User authenticated after refresh:', userData.email);
              } catch (refreshErr) {
                console.error('Auth failed after token refresh:', refreshErr);
                await clearTokens();
              }
            } else {
              console.log('Refresh token invalid or expired');
              await clearTokens();
            }
          }
        } else {
          console.log('No token found, user not authenticated');
          await clearTokens(); // Ensure user is null
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // Clear any invalid tokens
        await clearTokens();
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
        console.log('Auth check complete, isAuthenticated:', !!user);
      }
    };

    checkAuthStatus();
  }, [clearTokens]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.login({ username: email, password });
      const userData = await api.getCurrentUser();
      setUser(userData);
      console.log('Login successful:', userData.email);
    } catch (err) {
      if (err instanceof api.ApiError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await api.logout();
      await clearTokens();
      console.log('Logout successful');
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear tokens even if API call fails
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, [clearTokens]);

  // Context value
  const value = {
    user,
    isLoading: isLoading || !authChecked,
    isAuthenticated: !!user,
    login,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 