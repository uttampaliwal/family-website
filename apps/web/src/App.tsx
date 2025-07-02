import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AuthButtons from './components/AuthButtons';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', width: '100%' }}>
        <Link to="/">
          <img src="/family-logo.svg" className="logo-glow" alt="Family Logo" style={{ width: '100px', height: '100px' }} />
        </Link>
        <div style={{ width: '100%' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </div>
        <AuthButtons />
      </div>
    </Router>
  );
}

export default App;
