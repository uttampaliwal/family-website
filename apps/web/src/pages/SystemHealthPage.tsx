import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import InfoPageLayout from "../components/InfoPageLayout";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaSync,
  FaDatabase,
  FaServer,
  FaEnvelope,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

interface ServiceStatus {
  service: string;
  status: "ok" | "error";
  message: string;
}

interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  checks: ServiceStatus[];
}

const serviceIcons: { [key: string]: React.ReactElement } = {
  database: <FaDatabase className="mr-3" />,
  api: <FaServer className="mr-3" />,
  email: <FaEnvelope className="mr-3" />,
};

const fetchHealthStatus = async (): Promise<HealthResponse> => {
  const { data } = await axios.get("/api/health");
  return data;
};

const SystemHealthPage: React.FC = () => {
  const { data, isLoading, isError, error, isFetching } = useQuery<
    HealthResponse,
    Error
  >({
    queryKey: ["systemHealth"],
    queryFn: fetchHealthStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const renderStatus = () => {
    if (isLoading) {
      return <p className="text-center text-muted">Loading system status...</p>;
    }

    if (isError) {
      return (
        <div className="text-center text-destructive">
          <FaExclamationCircle className="mx-auto text-4xl mb-2" />
          <p>Error fetching system status: {error.message}</p>
        </div>
      );
    }

    if (!data || !Array.isArray(data.checks)) {
      return (
        <p className="text-center text-muted">
          Health check data is not available at the moment.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {data.checks.map((service, index) => (
          <motion.div
            key={service.service}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`p-4 rounded-lg flex items-center border ${service.status === "ok" ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}
          >
            <div
              className={`text-2xl ${service.status === "ok" ? "text-green-500" : "text-red-500"}`}
            >
              {service.status === "ok" ? (
                <FaCheckCircle />
              ) : (
                <FaExclamationCircle />
              )}
            </div>
            <div className="ml-4 flex-grow">
              <h3 className="font-bold text-lg text-primary flex items-center">
                {serviceIcons[service.service.toLowerCase()] || (
                  <FaServer className="mr-3" />
                )}
                {service.service}
              </h3>
              <p
                className={`text-sm ${service.status === "ok" ? "text-muted" : "text-destructive"}`}
              >
                {service.message}
              </p>
            </div>
            <div
              className={`font-semibold ${service.status === "ok" ? "text-green-500" : "text-red-500"}`}
            >
              {service.status === "ok" ? "Operational" : "Error"}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <InfoPageLayout title="System Health" backTo="/">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Service Status</h2>
          <div className="text-sm text-muted flex items-center">
            {isFetching && <FaSync className="animate-spin mr-2" />}
            {data
              ? `Last checked: ${formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}`
              : "Checking..."}
          </div>
        </div>
        {renderStatus()}
      </div>
    </InfoPageLayout>
  );
};

export default SystemHealthPage;
