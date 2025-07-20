import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import RouteFocusManager from './components/RouteFocusManager';
import HamburgerMenu from './components/HamburgerMenu';
import ThemeToggleButton from './components/ThemeToggleButton';

import UserProfileSkeleton from './components/UserProfileSkeleton';

import { ToastProvider } from './context/ToastContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const HealthCheck = lazy(() => import('./pages/HealthCheck'));

function App() {
  const [scrolled, setScrolled] = useState(false);
  const { isLoggedIn, username } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <Router>
      <ToastProvider>
        <RouteFocusManager />
        <div className="bg-background-default" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header
            role="banner"
            className={`fixed top-0 left-0 w-full z-20 transition-all duration-300 ${scrolled ? 'shadow-md py-3' : 'py-5'} bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 rounded-b-3xl`}
          >
            <div className="container mx-auto px-4 flex items-center justify-between">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/family-logo.webp" 
                  className="h-14 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 group-hover:h-16 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" 
                  alt="Family Logo" 
                />
                <span className="ml-3 text-xl font-bold text-white hidden sm:block">Family Portal</span>
              </Link>
              
              <div className="flex items-center">
                <div className="hidden md:flex items-center space-x-1">
                  <Link 
                    to="/" 
                    className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    Home
                  </Link>
                  
                  {isLoggedIn ? (
                    <Link 
                      to={`/profile/${username}`} 
                      className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    >
                      {username}
                    </Link>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        Login
                      </Link>
                      <Link 
                        to="/register" 
                        className="px-4 py-2 rounded-lg gradient-bg text-white font-medium shadow-sm hover:opacity-90 transition-colors duration-200"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
                
                <div className="ml-4">
                  <ThemeToggleButton />
                </div>
                
                <div className="md:hidden ml-4">
                  <HamburgerMenu isLoggedIn={isLoggedIn} username={username} />
                </div>
              </div>
            </div>
            
            {/* Tagline */}
            <div className="container mx-auto px-4 mt-1">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 hidden md:block">
                Your central hub for family coordination and memories
              </p>
            </div>
          </header>

          {/* Main Content Area */}
          <main role="main" className="w-full pt-28" style={{ flex: '1 0 auto' }} tabIndex={-1}>
            <Suspense fallback={
              <div className="w-full h-64 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-400 mb-4"></div>
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            }>
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
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/healthz" element={<HealthCheck />} />
              </Routes>
            </Suspense>
          </main>

          {/* Footer */}
          <footer role="contentinfo" className="w-full bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-center py-6 border-t border-gray-200 dark:border-gray-800 mt-12">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p>&copy; {new Date().getFullYear()} Family Portal. All rights reserved.</p>
                <div className="flex space-x-4 mt-4 md:mt-0">
                  <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
