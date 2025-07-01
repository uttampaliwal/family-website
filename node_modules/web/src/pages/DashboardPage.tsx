import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {user?.name || 'User'}!</h2>
        <p className="text-gray-600 mb-6">This is your personalized dashboard.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">Photos</h3>
            <p className="text-gray-700">Manage your family photos here.</p>
            <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">View Photos</button>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-green-700 mb-2">Blog</h3>
            <p className="text-gray-700">Share your stories and updates.</p>
            <button className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">Read Blog</button>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-yellow-700 mb-2">Calendar</h3>
            <p className="text-gray-700">Keep track of important events.</p>
            <button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">Open Calendar</button>
          </div>
          <div className="bg-red-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Settings</h3>
            <p className="text-gray-700">Adjust your profile and preferences.</p>
            <button className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">Go to Settings</button>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-8 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
