import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { ApiError } from '@novabuilder/shared';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get the store state
    const state = useAuthStore.getState();
    const token = state.accessToken;

    // Only add token if the store has hydrated and user is authenticated
    // This allows login/register requests to work without a token
    if (state._hasHydrated && state.isAuthenticated && token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!token && state._hasHydrated) {
      // Only warn if store has hydrated but no token (user logged out or not logged in)
      console.warn('Request missing token:', {
        url: config.url,
        isAuthenticated: state.isAuthenticated,
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh', {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken, user } = response.data;
          useAuthStore.getState().login(user, accessToken, newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
