import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/axios";
import { motion } from "framer-motion";
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
    return <p>Loading dashboard...</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<FaUsers />}
          title="Total Users"
          value={stats?.totalUsers ?? 0}
        />
        <StatCard
          icon={<FaFileAlt />}
          title="Total Documents"
          value={stats?.documentCount ?? 0}
        />
        <StatCard
          icon={<FaFileMedicalAlt />}
          title="Storage Used"
          value={`${(stats?.storageUsed / 1024 / 1024).toFixed(2)} MB`}
        />
        <StatCard
          icon={<FaShieldAlt />}
          title="Admins"
          value={stats?.adminUsers ?? 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          {activities && <ActivityLog activities={activities} />}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHomePage;
