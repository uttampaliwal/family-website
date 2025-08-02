import axios from 'axios';
import type { AuthResponse } from '../types/api';

// Constants for better maintainability
const TOKEN_EXPIRED_STATUS = 403;
const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || 'accessToken';
const USERNAME_KEY = import.meta.env.VITE_USERNAME_KEY || 'username';
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || '/login';
const ROOT_PATH = '/';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Important for sending HttpOnly cookies
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refreshing
api.interceptors.response.use(
  // Success handler - simply return the response
  (response) => response,
  
  // Error handler with token refresh logic
  async (error) => {
    // Early return if there's no error response or config
    if (!error.response || !error.config) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    const isTokenExpired = error.response.status === TOKEN_EXPIRED_STATUS;
    const isFirstRetry = !originalRequest._retry;
    
    // Only attempt token refresh on 403 errors (token expired) and for first retry
    if (isTokenExpired && isFirstRetry) {
      originalRequest._retry = true;
      
      try {
        // Request a new access token using the refresh token
        const response = await axios.post<AuthResponse>(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token`, 
          {}, 
          { withCredentials: true }
        );

        // Store the new token if available
        const newAccessToken = response.data.accessToken;
        if (newAccessToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
          
          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest); // Retry the original request
        }
      } catch (refreshError) {
        console.error('Unable to refresh token:', refreshError);
        handleAuthFailure();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle authentication failures
function handleAuthFailure() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  
  const isValidPath = LOGIN_PATH.startsWith('/') && !LOGIN_PATH.includes('<');
  const redirectPath = isValidPath ? LOGIN_PATH : ROOT_PATH;
  window.location.replace(redirectPath);
}

export default api;