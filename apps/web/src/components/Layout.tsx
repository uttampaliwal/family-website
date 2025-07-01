import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="bg-gray-800 text-white p-4 shadow-md w-full">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center group">
            <span className="text-xl font-semibold text-blue-200 mr-2">🌐</span>
            <a href="/" className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 transition-all duration-300 group-hover:scale-105">Uttam Paliwal</a>
            <span className="ml-2 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-full group-hover:translate-x-0">(luv log) from uttam</span>
          </div>
          <nav>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome, {user?.name || 'User'}!</span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              // You can add public navigation links here if needed
              <></>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow w-full">
        {children}
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center shadow-md mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Family Website. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
