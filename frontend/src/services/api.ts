/**
 * API Service for Isidor Mobile App
 * 
 * This service handles communication with the Isidor backend API.
 * For development purposes, it includes basic error handling and
 * configuration for local development.
 */

import { API_BASE_URL } from '../config/environment';

/**
 * Basic fetch wrapper with error handling
 */
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * API endpoints
 */
export const api = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      return fetchWithErrorHandling(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
    },
    
    register: async (email: string, password: string) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
  },

  // User endpoints
  user: {
    getProfile: async (token: string) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  },

  // Health metrics endpoints
  healthMetrics: {
    getMetrics: async (token: string) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/health-metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  },
};

export default api; 