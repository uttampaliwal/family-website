export const apiEndpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    verifyEmail: "/auth/verify-email",
    resendVerification: "/auth/resend-verification",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    changePassword: "/auth/change-password",
  },
  health: "/health-check",
} as const;

export const themeIds = ["warm", "minimal", "playful"] as const;
export type ThemeId = (typeof themeIds)[number];
export type ColorMode = "light" | "dark";
