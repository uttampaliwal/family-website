import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { updateUserProfile } from "../services/auth";
import { ensureCsrfToken } from "../utils/csrf";
import UsernameAvailabilityChecker from "./UsernameAvailabilityChecker";
import CustomSelect from "./CustomSelect";
import { GENDER_OPTIONS, normalizeGender } from "../lib/gender";
import DateOfBirthPicker from "./DateOfBirthPicker";
import type { UserProfile } from "../types/api";

interface EnhancedProfileEditProps {
  userProfile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onCancel: () => void;
}

const EnhancedProfileEdit: React.FC<EnhancedProfileEditProps> = ({
  userProfile,
  onSave,
  onCancel,
}) => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: userProfile.name || "",
    username: userProfile.username || "",
    email: userProfile.email || "",
    dateOfBirth: userProfile.dateOfBirth || "",
    mobileNumber: userProfile.mobileNumber || "",
    gender: userProfile.gender || "",
    bio: userProfile.bio || "",
    location: userProfile.location || "",
    website: userProfile.website || "",
  });

  const [usernameAvailability, setUsernameAvailability] = useState({
    isAvailable: true,
    isLoading: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: value }));
    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website =
        "Please enter a valid URL starting with http:// or https://";
    }

    if (
      formData.mobileNumber &&
      !/^[+]?[1-9][\d]{0,15}$/.test(formData.mobileNumber)
    ) {
      newErrors.mobileNumber = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast("Please fix the errors before saving", "error");
      return;
    }

    if (
      !usernameAvailability.isAvailable &&
      formData.username !== userProfile.username
    ) {
      showToast("Please choose an available username", "error");
      return;
    }

    setIsSaving(true);

    try {
      await ensureCsrfToken();

      const updateData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.mobileNumber,
        gender: normalizeGender(formData.gender),
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
      };

      const updatedProfile = await updateUserProfile(
        userProfile.username,
        updateData,
      );

      // Update auth context if username changed
      if (formData.username !== userProfile.username && user) {
        updateUser({ ...user, username: formData.username });
      }

      onSave(updatedProfile);
      showToast("Profile updated successfully!", "success");
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update profile";
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="form-group">
          <label className="form-label">
            Full Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`form-input ${errors.name ? "form-input-error" : ""}`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <div className="form-error-message">{errors.name}</div>
          )}
        </div>

        {/* Username */}
        <div className="form-group">
          <label className="form-label">
            Username <span className="text-error">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`form-input ${errors.username ? "form-input-error" : ""}`}
            placeholder="Choose a username"
          />
          {errors.username && (
            <div className="form-error-message">{errors.username}</div>
          )}
          <UsernameAvailabilityChecker
            username={formData.username}
            currentUsername={userProfile.username}
            onAvailabilityChange={(isAvailable, isLoading) => {
              setUsernameAvailability({ isAvailable, isLoading });
            }}
          />
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label">
            Email <span className="text-error">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`form-input ${errors.email ? "form-input-error" : ""}`}
            placeholder="Enter your email"
          />
          {errors.email && (
            <div className="form-error-message">{errors.email}</div>
          )}
        </div>

        {/* Mobile Number */}
        <div className="form-group">
          <label className="form-label">Mobile Number</label>
          <input
            type="tel"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleInputChange}
            className={`form-input ${errors.mobileNumber ? "form-input-error" : ""}`}
            placeholder="Enter your mobile number"
          />
          {errors.mobileNumber && (
            <div className="form-error-message">{errors.mobileNumber}</div>
          )}
        </div>

        {/* Date of Birth */}
        <div className="form-group">
          <label className="form-label">
            Date of Birth <span className="text-error">*</span>
          </label>
          <DateOfBirthPicker
            value={formData.dateOfBirth}
            onChange={handleDateChange}
            error={errors.dateOfBirth}
          />
        </div>

        {/* Gender */}
        <div className="form-group">
          <label className="form-label">
            Gender <span className="text-error">*</span>
          </label>
          <CustomSelect
            options={GENDER_OPTIONS(true)}
            value={formData.gender}
            onChange={(value) => handleSelectChange("gender", value)}
            placeholder="Select gender"
            error={errors.gender}
          />
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter your location"
          />
        </div>

        {/* Website */}
        <div className="form-group">
          <label className="form-label">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            className={`form-input ${errors.website ? "form-input-error" : ""}`}
            placeholder="https://your-website.com"
          />
          {errors.website && (
            <div className="form-error-message">{errors.website}</div>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="form-group">
        <label className="form-label">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          className="form-input"
          rows={4}
          placeholder="Tell us about yourself..."
          maxLength={500}
        />
        <div className="text-sm text-muted mt-1">
          {formData.bio.length}/500 characters
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          disabled={
            isSaving ||
            usernameAvailability.isLoading ||
            (!usernameAvailability.isAvailable &&
              formData.username !== userProfile.username)
          }
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
};

export default EnhancedProfileEdit;
