import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import api from '../api/axios';
import type { UserProfile } from '../types/api';



const UserProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const { username: authUsername, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const displayUsername = authUsername || paramUsername;

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/auth/profile/${displayUsername}`);
        const data = response.data;

        setUserProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Network error or server is unreachable.');
      } finally {
        setLoading(false);
      }
    };

    if (displayUsername) {
      fetchUserProfile();
    }
  }, [displayUsername]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div className="text-center mt-8 text-gray-700 dark:text-gray-300">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  }

  if (!userProfile) {
    return <div className="text-center mt-8 text-gray-700 dark:text-gray-300">User profile not found.</div>;
  }

  return (
    <div className="container mx-auto p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg text-gray-800 dark:text-gray-100">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800 dark:text-gray-100">@{userProfile.username}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-gray-700 dark:text-gray-300">
        <p><strong>Name:</strong> {userProfile.name || 'N/A'}</p>
        <p><strong>Email:</strong> {userProfile.email}</p>
        <p><strong>Date of Birth:</strong> {userProfile.dob || 'N/A'}</p>
        <p><strong>Mobile Number:</strong> {userProfile.mobileNumber || 'N/A'}</p>
        <p><strong>Gender:</strong> {userProfile.gender || 'N/A'}</p>
      </div>
      <div className="text-center mt-8">
        <Button label="Logout" onClick={handleLogout} isPrimary={true} />
      </div>
    </div>
  );
};

export default UserProfilePage;
