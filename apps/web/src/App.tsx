import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';


function App() {
  return (
    <Router>
      <div className="flex flex-col items-center p-[10px] w-full">
        <Link to="/">
          <img src="/family-logo.svg" className="logo-glow w-[100px] h-[100px]" alt="Family Logo" />
        </Link>
        <div className="w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </div>
        
      </div>
    </Router>
  );
}

export default App;
