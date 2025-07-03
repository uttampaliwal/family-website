import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';


function App() {
  return (
    <Router>
      {/* Permanent Logo at Top-Left of the Webpage */}
      <Link to="/" className="absolute top-7 left-9 z-10"> {/* Adjusted top and left for slight shift */}
        <img src="/family-logo.webp" className="w-[100px] h-[100px] object-contain" alt="Family Logo" />
      </Link>

      {/* Main Content Area */}
      <div className="min-h-screen flex flex-col items-center w-full pt-[140px] pl-[140px]"> {/* Padding remains sufficient */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
