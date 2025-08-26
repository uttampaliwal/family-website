import { useState, useEffect, Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteFocusManager from "./components/RouteFocusManager";
import HamburgerMenu from "./components/HamburgerMenu";
import ThemeToggleButton from "./components/ThemeToggleButton";

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

import LiveDateTime from "./components/LiveDateTime";
import LoadingIndicator from "./components/LoadingIndicator";

function App() {
  const [scrolled, setScrolled] = useState(false);
  const { isLoggedIn, user } = useAuth();

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
              <ErrorBoundary
                fallback={
                  <div className="text-center p-8 text-error">
                    <h2 className="text-xl font-semibold mb-2">
                      Something went wrong
                    </h2>
                    <p className="mb-4">
                      We're sorry, but there was an error loading this page.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="btn btn-primary"
                    >
                      Reload Page
                    </button>
                  </div>
                }
                onError={(error) => {
                  const sanitizedError = {
                    message:
                      error?.message?.replace(/[<>'"&\n\r\t]/g, "") ||
                      "Unknown error",
                    timestamp: new Date().toISOString(),
                  };
                  console.error(
                    "ErrorBoundary caught an error:",
                    sanitizedError,
                  );
                }}
              >
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
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>

            {/* Footer */}
            <footer
              role="contentinfo"
              className="w-full bg-surface text-text-muted border-t border-primary/20 mt-12"
            >
              <div className="container mx-auto px-4 py-8">
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
                  {/* Family Info */}
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold text-base mb-3">
                      Family Portal
                    </h3>
                    <p className="text-sm text-muted mb-3">
                      Connecting families through technology, sharing memories,
                      and staying organized together.
                    </p>
                    <div className="flex justify-center md:justify-start space-x-3">
                      <span className="text-2xl">👨‍👩‍👧‍👦</span>
                      <span className="text-2xl">💝</span>
                      <span className="text-2xl">📱</span>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold text-base mb-3">
                      Quick Links
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link
                          to="/"
                          className="hover:text-primary transition-colors"
                        >
                          Home
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/documents"
                          className="hover:text-primary transition-colors"
                        >
                          Documents
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/family-tree"
                          className="hover:text-primary transition-colors"
                        >
                          Family Tree
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/contact"
                          className="hover:text-primary transition-colors"
                        >
                          Contact Us
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Support */}
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold text-base mb-3">
                      Support
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link
                          to="/help"
                          className="hover:text-primary transition-colors"
                        >
                          Help Center
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/faq"
                          className="hover:text-primary transition-colors"
                        >
                          FAQ
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/troubleshooting"
                          className="hover:text-primary transition-colors"
                        >
                          Troubleshooting
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/feedback"
                          className="hover:text-primary transition-colors"
                        >
                          Send Feedback
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Legal */}
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold text-base mb-3">
                      Legal
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link
                          to="/privacy-policy"
                          className="hover:text-primary transition-colors"
                        >
                          Privacy Policy
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/terms-of-service"
                          className="hover:text-primary transition-colors"
                        >
                          Terms of Service
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/cookie-policy"
                          className="hover:text-primary transition-colors"
                        >
                          Cookie Policy
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/data-protection"
                          className="hover:text-primary transition-colors"
                        >
                          Data Protection
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-primary/10 pt-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-muted">
                      &copy; {new Date().getFullYear()} Family Portal. All
                      rights reserved.
                    </p>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                      <span className="text-sm text-muted">
                        Made with ❤️ for families
                      </span>
                      <div className="flex space-x-2">
                        <span className="text-xs text-muted">v1.0.0</span>
                        <span className="text-xs text-muted">•</span>
                        <span className="text-xs text-muted">
                          Last updated: {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </Router>
    </div>
  );
}

export default App;
