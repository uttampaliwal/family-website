import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { GuestOnlyRoute, ProtectedRoute } from "../components/auth/route-guards.js";
import { AppShell } from "../components/layout/app-shell.js";
import { Loader2 } from "lucide-react";

const ForgotPasswordPage = lazy(() =>
  import("../pages/auth/forgot-password.js").then((m) => ({ default: m.ForgotPasswordPage })),
);
const LoginPage = lazy(() =>
  import("../pages/auth/login.js").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("../pages/auth/register.js").then((m) => ({ default: m.RegisterPage })),
);
const ResendVerificationPage = lazy(() =>
  import("../pages/auth/resend-verification.js").then((m) => ({ default: m.ResendVerificationPage })),
);
const ResetPasswordPage = lazy(() =>
  import("../pages/auth/reset-password.js").then((m) => ({ default: m.ResetPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import("../pages/auth/verify-email.js").then((m) => ({ default: m.VerifyEmailPage })),
);
const FamilyPage = lazy(() =>
  import("../pages/family.js").then((m) => ({ default: m.FamilyPage })),
);
const HealthPage = lazy(() =>
  import("../pages/health.js").then((m) => ({ default: m.HealthPage })),
);
const HomePage = lazy(() =>
  import("../pages/home.js").then((m) => ({ default: m.HomePage })),
);
const PhotosPage = lazy(() =>
  import("../pages/photos.js").then((m) => ({ default: m.PhotosPage })),
);
const EventsPage = lazy(() =>
  import("../pages/events.js").then((m) => ({ default: m.EventsPage })),
);
const AnnouncementsPage = lazy(() =>
  import("../pages/announcements.js").then((m) => ({ default: m.AnnouncementsPage })),
);
const DocumentsPage = lazy(() =>
  import("../pages/documents.js").then((m) => ({ default: m.DocumentsPage })),
);
const MomentsPage = lazy(() =>
  import("../pages/moments.js").then((m) => ({ default: m.MomentsPage })),
);
const ChatPage = lazy(() =>
  import("../pages/chat.js").then((m) => ({ default: m.ChatPage })),
);
const MemberProfilePage = lazy(() =>
  import("../pages/members/member-profile.js").then((m) => ({ default: m.MemberProfilePage })),
);
const MembersPage = lazy(() =>
  import("../pages/members/members.js").then((m) => ({ default: m.MembersPage })),
);
const MyProfilePage = lazy(() =>
  import("../pages/members/my-profile.js").then((m) => ({ default: m.MyProfilePage })),
);
const AdminApprovalsPage = lazy(() =>
  import("../pages/admin/approvals.js").then((m) => ({ default: m.AdminApprovalsPage })),
);
const NotFoundPage = lazy(() =>
  import("../pages/not-found.js").then((m) => ({ default: m.NotFoundPage })),
);
const PrivacyPolicyPage = lazy(() =>
  import("../pages/legal/privacy-policy.js").then((m) => ({ default: m.PrivacyPolicyPage })),
);
const TermsPage = lazy(() =>
  import("../pages/legal/terms.js").then((m) => ({ default: m.TermsPage })),
);
const ContactPage = lazy(() =>
  import("../pages/legal/contact.js").then((m) => ({ default: m.ContactPage })),
);

function PageFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: "/",
        element: (
          <Suspense fallback={<PageFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "/health",
        element: (
          <Suspense fallback={<PageFallback />}>
            <HealthPage />
          </Suspense>
        ),
      },
      {
        path: "/privacy-policy",
        element: (
          <Suspense fallback={<PageFallback />}>
            <PrivacyPolicyPage />
          </Suspense>
        ),
      },
      {
        path: "/terms",
        element: (
          <Suspense fallback={<PageFallback />}>
            <TermsPage />
          </Suspense>
        ),
      },
      {
        path: "/contact",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ContactPage />
          </Suspense>
        ),
      },
      {
        path: "/login",
        element: (
          <Suspense fallback={<PageFallback />}>
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          </Suspense>
        ),
      },
      {
        path: "/register",
        element: (
          <Suspense fallback={<PageFallback />}>
            <GuestOnlyRoute>
              <RegisterPage />
            </GuestOnlyRoute>
          </Suspense>
        ),
      },
      {
        path: "/verify-email",
        element: (
          <Suspense fallback={<PageFallback />}>
            <VerifyEmailPage />
          </Suspense>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <Suspense fallback={<PageFallback />}>
            <GuestOnlyRoute>
              <ForgotPasswordPage />
            </GuestOnlyRoute>
          </Suspense>
        ),
      },
      {
        path: "/reset-password",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
      {
        path: "/resend-verification",
        element: (
          <Suspense fallback={<PageFallback />}>
            <GuestOnlyRoute>
              <ResendVerificationPage />
            </GuestOnlyRoute>
          </Suspense>
        ),
      },
      {
        path: "/family",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <FamilyPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/photos",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <PhotosPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/events",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/announcements",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <AnnouncementsPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/documents",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/moments",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <MomentsPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/chat",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/members",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/members/:id",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <MemberProfilePage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/me",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <MyProfilePage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/admin/approvals",
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProtectedRoute>
              <AdminApprovalsPage />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<PageFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);
