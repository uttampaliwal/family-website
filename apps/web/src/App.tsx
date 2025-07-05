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
      <header className={`fixed top-0 left-0 w-full bg-gray-800 z-20 px-8 py-4 flex items-center ${scrolled ? 'shadow-lg' : ''}`}>
        <Link to="/">
          <img src="/family-logo.webp" className="w-[120px] h-[120px] object-contain drop-shadow-[0_0_10px_rgba(74,222,128,0.7)]" alt="Family Logo" />
        </Link>
        <nav className="ml-auto space-x-4">
          <Link to="/" className="text-gray-300 hover:text-white text-lg font-medium">Home</Link>
          <Link to="/login" className="text-gray-300 hover:text-white text-lg font-medium">Login</Link>
          <Link to="/register" className="text-gray-300 hover:text-white text-lg font-medium">Register</Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="min-h-screen flex flex-col items-center w-full pt-[140px]"> {/* Adjusted padding for header */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/profile/:username" element={<UserProfilePage />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer className="w-full bg-gray-800 text-gray-400 text-center py-4 mt-8">
        <p>&copy; {new Date().getFullYear()} Family Portal. All rights reserved.</p>
      </footer>
    </Router>
  );
}

export default App;
