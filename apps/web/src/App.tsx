import { useState, useEffect, Suspense, lazy } from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteFocusManager from "./components/RouteFocusManager";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary";
import ModernFooter from "./components/ModernFooter";
import Header from "./components/Header";
import MobileBottomNav from "./components/MobileBottomNav";
import logger from "./utils/logger";

import UserProfileSkeleton from "./components/UserProfileSkeleton";

import { ToastProvider } from "./context/ToastProvider";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const DocumentEditPage = lazy(() => import("./pages/DocumentEditPage"));
const DocumentViewPage = lazy(() => import("./pages/DocumentViewPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FamilyTreePage = lazy(() => import("./pages/FamilyTreePage"));
const AuthSuccessPage = lazy(() => import("./pages/AuthSuccessPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const FamilySocialPage = lazy(() => import("./pages/FamilySocialPage"));
const UltimateFamilySocialPage = lazy(
  () => import("./pages/UltimateFamilySocialPage"),
);

const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const SystemHealthPage = lazy(() => import("./pages/SystemHealthPage"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const DashboardHomePage = lazy(() => import("./pages/admin/DashboardHomePage"));
const UserManagementPage = lazy(
  () => import("./pages/admin/UserManagementPage"),
);
const ContentManagementPage = lazy(
  () => import("./pages/admin/ContentManagementPage"),
);
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const SystemSettingsPage = lazy(
  () => import("./pages/admin/SystemSettingsPage"),
);
const MonitoringDashboardPage = lazy(
  () => import("./pages/admin/MonitoringDashboardPage"),
);

import AdminProtectedRoute from "./components/AdminProtectedRoute";

import LoadingIndicator from "./components/LoadingIndicator";
import SocialSidebar from "./components/SocialSidebar";
import ChatWindow from "./components/ChatWindow";

function App() {
  const { isLoggedIn, logout } = useAuth();
  const [socialSidebarOpen, setSocialSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    let timeoutId: number;

    const events = [
      "load",
      "mousemove",
      "mousedown",
      "touchstart",
      "keydown",
      "scroll",
    ];

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(
        () => {
          logout();
        },
        15 * 60 * 1000,
      ); // 15 minutes
    };

    const handleOnline = () => {
      // You might want to refresh data or show a notification
    };

    const handleOffline = () => {
      logout();
    };

    events.forEach((event) => document.addEventListener(event, resetTimer));
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    resetTimer(); // Initial setup

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) =>
        document.removeEventListener(event, resetTimer),
      );
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isLoggedIn, logout]);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [activeChatName, setActiveChatName] = useState<string>("");

  const handleStartChat = async (friendId: string, friendName: string) => {
    try {
      // Create or get existing chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantIds: [friendId],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveChatId(data.chat._id);
        setActiveChatName(friendName);
        setChatOpen(true);
        setSocialSidebarOpen(false);
      }
    } catch (error) {
      logger.error("Error starting chat:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Router>
        <ToastProvider>
          <RouteFocusManager />
          <div className="bg-background text-text-base app-root">
            <a
              href="#main-content"
              className="fixed top-0 left-0 -translate-y-full focus:translate-y-0 z-[100] bg-primary text-white px-4 py-2 rounded-br-lg shadow-lg transition-transform duration-200 font-medium outline-none"
            >
              Skip to main content
            </a>
            <Header />

            {/* Main Content Area */}
            <main
              id="main-content"
              role="main"
              className="w-full pt-4 main-flex-auto"
              tabIndex={-1}
            >
              <EnhancedErrorBoundary>
                <Suspense fallback={<LoadingIndicator fullScreen />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route
                      path="/profile/:username"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<UserProfileSkeleton />}>
                            <UserProfilePage />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPasswordPage />}
                    />
                    <Route
                      path="/reset-password/:token"
                      element={<ResetPasswordPage />}
                    />
                    <Route
                      path="/reset-password"
                      element={<ResetPasswordPage />}
                    />
                    <Route
                      path="/change-password"
                      element={
                        <ProtectedRoute>
                          <ChangePasswordPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/documents"
                      element={
                        <ProtectedRoute>
                          <DocumentsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/family-tree"
                      element={
                        <ProtectedRoute>
                          <FamilyTreePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <ChatPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/social"
                      element={
                        <ProtectedRoute>
                          <FamilySocialPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/social-ultimate"
                      element={
                        <ProtectedRoute>
                          <UltimateFamilySocialPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/documents/new"
                      element={
                        <ProtectedRoute>
                          <DocumentEditPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/documents/edit/:id"
                      element={
                        <ProtectedRoute>
                          <DocumentEditPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/documents/:id"
                      element={
                        <ProtectedRoute>
                          <DocumentViewPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/privacy-policy"
                      element={<PrivacyPolicyPage />}
                    />
                    <Route
                      path="/terms-of-service"
                      element={<TermsOfServicePage />}
                    />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/auth/success" element={<AuthSuccessPage />} />
                    <Route path="/health" element={<SystemHealthPage />} />
                    <Route path="/sitemap" element={<SitemapPage />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout />
                        </AdminProtectedRoute>
                      }
                    >
                      <Route index element={<DashboardHomePage />} />
                      <Route
                        path="user-management"
                        element={<UserManagementPage />}
                      />
                      <Route
                        path="content-management"
                        element={<ContentManagementPage />}
                      />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route
                        path="system-settings"
                        element={<SystemSettingsPage />}
                      />
                      <Route
                        path="monitoring"
                        element={<MonitoringDashboardPage />}
                      />
                    </Route>
                  </Routes>
                </Suspense>
              </EnhancedErrorBoundary>
            </main>

            {/* Footer */}
            <ModernFooter />

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* Social Features - Only show when logged in */}
            {isLoggedIn && (
              <>
                <SocialSidebar
                  isOpen={socialSidebarOpen}
                  onClose={() => setSocialSidebarOpen(false)}
                  onStartChat={handleStartChat}
                />
                <ChatWindow
                  chatId={activeChatId}
                  friendName={activeChatName}
                  isOpen={chatOpen}
                  onClose={() => setChatOpen(false)}
                />

                {/* Floating Social Button */}
                <button
                  onClick={() => setSocialSidebarOpen(true)}
                  className="fixed bottom-4 left-4 w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors z-40 flex items-center justify-center"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </ToastProvider>
      </Router>
    </div>
  );
}

export default App;
