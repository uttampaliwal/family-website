import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import UserProfilePage from './pages/UserProfilePage';


function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0;
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
      <div className="bg-gray-50 dark:bg-gray-950" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header className={`fixed top-0 left-0 w-full bg-gradient-to-r from-blue-800 to-purple-900 text-white z-20 px-8 py-2 flex items-center rounded-b-3xl transition-all duration-300 ${scrolled ? 'shadow-xl' : ''}`}>
          <Link to="/" className="flex items-center">
            <img src="/family-logo.webp" className="w-[120px] h-[120px] object-contain drop-shadow-[0_0_10px_rgba(74,222,128,0.7)]" alt="Family Logo" />
          </Link>
          <nav className="ml-auto space-x-6 mr-8">
            <Link to="/" className="text-white hover:text-gray-200 text-lg font-semibold transition-colors duration-200">Home</Link>
            <Link to="/login" className="text-white hover:text-gray-200 text-lg font-semibold transition-colors duration-200">Login</Link>
            <Link to="/register" className="text-white hover:text-gray-200 text-lg font-semibold transition-colors duration-200">Register</Link>
          </nav>
        </header>

        {/* Main Content Area */}
        <main className="w-full pt-[160px]" style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/profile/:username" element={<UserProfilePage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="w-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 text-center py-4">
          <p>&copy; {new Date().getFullYear()} Family Portal. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
