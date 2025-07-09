import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface UserProfile {
  username: string;
  email: string;
  name?: string;
  dob?: string;
  mobileNumber?: string;
  gender?: string;
  // Add other profile fields as needed
}

const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile/${username}`);
        const data = await response.json();

        if (response.ok) {
          setUserProfile(data);
        } else {
          setError(data.message || 'Failed to fetch user profile.');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Network error or server is unreachable.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]);

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
      {/* Add more profile details here */}
    </div>
  );
};

export default UserProfilePage;
