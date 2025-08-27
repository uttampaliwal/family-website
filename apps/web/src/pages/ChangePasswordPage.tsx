import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ensureCsrfToken } from "../utils/csrf";
import { changePassword } from "../services/auth";
import { useToast } from "../hooks/useToast";

const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all fields", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    try {
      setLoading(true);
      await ensureCsrfToken();
      const res = await changePassword(currentPassword, newPassword);
      showToast(res.message || "Password updated successfully", "success");
      navigate(-1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to change password";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header"></div>
        <div className="auth-form">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
              Change Password
            </h1>
            <p className="text-muted">Update your password below</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium text-base mb-2"
                htmlFor="currentPassword"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                className="input w-full"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-base mb-2"
                htmlFor="newPassword"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className="input w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-base mb-2"
                htmlFor="confirmPassword"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
