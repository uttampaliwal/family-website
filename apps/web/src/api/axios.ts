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
    console.log("🔧 Axios request interceptor triggered");
    console.log("📍 URL:", config.url);
    console.log("🔄 Method:", config.method);

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log("🔑 Added Authorization header");
    }

    // IMPORTANT: Disable Axios's automatic CSRF handling
    // We need to manually handle it to ensure proper decoding
    if (
      config.method !== "get" &&
      config.method !== "head" &&
      config.method !== "options"
    ) {
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      console.log("🍪 Raw CSRF token from cookie:", csrfToken);

      if (csrfToken) {
        // Decode the token if it exists (it might be URL-encoded)
        const decodedCsrfToken = decodeURIComponent(csrfToken);
        console.log("🔓 Decoded CSRF token:", decodedCsrfToken);

        // Always set the decoded token manually
        config.headers["X-XSRF-TOKEN"] = decodedCsrfToken;
        console.log("✅ Manually added decoded CSRF token to headers");
      } else {
        console.log("⚠️ No CSRF token found in cookies");
      }
    }

    console.log("📋 Final headers:", config.headers);
    return config;
  },
  (error) => {
    console.error("❌ Axios request interceptor error:", error);
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
  (response) => {
    console.log("✅ Axios response interceptor - success");
    console.log("📊 Status:", response.status);
    console.log("📄 Data:", response.data);
    return response;
  },
  async (error) => {
    console.error("❌ Axios response interceptor - error");
    console.error("🔍 Error type:", typeof error);
    console.error("🏗️ Error constructor:", error?.constructor?.name);
    console.error("📝 Error message:", error?.message);
    console.error("🔢 Error code:", error?.code);

    if (error.response) {
      console.error("📊 Response error - Status:", error.response.status);
      console.error("📄 Response error - Data:", error.response.data);
    } else if (error.request) {
      console.error("🌐 Request error - No response received");
      console.error("📡 Request details:", error.request);
    } else {
      console.error("⚙️ Setup error:", error.message);
    }

    if (!error.response || !error.config) {
      console.error("🚫 Early return - no response or config");
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    // This logic should specifically check for a 401 Unauthorized for token expiry,
    // not a 403 Forbidden, which is now correctly used for CSRF errors.
    const isTokenExpired = error.response.status === 401;
    const isFirstRetry = !originalRequest._retry;

    if (isTokenExpired && isFirstRetry) {
      console.log("🔄 Attempting token refresh...");
      try {
        return await handleTokenRefresh(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    console.error("🔚 Rejecting error without retry");
    return Promise.reject(error);
  },
);

// Helper function to handle authentication failures
function handleAuthFailure() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch {
    // Continue execution as this is not critical
  }

  try {
    const isValidPath = LOGIN_PATH.startsWith("/") && !LOGIN_PATH.includes("<");
    const redirectPath = isValidPath ? LOGIN_PATH : ROOT_PATH;
    window.location.replace(redirectPath);
  } catch {
    // Fallback: try to redirect to root
    try {
      window.location.href = ROOT_PATH;
    } catch {
      // Last resort: reload the page
      window.location.reload();
    }
  }
}

export default api;
