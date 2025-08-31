import React, { useState, useEffect, useCallback } from "react";
import api from "../services/axios";
import { useToast } from "../hooks/useToast";
import LoadingIndicator from "../components/LoadingIndicator";
import type { IUser } from "../../../api/src/models/User";

interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  adminUsers: number;
  recentUsers: IUser[];
  lastUpdated: string;
}

interface ActivityLog {
  _id: string;
  event: string;
  timestamp: string;
  details?: string;
  adminId: string;
  adminUsername: string;
}

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "pending" | "activity"
  >("overview");
  const [pendingUsers, setPendingUsers] = useState<IUser[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{
    [key: string]: string;
  }>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsResponse, pendingResponse, activityResponse] =
        await Promise.all([
          api.get("/api/admin/dashboard/stats"),
          api.get("/api/admin/pending-users"),
          api.get("/api/admin/activity-logs?limit=20"),
        ]);

      setDashboardStats(statsResponse.data);
      setPendingUsers(pendingResponse.data);
      setActivityLogs(activityResponse.data.activities);
    } catch {
      setError("Failed to load dashboard data.");
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApprove = async (userId: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/approve`);
      setPendingUsers(
        pendingUsers.filter((user) => user._id.toString() !== userId),
      );
      showToast("User approved successfully", "success");

      // Refresh stats
      const statsResponse = await api.get("/api/admin/dashboard/stats");
      setDashboardStats(statsResponse.data);
    } catch {
      setError("Failed to approve user.");
      showToast("Failed to approve user", "error");
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const reason = rejectionReason[userId] || "";
      await api.post(`/api/admin/users/${userId}/reject`, { reason });
      setPendingUsers(
        pendingUsers.filter((user) => user._id.toString() !== userId),
      );
      setRejectionReason((prev) => ({ ...prev, [userId]: "" }));
      setShowRejectModal(null);
      showToast("User rejected successfully", "success");

      // Refresh stats
      const statsResponse = await api.get("/api/admin/dashboard/stats");
      setDashboardStats(statsResponse.data);
    } catch {
      setError("Failed to reject user.");
      showToast("Failed to reject user", "error");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <LoadingIndicator fullScreen />;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-base mb-2">
            Admin Dashboard
          </h1>
          <p className="text-text-muted">
            Manage users and monitor system activity
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-border">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "pending", label: "Pending Users", icon: "⏳" },
              { id: "activity", label: "Activity Logs", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text-base hover:border-border"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && dashboardStats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                {
                  label: "Total Users",
                  value: dashboardStats.totalUsers,
                  color: "bg-blue-500",
                  icon: "👥",
                },
                {
                  label: "Pending",
                  value: dashboardStats.pendingUsers,
                  color: "bg-yellow-500",
                  icon: "⏳",
                },
                {
                  label: "Approved",
                  value: dashboardStats.approvedUsers,
                  color: "bg-green-500",
                  icon: "✅",
                },
                {
                  label: "Rejected",
                  value: dashboardStats.rejectedUsers,
                  color: "bg-red-500",
                  icon: "❌",
                },
                {
                  label: "Admins",
                  value: dashboardStats.adminUsers,
                  color: "bg-purple-500",
                  icon: "👑",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface rounded-lg p-6 shadow-sm border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-sm font-medium">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-text-base">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`${stat.color} text-white p-3 rounded-lg text-xl`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Users */}
            <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-text-base mb-4">
                Recent Users
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-text-muted font-medium">
                        Name
                      </th>
                      <th className="text-left py-2 text-text-muted font-medium">
                        Email
                      </th>
                      <th className="text-left py-2 text-text-muted font-medium">
                        Status
                      </th>
                      <th className="text-left py-2 text-text-muted font-medium">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardStats.recentUsers.map((user) => (
                      <tr
                        key={user._id.toString()}
                        className="border-b border-border"
                      >
                        <td className="py-2 text-text-base">{user.name}</td>
                        <td className="py-2 text-text-base">{user.email}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.adminApprovalStatus === "approved"
                                ? "bg-green-100 text-green-800"
                                : user.adminApprovalStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.adminApprovalStatus}
                          </span>
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pending Users Tab */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-text-base">
                Pending User Approvals
              </h2>
              <button
                onClick={fetchDashboardData}
                className="btn btn-secondary"
              >
                🔄 Refresh
              </button>
            </div>

            {pendingUsers.length > 0 ? (
              <div className="grid gap-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user._id.toString()}
                    className="bg-surface rounded-lg p-6 shadow-sm border border-border"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-text-muted">Name</p>
                            <p className="font-medium text-text-base">
                              {user.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-text-muted">Email</p>
                            <p className="font-medium text-text-base">
                              {user.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-text-muted">Username</p>
                            <p className="font-medium text-text-base">
                              {user.username}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-text-muted">
                              Relationship
                            </p>
                            <p className="font-medium text-text-base">
                              {user.relationship}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApprove(user._id.toString())}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() =>
                            setShowRejectModal(user._id.toString())
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-text-base mb-2">
                  All caught up!
                </h3>
                <p className="text-text-muted">
                  No users are currently pending approval.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-text-base">
                Admin Activity Logs
              </h2>
              <button
                onClick={fetchDashboardData}
                className="btn btn-secondary"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="bg-surface rounded-lg shadow-sm border border-border">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-background">
                    <tr>
                      <th className="text-left py-3 px-4 text-text-muted font-medium">
                        Timestamp
                      </th>
                      <th className="text-left py-3 px-4 text-text-muted font-medium">
                        Admin
                      </th>
                      <th className="text-left py-3 px-4 text-text-muted font-medium">
                        Event
                      </th>
                      <th className="text-left py-3 px-4 text-text-muted font-medium">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log._id} className="border-b border-border">
                        <td className="py-3 px-4 text-text-base text-sm">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="py-3 px-4 text-text-base font-medium">
                          {log.adminUsername}
                        </td>
                        <td className="py-3 px-4 text-text-base">
                          {log.event}
                        </td>
                        <td className="py-3 px-4 text-text-muted text-sm">
                          {log.details || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-text-base mb-4">
                Reject User
              </h3>
              <p className="text-text-muted mb-4">
                Please provide a reason for rejecting this user (optional):
              </p>
              <textarea
                value={rejectionReason[showRejectModal] || ""}
                onChange={(e) =>
                  setRejectionReason((prev) => ({
                    ...prev,
                    [showRejectModal]: e.target.value,
                  }))
                }
                className="w-full p-3 border border-border rounded-lg resize-none"
                rows={3}
                placeholder="Reason for rejection..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Reject User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
