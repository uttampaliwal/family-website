import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, documentsApi } from "../api/index";
import { invalidateUserQueries, clearAllQueries } from "../lib/queryClient";
import { useToast } from "./useToast";

// Authentication hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Cache user data
      queryClient.setQueryData(["user"], data.user);
      showToast("Welcome back!", "success");
      invalidateUserQueries();
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Login failed";
      showToast(message, "error");
    },
  });
};

export const useRegister = () => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      showToast(
        "Registration successful! Please check your email to verify your account.",
        "success",
      );
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Registration failed";
      showToast(message, "error");
    },
  });
};

export const useLogout = () => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAllQueries();
      showToast("Logged out successfully", "success");
    },
    onError: () => {
      // Even if logout fails on server, clear local data
      clearAllQueries();
      showToast("Logged out", "success");
    },
  });
};

export const useForgotPassword = () => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      showToast(
        "Password reset email sent! Please check your inbox.",
        "success",
      );
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to send reset email";
      showToast(message, "error");
    },
  });
};

export const useResetPassword = () => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      showToast(
        "Password reset successful! You can now log in with your new password.",
        "success",
      );
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Password reset failed";
      showToast(message, "error");
    },
  });
};

// User profile hooks
export const useUserProfile = (username?: string) => {
  return useQuery({
    queryKey: ["profile", username],
    queryFn: () => authApi.getUserProfile(username!),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data, variables) => {
      // Update cached profile data
      queryClient.setQueryData(["profile", variables.username], data);
      queryClient.setQueryData(["user"], data);
      showToast("Profile updated successfully!", "success");
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update profile";
      showToast(message, "error");
    },
  });
};

// Document hooks
export const useDocuments = () => {
  return useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.getDocuments,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsApi.getDocument(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: documentsApi.createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showToast("Document created successfully!", "success");
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to create document";
      showToast(message, "error");
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: documentsApi.updateDocument,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["document", variables.id], data);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showToast("Document updated successfully!", "success");
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update document";
      showToast(message, "error");
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      showToast("Document deleted successfully!", "success");
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete document";
      showToast(message, "error");
    },
  });
};

// Health check hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await fetch("/api/health-check");
      if (!response.ok) {
        throw new Error("Health check failed");
      }
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: false, // Don't retry health checks
  });
};
