import axios from 'axios';
import type { AuthResponse } from '../types/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Important for sending HttpOnly cookies
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken'); // Assuming you store accessToken in localStorage
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If the error is 403 (Forbidden) and it's not a retry yet
    if (error.response.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Request a new access token using the refresh token (sent via HttpOnly cookie)
        const response = await axios.post<AuthResponse>(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token`, {}, {
          withCredentials: true,
        });

        const newAccessToken = response.data.accessToken;
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
        }

        // Retry the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Unable to refresh token:', refreshError);
        // If refresh fails, log out the user
        // This part needs to be handled by the AuthContext or a global state manager
        // For now, we'll just clear the token and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login'; // Redirect to login page
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;