import axios from "axios";
import { logError } from "../utils/errorLogger";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  withCredentials: true, // Crucial for sending/receiving httpOnly cookies
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// Request interceptor to manually handle CSRF token for cross-origin setup
api.interceptors.request.use(
  (config) => {
    // For non-safe methods, we must manually attach the CSRF token.
    // Axios's automatic handling doesn't work across different ports (e.g., 5173 vs 3000).
    if (config.method && !["get", "head", "options"].includes(config.method)) {
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (csrfToken) {
        // The token from the cookie might be URL-encoded. Decoding it ensures it matches
        // what the backend's `csurf` middleware expects.
        config.headers["X-XSRF-TOKEN"] = decodeURIComponent(csrfToken);
      }
    }
    return config;
  },
  (error) => {
    logError(error, "axios_request_interceptor");
    return Promise.reject(error);
  },
);

// Simplified response interceptor for logging only.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorContext = {
      message: error?.message,
      code: error?.code,
      status: error.response?.status,
      hasResponse: !!error.response,
      hasRequest: !!error.request,
    };
    logError(error, "axios_response_interceptor", errorContext);
    return Promise.reject(error);
  },
);

export default api;
