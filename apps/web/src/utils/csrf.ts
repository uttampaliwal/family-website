import api from "../services/axios";

// Function to ensure CSRF token is available before making protected requests
export const ensureCsrfToken = async (): Promise<void> => {
  // Check if CSRF token already exists in cookies
  const existingToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  // Decode the token if it exists (it might be URL-encoded)
  const decodedToken = existingToken ? decodeURIComponent(existingToken) : null;

  if (decodedToken && decodedToken.length > 0) {
    // CSRF token already exists, no need to generate
    return;
  }

  try {
    // Make a GET request to generate CSRF token
    await api.get("/api/auth/csrf-token");

    // Verify the token was set in cookies
    const newToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    if (!newToken) {
      console.warn("CSRF token not found in cookies after generation");
    }
  } catch (error) {
    console.error("Failed to generate CSRF token:", error);
    throw new Error("Failed to initialize CSRF protection");
  }
};

// Function to get CSRF token from cookies
export const getCsrfToken = (): string | null => {
  const token =
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1] || null;

  // Decode the token if it exists (it might be URL-encoded)
  return token ? decodeURIComponent(token) : null;
};
