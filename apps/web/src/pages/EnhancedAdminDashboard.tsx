import React, { useState, useEffect, useCallback } from "react";
import api from "../services/axios";
import { useToast } from "../hooks/useToast";
import LoadingIndicator from "../components/LoadingIndicator";

interface EnhancedDashboardStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  adminUsers: number;
  revokedUsers: number;
  pendingPromotions: number;
  recentActions: AdminAction[];
  criticalActions: number;
  lastUpdated: string;
}

interface AdminAction {
  _id: string;
  action: string;
  targetType: string;
  details: {
    description: string;
    reason?: string;
  };
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  adminId: {
    username: string;
  };
}

interface PendingUser {
  _id: string;
  username: string;
  email: string;
  name: string;
  adminApprovalStatus: string;
  createdAt: string;
}

interface PendingPromotion {
  _id: string;
  username: string;
  email: string;
  adminPromotion: {
    status: string;
    requestedAt: string;
    activationDate: string;
    approvedBy: string[];
    reason: string;
    requestedBy: {
      username: string;
    };
  };
}

interface ConfirmationModal {
  isOpen: boolean;
  type: "approve" | "reject" | "revoke" | "promote";
  userId?: string;
  username?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const EnhancedAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "pending" | "promotions" | "access" | "activity"
  >("overview");

