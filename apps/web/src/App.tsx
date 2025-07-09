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
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div className="relative z-20">
          <Link to="/" className="absolute top-4 left-8 z-30">
            <img src="/family-logo.webp" className="w-[150px] h-[150px] object-contain drop-shadow-[0_0_15px_rgba(74,222,128,0.9)]" alt="Family Logo" />
          </Link>
          <header className={`fixed top-0 left-0 w-full bg-gradient-to-r from-blue-800 to-purple-900 text-white z-20 px-8 py-4 flex items-center justify-end rounded-b-3xl transition-all duration-300 ${scrolled ? 'shadow-xl' : ''}`}>
            <nav className="space-x-6 mr-8">
              <Link to="/" className="text-gray-200 hover:text-white text-lg font-semibold transition-colors duration-200">Home</Link>
              <Link to="/login" className="text-gray-200 hover:text-white text-lg font-semibold transition-colors duration-200">Login</Link>
              <Link to="/register" className="text-gray-200 hover:text-white text-lg font-semibold transition-colors duration-200">Register</Link>
            </nav>
          </header>
        </div>

        {/* Main Content Area */}
        <main className="w-full pt-[180px]" style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/profile/:username" element={<UserProfilePage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="w-full bg-gray-800 text-gray-400 text-center py-4">
          <p>&copy; {new Date().getFullYear()} Family Portal. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
