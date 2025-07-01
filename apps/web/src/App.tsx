import { useState, useEffect } from 'react';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you'd verify the token with your backend
      // and fetch user data before logging in.
      // For now, we'll assume a valid token means authenticated.
      login(token, { name: 'Authenticated User', email: 'user@example.com' }); // Placeholder user data
    }
  }, [login]);

  const handleSwitchToSignup = () => {
    setShowLogin(false);
  };

  const handleSwitchToLogin = () => {
    setShowLogin(true);
  };

  return (
    <Layout>
      {isAuthenticated ? (
        <DashboardPage />
      ) : (
        <div className="App">
          {showLogin ? (
            <LoginPage onSwitchToSignup={handleSwitchToSignup} />
          ) : (
            <SignupPage onSwitchToLogin={handleSwitchToLogin} />
          )}
        </div>
      )}
    </Layout>
  );
}

export default App;