  const [dashboardStats, setDashboardStats] =
    useState<EnhancedDashboardStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingPromotions, setPendingPromotions] = useState<
    PendingPromotion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>(
    {
      isOpen: false,
      type: "approve",
      onConfirm: () => {},
      onCancel: () => {},
    },
  );

  const [formData, setFormData] = useState({
    rejectionReason: "",
    revocationReason: "",
    promotionReason: "",
    confirmationText: "",
  });

  const { showToast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsResponse, pendingResponse, promotionsResponse] =
        await Promise.all([
          api.get("/api/admin/dashboard/enhanced-stats"),
          api.get("/api/admin/pending-users"),
          api.get("/api/admin/pending-promotions"),
        ]);

      setDashboardStats(statsResponse.data);
      setPendingUsers(pendingResponse.data);
      setPendingPromotions(promotionsResponse.data);
    } catch {
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApproveWithConfirmation = async (userId: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/approve-confirmed`, {
        confirmation: "CONFIRM_APPROVE",
      });
      showToast("User approved successfully", "success");
      fetchDashboardData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to approve user"
          : "Failed to approve user";
      showToast(errorMessage, "error");
    }
  };

  const handleRevokeAccess = async (userId: string, reason: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/revoke-access`, {
        reason,
        confirmation: "CONFIRM_REVOKE",
      });
      showToast("User access revoked successfully", "success");
      fetchDashboardData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to revoke access"
          : "Failed to revoke access";
      showToast(errorMessage, "error");
    }
  };

  const handleApprovePromotion = async (userId: string) => {
    try {
      await api.post(`/api/admin/promotions/${userId}/approve`, {
        confirmation: "CONFIRM_PROMOTE",
      });
      showToast("Promotion approved successfully", "success");
      fetchDashboardData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to approve promotion"
          : "Failed to approve promotion";
      showToast(errorMessage, "error");
    }
  };

  const openConfirmationModal = (
    type: ConfirmationModal["type"],
    userId: string,
    username: string,
    onConfirm: () => void,
  ) => {
    setConfirmationModal({
      isOpen: true,
      type,
      userId,
      username,
      onConfirm,
      onCancel: () =>
        setConfirmationModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const renderStatsCard = (
    title: string,
    value: number,
    color: string,
    icon: string,
  ) => (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`text-4xl ${color.replace("border-l-", "text-")}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const renderConfirmationModal = () => {
    if (!confirmationModal.isOpen) return null;

    const getModalContent = () => {
      switch (confirmationModal.type) {
        case "approve":
          return {
            title: "Confirm User Approval",
            message: `Are you sure you want to approve ${confirmationModal.username}?`,
            confirmText: "CONFIRM_APPROVE",
            action: () =>
              handleApproveWithConfirmation(confirmationModal.userId!),
          };
        case "revoke":
          return {
            title: "Confirm Access Revocation",
            message: `Are you sure you want to revoke access for ${confirmationModal.username}?`,
            confirmText: "CONFIRM_REVOKE",
            action: () =>
              handleRevokeAccess(
                confirmationModal.userId!,
                formData.revocationReason,
              ),
          };
        case "promote":
          return {
            title: "Confirm Promotion Approval",
            message: `Are you sure you want to approve admin promotion for ${confirmationModal.username}?`,
            confirmText: "CONFIRM_PROMOTE",
            action: () => handleApprovePromotion(confirmationModal.userId!),
          };
        default:
          return { title: "", message: "", confirmText: "", action: () => {} };
      }
    };

    const { title, message, confirmText, action } = getModalContent();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>

          {confirmationModal.type === "revoke" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for revocation:
              </label>
              <textarea
                value={formData.revocationReason}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    revocationReason: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Enter reason for access revocation..."
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type "{confirmText}" to confirm:
            </label>
            <input
              type="text"
              value={formData.confirmationText}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmationText: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder={confirmText}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={confirmationModal.onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (formData.confirmationText === confirmText) {
                  action();
                  confirmationModal.onCancel();
                  setFormData((prev) => ({
                    ...prev,
                    confirmationText: "",
                    revocationReason: "",
                  }));
                } else {
                  showToast("Confirmation text does not match", "error");
                }
              }}
              disabled={formData.confirmationText !== confirmText}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Enhanced Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive control center for application management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: "overview", label: "Overview", icon: "📊" },
              { key: "pending", label: "Pending Users", icon: "⏳" },
              { key: "promotions", label: "Promotions", icon: "⬆️" },
              { key: "access", label: "Access Control", icon: "🔐" },
              { key: "activity", label: "Activity Log", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === tab.key
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && dashboardStats && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderStatsCard(
                "Total Users",
                dashboardStats.totalUsers,
                "border-l-blue-500",
                "👥",
              )}
              {renderStatsCard(
                "Pending Approval",
                dashboardStats.pendingUsers,
                "border-l-yellow-500",
                "⏳",
              )}
              {renderStatsCard(
                "Admin Users",
                dashboardStats.adminUsers,
                "border-l-green-500",
                "👑",
              )}
              {renderStatsCard(
                "Revoked Access",
                dashboardStats.revokedUsers,
                "border-l-red-500",
                "🚫",
              )}
            </div>

            {/* Critical Actions Alert */}
            {dashboardStats.criticalActions > 0 && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-500 text-xl mr-3">⚠️</span>
                  <div>
                    <h3 className="text-red-800 dark:text-red-200 font-semibold">
                      Critical Actions Alert
                    </h3>
                    <p className="text-red-600 dark:text-red-300">
                      {dashboardStats.criticalActions} critical actions in the
                      last 24 hours
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Admin Actions
              </h3>
              <div className="space-y-3">
                {dashboardStats.recentActions.map((action) => (
                  <div
                    key={action._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {action.details.description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by {action.adminId.username} •{" "}
                        {new Date(action.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        action.severity === "critical"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : action.severity === "high"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {action.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending Users Tab */}
        {activeTab === "pending" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pending User Approvals
            </h3>
            {pendingUsers.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No pending users
              </p>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {user.name} (@{user.username})
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Registered:{" "}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          openConfirmationModal(
                            "approve",
                            user._id,
                            user.username,
                            () => handleApproveWithConfirmation(user._id),
                          )
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          openConfirmationModal(
                            "revoke",
                            user._id,
                            user.username,
                            () =>
                              handleRevokeAccess(
                                user._id,
                                formData.revocationReason,
                              ),
                          )
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Promotions Tab */}
        {activeTab === "promotions" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pending Admin Promotions
            </h3>
            {pendingPromotions.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No pending promotions
              </p>
            ) : (
              <div className="space-y-4">
                {pendingPromotions.map((promotion) => (
                  <div
                    key={promotion._id}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {promotion.username}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {promotion.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested by:{" "}
                          {promotion.adminPromotion.requestedBy.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Activation:{" "}
                          {new Date(
                            promotion.adminPromotion.activationDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Reason:</strong>{" "}
                        {promotion.adminPromotion.reason}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Approvals: {promotion.adminPromotion.approvedBy.length}
                        /2
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() =>
                          openConfirmationModal(
                            "promote",
                            promotion._id,
                            promotion.username,
                            () => handleApprovePromotion(promotion._id),
                          )
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Approve Promotion
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {renderConfirmationModal()}
    </div>
  );
};

export default EnhancedAdminDashboard;
