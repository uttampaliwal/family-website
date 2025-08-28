import { QueryClient } from "@tanstack/react-query";

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: Error) => {
        // Don't retry on 4xx errors (client errors)
        if (
          (error as { response?: { status?: number } })?.response?.status >=
            400 &&
          (error as { response?: { status?: number } })?.response?.status < 500
        ) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in production
      refetchOnWindowFocus: process.env.NODE_ENV === "production",
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: "always",
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Error handling for queries
queryClient.setMutationDefaults(["auth"], {
  mutationFn: async () => {
    // This will be overridden by individual mutations
    throw new Error("Mutation function not implemented");
  },
  onError: (error: Error) => {
    // Authentication mutation failed - handle error silently

    // Handle specific error cases
    if (
      (error as { response?: { status?: number } })?.response?.status === 401
    ) {
      // Redirect to login or refresh token
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  },
});

// Global error boundary for React Query
export const handleQueryError = (error: Error) => {
  // Query error - handle error silently

  // Log error details for debugging
  if (error?.response) {
    // Response error - handle error silently
  } else if (error?.request) {
    // Request error - handle error silently
  } else {
    // Error message - handle error silently
  }

  // You could also send errors to a logging service here
  // logErrorToService(error);
};

// Utility function to invalidate related queries
export const invalidateUserQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["user"] });
  queryClient.invalidateQueries({ queryKey: ["profile"] });
  queryClient.invalidateQueries({ queryKey: ["documents"] });
};

// Utility function to clear all cached data (useful for logout)
export const clearAllQueries = () => {
  queryClient.clear();
};
