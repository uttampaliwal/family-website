import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { toast } from "react-toastify";

// Create base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add CSRF token from cookies to headers if it exists
    if (
      config.method &&
      ["post", "put", "patch", "delete"].includes(config.method.toLowerCase())
    ) {
      // Get the CSRF token from cookies
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (csrfToken) {
        // Decode the token if it exists (it might be URL-encoded)
        const decodedCsrfToken = decodeURIComponent(csrfToken);

        // Only set manually if not already set by Axios
        if (
          !config.headers["X-XSRF-TOKEN"] &&
          !config.headers["x-xsrf-token"]
        ) {
          config.headers["X-XSRF-TOKEN"] = decodedCsrfToken;
        }
      }
    }

    return config;
  },
  (error) => {
    console.error("Axios request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;

      // Handle authentication errors
      if (status === 401) {
        // Redirect to login page if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      // Show error message if available
      const data = error.response.data as { message: string };
      if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error(`Error: ${status} - ${error.message}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("🌐 Network error - no response received");
      toast.error("Network error. Please check your connection.");
    } else {
      // Something else happened while setting up the request
      console.error("⚠️ Request setup error:", error.message);
      toast.error(`Request error: ${error.message}`);
    }

    return Promise.reject(error);
  },
);

export default api;
