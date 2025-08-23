import axios, { type AxiosRequestConfig } from "axios";
import type { AuthResponse } from "../types/api";

interface RetryAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Constants for better maintainability

const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || "accessToken";
const USERNAME_KEY = import.meta.env.VITE_USERNAME_KEY || "username";
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || "/login";
const ROOT_PATH = "/";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Important for sending HttpOnly cookies
  xsrfCookieName: "XSRF-TOKEN", // The name of the cookie to use as a value for the XSRF token
  xsrfHeaderName: "X-XSRF-TOKEN", // The name of the HTTP header to send the XSRF token in
});

// Request interceptor to attach JWT access token and handle CSRF token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Manual CSRF token handling for better reliability
    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    if (csrfToken && config.method !== "get") {
      config.headers["X-XSRF-TOKEN"] = csrfToken;
      console.log(
        "[CSRF] Token attached to request:",
        csrfToken.substring(0, 10) + "...",
      );
    } else if (config.method !== "get") {
      console.warn("[CSRF] No CSRF token found in cookies for non-GET request");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Helper function to refresh access token
async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post<AuthResponse>(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token`,
      {},
      { withCredentials: true },
    );
    return response.data.accessToken || null;
  } catch (error) {
    console.error("Unable to refresh token:", error);
    handleAuthFailure();
    throw error;
  }
}

// Helper function to handle token refresh and retry
async function handleTokenRefresh(originalRequest: RetryAxiosRequestConfig) {
  originalRequest._retry = true;

  const newAccessToken = await refreshAccessToken();
  if (newAccessToken) {
    // Sanitize token to prevent XSS
    const sanitizedToken = String(newAccessToken).replace(/[<>"'&]/g, "");
    localStorage.setItem(ACCESS_TOKEN_KEY, sanitizedToken);
    if (!originalRequest.headers) {
      originalRequest.headers = {};
    }
    originalRequest.headers.Authorization = `Bearer ${sanitizedToken}`;
    return api(originalRequest);
  }
  throw new Error("Failed to refresh token");
}

// Response interceptor to handle token refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    // This logic should specifically check for a 401 Unauthorized for token expiry,
    // not a 403 Forbidden, which is now correctly used for CSRF errors.
    const isTokenExpired = error.response.status === 401;
    const isFirstRetry = !originalRequest._retry;

    if (isTokenExpired && isFirstRetry) {
      try {
        return await handleTokenRefresh(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Helper function to handle authentication failures
function handleAuthFailure() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
    // Continue execution as this is not critical
  }

  try {
    const isValidPath = LOGIN_PATH.startsWith("/") && !LOGIN_PATH.includes("<");
    const redirectPath = isValidPath ? LOGIN_PATH : ROOT_PATH;
    window.location.replace(redirectPath);
  } catch (error) {
    console.error("Failed to redirect:", error);
    // Fallback: try to redirect to root
    try {
      window.location.href = ROOT_PATH;
    } catch (fallbackError) {
      console.error("Failed to redirect to root:", fallbackError);
      // Last resort: reload the page
      window.location.reload();
    }
  }
}

export default api;
