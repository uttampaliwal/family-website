import { createBrowserRouter } from "react-router-dom";
import { GuestOnlyRoute, ProtectedRoute } from "../components/auth/route-guards.js";
import { AppShell } from "../components/layout/app-shell.js";
import { ForgotPasswordPage } from "../pages/auth/forgot-password.js";
import { LoginPage } from "../pages/auth/login.js";
import { RegisterPage } from "../pages/auth/register.js";
import { ResendVerificationPage } from "../pages/auth/resend-verification.js";
import { ResetPasswordPage } from "../pages/auth/reset-password.js";
import { VerifyEmailPage } from "../pages/auth/verify-email.js";
import { FamilyPage } from "../pages/family.js";
import { HealthPage } from "../pages/health.js";
import { HomePage } from "../pages/home.js";
import { PhotosPage } from "../pages/photos.js";
import { EventsPage } from "../pages/events.js";
import { AnnouncementsPage } from "../pages/announcements.js";
import { MemberProfilePage } from "../pages/members/member-profile.js";
import { MembersPage } from "../pages/members/members.js";
import { MyProfilePage } from "../pages/members/my-profile.js";
import { AdminApprovalsPage } from "../pages/admin/approvals.js";
import { NotFoundPage } from "../pages/not-found.js";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/health", element: <HealthPage /> },
      { path: "/login", element: <GuestOnlyRoute><LoginPage /></GuestOnlyRoute> },
      { path: "/register", element: <GuestOnlyRoute><RegisterPage /></GuestOnlyRoute> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/forgot-password", element: <GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/resend-verification", element: <GuestOnlyRoute><ResendVerificationPage /></GuestOnlyRoute> },
      { path: "/family", element: <ProtectedRoute><FamilyPage /></ProtectedRoute> },
      { path: "/photos", element: <ProtectedRoute><PhotosPage /></ProtectedRoute> },
      { path: "/events", element: <ProtectedRoute><EventsPage /></ProtectedRoute> },
      { path: "/announcements", element: <ProtectedRoute><AnnouncementsPage /></ProtectedRoute> },
      { path: "/members", element: <ProtectedRoute><MembersPage /></ProtectedRoute> },
      { path: "/members/:id", element: <ProtectedRoute><MemberProfilePage /></ProtectedRoute> },
      { path: "/me", element: <ProtectedRoute><MyProfilePage /></ProtectedRoute> },
      { path: "/admin/approvals", element: <ProtectedRoute><AdminApprovalsPage /></ProtectedRoute> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
