import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/axios";
import {
  FaUsers,
  FaFileAlt,
  FaFileMedicalAlt,
  FaShieldAlt,
} from "react-icons/fa";
import {
  StatCard,
  ActivityLog,
} from "../../components/admin/DashboardComponents";
import Breadcrumb from "../../components/Breadcrumb";

// --- Type Definitions ---
interface Activity {
  _id: string;
  adminUsername: string;
  event: string;
  details: string;
  timestamp: string;
}

// --- API Fetching Functions ---
const fetchAdminStats = async () => {
  const { data } = await api.get("/api/admin/dashboard/enhanced-stats");
  return data;
};

const fetchAdminActivities = async (): Promise<Activity[]> => {
  const { data } = await api.get("/api/admin/activity-logs");
  return data.activities;
};

const DashboardHomePage: React.FC = () => {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: fetchAdminStats,
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["adminActivities"],
    queryFn: fetchAdminActivities,
    refetchInterval: 15000,
  });

  if (isLoadingStats || isLoadingActivities) {
    return (
      <div className="space-y-8">
        {/* Skeleton for stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-lg p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                <div className="w-8 h-8 bg-muted rounded"></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="w-20 h-4 bg-muted rounded"></div>
                <div className="w-16 h-6 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton for chart */}
        <div className="bg-surface rounded-lg p-6 animate-pulse">
          <div className="w-32 h-6 bg-muted rounded mb-4"></div>
          <div className="w-full h-64 bg-muted rounded"></div>
        </div>
        {/* Skeleton for activity log */}
        <div className="bg-surface rounded-lg p-6 animate-pulse">
          <div className="w-32 h-6 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="w-3/4 h-4 bg-muted rounded"></div>
                  <div className="w-1/2 h-3 bg-muted rounded"></div>
                </div>
                <div className="w-16 h-3 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[{ label: "Admin", to: "/admin" }, { label: "Dashboard" }]}
      />

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
        <h1 className="text-3xl font-bold text-text-base mb-2">
          Welcome back, Admin!
        </h1>
        <p className="text-muted">
          Here's what's happening with your family portal today.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FaUsers className="text-blue-500" />}
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          change="+12%"
        />
        <StatCard
          icon={<FaFileAlt className="text-green-500" />}
          title="Total Documents"
          value={stats?.documentCount ?? 0}
          change="+5%"
        />
        <StatCard
          icon={<FaFileMedicalAlt className="text-purple-500" />}
          title="Storage Used"
          value={`${(stats?.storageUsed / 1024 / 1024).toFixed(2)} MB`}
          change="+2.1%"
        />
        <StatCard
          icon={<FaShieldAlt className="text-orange-500" />}
          title="Active Admins"
          value={stats?.adminUsers ?? 0}
          change="0%"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4 text-text-base">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-primary flex items-center justify-center space-x-2">
            <FaUsers />
            <span>Manage Users</span>
          </button>
          <button className="btn btn-secondary flex items-center justify-center space-x-2">
            <FaFileAlt />
            <span>View Documents</span>
          </button>
          <button className="btn btn-outline flex items-center justify-center space-x-2">
            <FaShieldAlt />
            <span>System Settings</span>
          </button>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4 text-text-base">
          Platform Overview
        </h2>
        <div className="text-center py-8">
          <p className="text-muted">Chart visualization coming soon</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activities && <ActivityLog activities={activities} />}
        </div>
        <div className="space-y-6">
          {/* System Status */}
          <div className="bg-surface rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-base">
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Database</span>
                <span className="text-sm text-green-500 font-medium">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">API</span>
                <span className="text-sm text-green-500 font-medium">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Storage</span>
                <span className="text-sm text-yellow-500 font-medium">
                  75% Used
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="bg-surface rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-base">
              Recent Activity
            </h3>
            <div className="text-sm text-muted">
              <p>Last login: 2 hours ago</p>
              <p>Users registered today: {stats?.newUsersToday ?? 0}</p>
              <p>Documents uploaded: {stats?.documentsToday ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHomePage;
