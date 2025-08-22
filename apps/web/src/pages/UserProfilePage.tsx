import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import { isAxiosError } from "axios";
import api from "../api/axios";
import type { UserProfile } from "../types/api";

import CustomSelect from "../components/CustomSelect";
import DateOfBirthPicker from "../components/DateOfBirthPicker";

import EmptyState from "../components/EmptyState";

// Constants for better maintainability
const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const UserProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const { username: authUsername, logout } = useAuth();
  const navigate = useNavigate();

  // Consolidated state for better maintainability
  const [profileState, setProfileState] = useState({
    userProfile: null as UserProfile | null,
    editableProfile: null as UserProfile | null,
    loading: true,
    error: null as string | null,
    isEditing: false,
  });

  const displayUsername = authUsername || paramUsername;

  useEffect(() => {
    const fetchUserProfile = async () => {
      setProfileState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api.get(`/api/auth/profile/${displayUsername}`);
        const data = response.data;

        setProfileState((prev) => ({
          ...prev,
          userProfile: data,
          editableProfile: data,
        }));
      } catch (err) {
        // Structured error logging with context
        const errorInfo = {
          message: err instanceof Error ? err.message : "Unknown error",
          username: displayUsername,
          timestamp: new Date().toISOString(),
          operation: "fetchUserProfile",
        };
        console.error(
          "Error fetching user profile:",
          JSON.stringify(errorInfo),
        );

        const getErrorMessage = (error: unknown): string => {
          if (isAxiosError(error)) {
            const status = error.response?.status;
            switch (status) {
              case 404:
                return "User profile not found.";
              case 401:
                return "You are not authorized to view this profile.";
              case 403:
                return "Access denied to this profile.";
              case 500:
              case 502:
              case 503:
                return "Server error. Please try again later.";
              default:
                return (
                  error.response?.data?.message ||
                  "Failed to load profile. Please try again."
                );
            }
          }
          return "Network error or server is unreachable.";
        };

        setProfileState((prev) => ({ ...prev, error: getErrorMessage(err) }));
      } finally {
        setProfileState((prev) => ({ ...prev, loading: false }));
      }
    };

    if (displayUsername) {
      fetchUserProfile();
    }
  }, [displayUsername]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEdit = () => {
    setProfileState((prev) => ({ ...prev, isEditing: true }));
  };

  const handleSave = async () => {
    if (!profileState.editableProfile) return;

    try {
      // Only send the fields that are editable
      const updateData = {
        name: profileState.editableProfile.name,
        dateOfBirth: profileState.editableProfile.dateOfBirth,
        mobileNumber: profileState.editableProfile.mobileNumber,
        gender: profileState.editableProfile.gender,
      };
      await api.put(`/api/auth/profile/${displayUsername}`, updateData);
      setProfileState((prev) => ({
        ...prev,
        userProfile: prev.editableProfile,
        isEditing: false,
      }));
    } catch (err) {
      console.error("Error updating user profile:", err);
      setProfileState((prev) => ({
        ...prev,
        error: "Failed to update profile.",
      }));
    }
  };

  const handleCancel = () => {
    setProfileState((prev) => ({
      ...prev,
      editableProfile: prev.userProfile,
      isEditing: false,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileState((prev) => ({
      ...prev,
      editableProfile: prev.editableProfile
        ? { ...prev.editableProfile, [name]: value }
        : null,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileState((prev) => ({
      ...prev,
      editableProfile: prev.editableProfile
        ? { ...prev.editableProfile, [name]: value }
        : null,
    }));
  };

  const handleDateChange = (value: string) => {
    setProfileState((prev) => ({
      ...prev,
      editableProfile: prev.editableProfile
        ? { ...prev.editableProfile, dob: value }
        : null,
    }));
  };

  if (profileState.loading) {
    return (
      <div className="text-center mt-8 text-gray-700 dark:text-gray-300">
        Loading profile...
      </div>
    );
  }

  if (profileState.error) {
    return (
      <div className="text-center mt-8 text-red-500">
        Error: {profileState.error}
      </div>
    );
  }

  if (!profileState.userProfile) {
    return <EmptyState message="User profile not found." />;
  }

  return (
    <div className="container mx-auto p-8 bg-background-light dark:bg-background-dark rounded-xl shadow-lg text-text-light dark:text-text-dark">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800 dark:text-gray-100">
        @{profileState.userProfile.username}
      </h1>

      {profileState.isEditing ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileState.editableProfile?.name || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Date of Birth
              </label>
              <DateOfBirthPicker
                value={profileState.editableProfile?.dateOfBirth || ""}
                onChange={handleDateChange}
              />
            </div>
            <div>
              <label
                htmlFor="mobileNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Mobile Number
              </label>
              <input
                type="text"
                id="mobileNumber"
                name="mobileNumber"
                value={profileState.editableProfile?.mobileNumber || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Gender
              </label>
              <CustomSelect
                id="gender"
                name="gender"
                value={profileState.editableProfile?.gender || ""}
                onChange={(value) => handleSelectChange("gender", value)}
                options={GENDER_OPTIONS}
              />
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <Button
              label="Save Changes"
              onClick={handleSave}
              variant="primary"
            />
            <Button label="Cancel" onClick={handleCancel} variant="secondary" />
          </div>
          <div className="text-center mt-4">
            <Button
              label="Change Password"
              onClick={() => navigate("/forgot-password")}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-gray-700 dark:text-gray-300">
            <p>
              <strong>Name:</strong> {profileState.userProfile.name || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {profileState.userProfile.email}
            </p>
            <p>
              <strong>Date of Birth:</strong>{" "}
              {profileState.userProfile.dateOfBirth || "N/A"}
            </p>
            <p>
              <strong>Mobile Number:</strong>{" "}
              {profileState.userProfile.mobileNumber || "N/A"}
            </p>
            <p>
              <strong>Gender:</strong>{" "}
              {profileState.userProfile.gender || "N/A"}
            </p>
          </div>
          <div className="flex justify-center space-x-4 mt-8">
            {authUsername === profileState.userProfile.username && (
              <Button
                label="Edit Profile"
                onClick={handleEdit}
                variant="primary"
              />
            )}
            <Button label="Logout" onClick={handleLogout} variant="secondary" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
