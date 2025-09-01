import React, { useReducer, useEffect } from "react";
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
import { userProfileReducer } from "../reducers/userProfileReducer";
import type { ProfileState } from "../reducers/userProfileReducer";

const initialState: ProfileState = {
  userProfile: null,
  editableProfile: null,
  loading: true,
  error: null,
  isEditing: false,
};

const UserProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const { username: authUsername, logout } = useAuth();
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(userProfileReducer, initialState);

  const displayUsername = authUsername || paramUsername;

  useEffect(() => {
    const fetchUserProfile = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        const response = await api.get(`/api/auth/profile/${displayUsername}`);
        dispatch({ type: "FETCH_SUCCESS", payload: response.data });
      } catch (err) {
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

        dispatch({ type: "FETCH_ERROR", payload: getErrorMessage(err) });
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

  if (state.loading) {
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

  if (state.error) {
    return (
      <div className="text-center mt-8 text-error">Error: {state.error}</div>
    );
  }

  if (!state.userProfile) {
    return <EmptyState message="User profile not found." />;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="card">
        <h1 className="headline mb-6 text-on-surface text-center">
          @{state.userProfile.username}
        </h1>

        {state.isEditing ? (
          <EnhancedProfileEdit
            userProfile={state.userProfile}
            onSave={(updatedProfile) =>
              dispatch({ type: "EDIT_SAVE", payload: updatedProfile })
            }
            onCancel={() => dispatch({ type: "EDIT_CANCEL" })}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-readable">
              <p>
                <strong>Name:</strong> {state.userProfile.name || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {state.userProfile.email}
              </p>
              <p>
                <strong>Date of Birth:</strong>{" "}
                {state.userProfile.dateOfBirth || "N/A"}
              </p>
              <p>
                <strong>Mobile Number:</strong>{" "}
                {state.userProfile.mobileNumber || "N/A"}
              </p>
              <p>
                <strong>Gender:</strong>{" "}
                {labelForGender(state.userProfile.gender) || "N/A"}
              </p>
            </div>
            {authUsername === state.userProfile.username && (
              <div className="mt-8">
                <RelationshipManager
                  currentRelationship={state.userProfile.relationship || []}
                  onUpdate={(newRelationship) => {
                    const updatedProfile = {
                      ...state.userProfile,
                      relationship: newRelationship,
                    };
                    dispatch({
                      type: "EDIT_SAVE",
                      payload: updatedProfile as UserProfile,
                    });
                  }}
                />
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-8">
              {authUsername === state.userProfile.username && (
                <Button
                  label="Edit Profile"
                  onClick={() => dispatch({ type: "EDIT_START" })}
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
