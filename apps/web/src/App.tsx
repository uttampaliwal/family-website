import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';


function App() {
  return (
    <Router>
      {/* Permanent Logo at Top-Left of the Webpage */}
      <Link to="/" className="absolute top-0 left-0 z-10 p-4"> {/* Removed debugging colors */}
        <img src="/family-logo.webp" className="w-[80px] h-[80px] object-contain" alt="Family Logo" />
      </Link>

      {/* Main Content Area */}
      <div className="min-h-screen flex flex-col items-center w-full pt-[100px] pl-[100px]"> {/* Adjusted padding for logo */}
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
