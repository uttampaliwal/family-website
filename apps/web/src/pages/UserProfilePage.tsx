import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import api from '../api/axios';
import type { UserProfile } from '../types/api';
import PersonalDetailsForm from '../components/PersonalDetailsForm';
import AccountInformationForm from '../components/AccountInformationForm';
import CustomSelect from '../components/CustomSelect';
import DateOfBirthPicker from '../components/DateOfBirthPicker';


const UserProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const { username: authUsername, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableProfile, setEditableProfile] = useState<UserProfile | null>(null);

  const displayUsername = authUsername || paramUsername;

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/auth/profile/${displayUsername}`);
        const data = response.data;

        setUserProfile(data);
        setEditableProfile(data); // Initialize editable profile with fetched data
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editableProfile) return;

    try {
      // Only send the fields that are editable
      const updateData = {
        name: editableProfile.name,
        dob: editableProfile.dob,
        mobileNumber: editableProfile.mobileNumber,
        gender: editableProfile.gender,
      };
      await api.put(`/api/auth/profile/${displayUsername}`, updateData);
      setUserProfile(editableProfile); // Update main profile state
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update profile.');
    }
  };

  const handleCancel = () => {
    setEditableProfile(userProfile); // Revert changes
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleDateChange = (date: Date | null) => {
    setEditableProfile(prev => (prev ? { ...prev, dob: date ? date.toISOString().split('T')[0] : '' } : null));
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
    <div className="container mx-auto p-8 bg-background-light dark:bg-background-dark rounded-xl shadow-lg text-text-light dark:text-text-dark">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800 dark:text-gray-100">@{userProfile.username}</h1>

      {isEditing ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editableProfile?.name || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
              <DateOfBirthPicker
                selectedDate={editableProfile?.dob ? new Date(editableProfile.dob) : null}
                onChange={handleDateChange}
              />
            </div>
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
              <input
                type="text"
                id="mobileNumber"
                name="mobileNumber"
                value={editableProfile?.mobileNumber || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
              <CustomSelect
                id="gender"
                name="gender"
                value={editableProfile?.gender || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <Button label="Save Changes" onClick={handleSave} isPrimary={true} />
            <Button label="Cancel" onClick={handleCancel} />
          </div>
          <div className="text-center mt-4">
            <Button label="Change Password" onClick={() => navigate('/forgot-password')} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-gray-700 dark:text-gray-300">
            <p><strong>Name:</strong> {userProfile.name || 'N/A'}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Date of Birth:</strong> {userProfile.dob || 'N/A'}</p>
            <p><strong>Mobile Number:</strong> {userProfile.mobileNumber || 'N/A'}</p>
            <p><strong>Gender:</strong> {userProfile.gender || 'N/A'}</p>
          </div>
          <div className="flex justify-center space-x-4 mt-8">
            {authUsername === userProfile.username && (
              <Button label="Edit Profile" onClick={handleEdit} isPrimary={true} />
            )}
            <Button label="Logout" onClick={handleLogout} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
