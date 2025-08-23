import api from "../api/axios";

// Function to ensure CSRF token is available before making protected requests
export const ensureCsrfToken = async (): Promise<void> => {
  // Check if CSRF token already exists in cookies
  const existingToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  if (existingToken) {
    console.log("[CSRF] Token already exists");
    return;
  }

  try {
    // Make a GET request to generate CSRF token
    console.log("[CSRF] Fetching CSRF token...");
    await api.get("/api/auth/csrf-token");
    console.log("[CSRF] Token fetched successfully");
  } catch (error) {
    console.error("[CSRF] Failed to fetch token:", error);
    throw new Error("Failed to initialize CSRF protection");
  }
};

// Function to get CSRF token from cookies
export const getCsrfToken = (): string | null => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1] || null
  );
};
