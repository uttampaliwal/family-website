import { useState, useEffect, Suspense, lazy } from "react";

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteFocusManager from "./components/RouteFocusManager";
import HamburgerMenu from "./components/HamburgerMenu";
import ThemeToggleButton from "./components/ThemeToggleButton";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary";
import ModernFooter from "./components/ModernFooter";

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
const HealthCheck = lazy(() => import("./pages/HealthCheck"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const DocumentEditPage = lazy(() => import("./pages/DocumentEditPage"));
const DocumentViewPage = lazy(() => import("./pages/DocumentViewPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FamilyTreePage = lazy(() => import("./pages/FamilyTreePage"));
const AuthSuccessPage = lazy(() => import("./pages/AuthSuccessPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));

import LiveDateTime from "./components/LiveDateTime";
import LoadingIndicator from "./components/LoadingIndicator";
import SocialSidebar from "./components/SocialSidebar";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [scrolled, setScrolled] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
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

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

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
      console.error("Error starting chat:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Router>
        <ToastProvider>
          <RouteFocusManager />
          <div className="bg-background text-text-base app-root">
            <header
              role="banner"
              className={`fixed top-0 left-0 w-full z-20 transition-all duration-300 ${scrolled ? "shadow-xl py-2" : "py-4"} navbar-glass`}
            >
              <div className="container mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Link to="/" className="flex items-center group">
                    <div className="relative">
                      {/* Glossy accent overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                      <img
                        src="/family-logo.svg"
                        className="h-20 object-contain transition-all duration-300 group-hover:scale-110 relative z-10"
                        alt="Family Website"
                      />
                      {/* Subtle color accent ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-secondary/30 group-hover:border-secondary/50 transition-all duration-300 scale-105"></div>
                    </div>
                    <div className="ml-4 hidden sm:block">
                      <span className="text-3xl font-extrabold tracking-wide">
                        Family <span className="text-secondary">Website</span>
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="flex items-center">
                  <div className="hidden md:flex items-center space-x-3">
                    <Link to="/" className="nav-link">
                      Home
                    </Link>

                    {isLoggedIn && (
                      <Link to="/documents" className="nav-link">
                        Documents
                      </Link>
                    )}

                    {isLoggedIn && (
                      <Link to="/family-tree" className="nav-link">
                        Family Tree
                      </Link>
                    )}

                    {isLoggedIn && user ? (
                      <Link
                        to={`/profile/${encodeURIComponent(user.username)}`}
                        className="nav-link"
                      >
                        {user.username}
                      </Link>
                    ) : (
                      <>
                        <Link to="/login" className="btn btn-primary">
                          Login
                        </Link>
                        <Link to="/register" className="btn btn-secondary">
                          Register
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="hidden lg:block mx-4">
                    <LiveDateTime />
                  </div>

                  <div className="ml-4">
                    <ThemeToggleButton />
                  </div>

                  <div className="md:hidden ml-4">
                    <HamburgerMenu
                      isLoggedIn={isLoggedIn}
                      username={user?.username || ""}
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main
              role="main"
              className="w-full pt-28 main-flex-auto"
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
                    <Route path="/healthz" element={<HealthCheck />} />
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
                    <Route
                      path="/admin/dashboard"
                      element={
                        <ProtectedRoute>
                          <AdminDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </EnhancedErrorBoundary>
            </main>

            {/* Footer */}
            <ModernFooter />

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
