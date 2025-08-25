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
const HealthCheck = lazy(() => import("./pages/HealthCheck"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const DocumentEditPage = lazy(() => import("./pages/DocumentEditPage"));
const DocumentViewPage = lazy(() => import("./pages/DocumentViewPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));

import LiveDateTime from "./components/LiveDateTime";

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
          <div
            className="bg-background text-text-base"
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            <header
              role="banner"
              className={`fixed top-0 left-0 w-full z-20 transition-all duration-300 ${scrolled ? "shadow-xl py-2" : "py-4"} navbar-glass`}
            >
              <div className="container mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Link to="/" className="flex items-center group">
                    <div className="relative">
                      <img
                        src="/family-logo.svg"
                        className="h-20 object-contain transition-all duration-300 group-hover:scale-110"
                        alt="Family Website"
                      />
                    </div>
                    <div className="ml-3 hidden sm:block">
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
              className="w-full pt-28"
              style={{ flex: "1 0 auto" }}
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
                <Suspense
                  fallback={
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-primary mb-4"></div>
                        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  }
                >
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
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>

            {/* Footer */}
            <footer
              role="contentinfo"
              className="w-full bg-surface text-text-muted text-center py-6 border-t border-primary/20 mt-12"
            >
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p>
                    &copy; {new Date().getFullYear()} Family Portal. All rights
                    reserved.
                  </p>
                  <div className="flex space-x-4 mt-4 md:mt-0">
                    <Link
                      to="/privacy-policy"
                      className="hover:text-primary transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Terms of Service
                    </a>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Contact
                    </a>
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
