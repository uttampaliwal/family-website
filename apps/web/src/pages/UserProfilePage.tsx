import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import { isAxiosError } from "axios";
import api from "../services/axios";
import type { UserProfile } from "../types/api";
import { labelForGender } from "../lib/gender";
import EnhancedProfileEdit from "../components/EnhancedProfileEdit";
import RelationshipManager from "../components/RelationshipManager";

import EmptyState from "../components/EmptyState";

// Gender options are centralized in lib/gender

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

  const handleCancel = () => {
    setProfileState((prev) => ({
      ...prev,
      editableProfile: prev.userProfile,
      isEditing: false,
    }));
  };

  if (profileState.loading) {
    return (
      <div className="mt-8">
        <div className="max-w-md mx-auto">
          <img
            src="/family-logo.svg"
            alt="Loading"
            className="h-20 w-20 object-contain mx-auto mb-4 animate-pulse"
          />
          <div className="text-center text-gray-700 dark:text-gray-300 text-lg font-medium">
            Loading . . .
          </div>
        </div>
      </div>
    );
  }

  if (profileState.error) {
    return (
      <div className="text-center mt-8 text-error">
        Error: {profileState.error}
      </div>
    );
  }

  if (!profileState.userProfile) {
    return <EmptyState message="User profile not found." />;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="card">
        <h1 className="headline mb-6 text-on-surface text-center">
          @{profileState.userProfile.username}
        </h1>

        {profileState.isEditing ? (
          <EnhancedProfileEdit
            userProfile={profileState.userProfile}
            onSave={(updatedProfile) => {
              setProfileState((prev) => ({
                ...prev,
                userProfile: updatedProfile,
                editableProfile: updatedProfile,
                isEditing: false,
                error: null,
              }));
            }}
            onCancel={handleCancel}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-readable">
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
                {labelForGender(profileState.userProfile.gender) || "N/A"}
              </p>
            </div>
            {/* Relationship Manager - only show for the current user */}
            {authUsername === profileState.userProfile.username && (
              <div className="mt-8">
                <RelationshipManager
                  currentRelationship={profileState.userProfile.relationship}
                  onUpdate={(newRelationship) => {
                    setProfileState((prev) => ({
                      ...prev,
                      userProfile: prev.userProfile
                        ? {
                            ...prev.userProfile,
                            relationship: newRelationship,
                          }
                        : null,
                    }));
                  }}
                />
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-8">
              {authUsername === profileState.userProfile.username && (
                <Button
                  label="Edit Profile"
                  onClick={handleEdit}
                  variant="primary"
                />
              )}
              <Button
                label="Logout"
                onClick={handleLogout}
                variant="secondary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
