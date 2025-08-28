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
    console.log("🔑 CSRF token already exists:", decodedToken);
    return;
  }

  try {
    console.log("🔄 Generating new CSRF token...");
    // Make a GET request to generate CSRF token
    const response = await api.get("/api/auth/csrf-token");
    console.log("✅ CSRF token generated:", response.data);

    // Verify the token was set in cookies
    const newToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    if (newToken) {
      console.log(
        "🍪 CSRF token confirmed in cookies:",
        decodeURIComponent(newToken),
      );
    } else {
      console.warn("⚠️ CSRF token not found in cookies after generation");
    }
  } catch (error) {
    console.error("❌ Failed to generate CSRF token:", error);
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
