import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import { useAuth } from "../../hooks/useAuth";

Chart.register(...registerables);

// Access denied component for non-admin users
const AccessDenied: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md text-center">
      <div className="text-red-500 text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600">
        This monitoring dashboard is restricted to administrators only.
      </p>
    </div>
  </div>
);

interface SystemMetrics {
  timestamp: string;
  system: {
    status: string;
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
      usagePercentage: number;
      rss: number;
      external: number;
    };
    platform: string;
    nodeVersion: string;
    pid: number;
  };
  database: {
    status: string;
    state: string;
    host?: string;
    name?: string;
  };
  performance: {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRequests: number;
    requestsPerSecond: number;
    errorRate: number;
    slowRequestRate: number;
  };
  cache: {
    total: number;
    active: number;
    expired: number;
    hitRate: number;
  };
  alerts: Array<{
    type: string;
    category: string;
    message: string;
    severity: string;
    threshold: number | string;
    current: number | string;
  }>;
}

interface RealtimeMetrics {
  timestamp: number;
  memory: number;
  requests: number;
  responseTime: number;
  errorRate: number;
  rps: number;
}

const MonitoringDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Check if user is admin before initializing any hooks
  if (!user || user.role !== "admin") {
    return <AccessDenied />;
  }

  return <MonitoringDashboard />;
};

// Main dashboard component (only rendered for admin users)
const MonitoringDashboard: React.FC = () => {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState<SystemMetrics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const memoryChartRef = useRef<HTMLCanvasElement>(null);
  const performanceChartRef = useRef<HTMLCanvasElement>(null);
  const memoryChart = useRef<Chart | null>(null);
  const performanceChart = useRef<Chart | null>(null);

  const [memoryData, setMemoryData] = useState<number[]>([]);
  const [performanceData, setPerformanceData] = useState<
    Array<{ rps: number; responseTime: number }>
  >([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);

  const maxDataPoints = 20;

  // Initialize charts
  const initCharts = () => {
    if (memoryChartRef.current && !memoryChart.current) {
      const ctx = memoryChartRef.current.getContext("2d");
      if (ctx) {
        memoryChart.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: [],
            datasets: [
              {
                label: "Memory Usage (MB)",
                data: [],
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Memory (MB)",
                },
              },
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
            },
          },
        });
      }
    }

    if (performanceChartRef.current && !performanceChart.current) {
      const ctx = performanceChartRef.current.getContext("2d");
      if (ctx) {
        performanceChart.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: [],
            datasets: [
              {
                label: "Requests/sec",
                data: [],
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                yAxisID: "y",
                tension: 0.4,
              },
              {
                label: "Avg Response Time (ms)",
                data: [],
                borderColor: "#f59e0b",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                yAxisID: "y1",
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                type: "linear",
                display: true,
                position: "left",
                title: {
                  display: true,
                  text: "Requests/sec",
                },
              },
              y1: {
                type: "linear",
                display: true,
                position: "right",
                title: {
                  display: true,
                  text: "Response Time (ms)",
                },
                grid: {
                  drawOnChartArea: false,
                },
              },
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
            },
          },
        });
      }
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashboardResponse, metricsResponse] = await Promise.all([
        fetch("/api/monitoring/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("/api/monitoring/metrics", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      console.log("Dashboard response status:", dashboardResponse.status);
      console.log("Metrics response status:", metricsResponse.status);

      if (!dashboardResponse.ok) {
        const errorText = await dashboardResponse.text();
        console.error("Dashboard API error:", errorText);
        throw new Error(
          `Dashboard API error: ${dashboardResponse.status} - ${errorText}`,
        );
      }

      if (!metricsResponse.ok) {
        const errorText = await metricsResponse.text();
        console.error("Metrics API error:", errorText);
        throw new Error(
          `Metrics API error: ${metricsResponse.status} - ${errorText}`,
        );
      }

      const dashboardData = await dashboardResponse.json();
      const metricsData = await metricsResponse.json();

      console.log("Dashboard data received:", dashboardData);
      console.log("Metrics data received:", metricsData);

      setDashboardData(dashboardData);
      updateCharts(metricsData);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      console.error("Failed to fetch dashboard data:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Update charts with new metrics
  const updateCharts = (metrics: RealtimeMetrics) => {
    const now = new Date().toLocaleTimeString();

    // Update memory chart
    setMemoryData((prev) => {
      const newData = [...prev, metrics.memory];
      if (newData.length > maxDataPoints) {
        newData.shift();
      }
      return newData;
    });

    // Update performance data
    setPerformanceData((prev) => {
      const newData = [
        ...prev,
        { rps: metrics.rps, responseTime: metrics.responseTime },
      ];
      if (newData.length > maxDataPoints) {
        newData.shift();
      }
      return newData;
    });

    // Update labels
    setChartLabels((prev) => {
      const newLabels = [...prev, now];
      if (newLabels.length > maxDataPoints) {
        newLabels.shift();
      }
      return newLabels;
    });
  };

  // Update chart data when state changes
  useEffect(() => {
    if (memoryChart.current) {
      memoryChart.current.data.labels = chartLabels;
      memoryChart.current.data.datasets[0].data = memoryData;
      memoryChart.current.update("none");
    }

    if (performanceChart.current) {
      performanceChart.current.data.labels = chartLabels;
      performanceChart.current.data.datasets[0].data = performanceData.map(
        (d) => d.rps,
      );
      performanceChart.current.data.datasets[1].data = performanceData.map(
        (d) => d.responseTime,
      );
      performanceChart.current.update("none");
    }
  }, [chartLabels, memoryData, performanceData]);

  // Initialize and fetch data
  useEffect(() => {
    const initAndFetch = async () => {
      initCharts();
      await fetchDashboardData();
    };

    initAndFetch();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      clearInterval(interval);
      // Cleanup charts
      if (memoryChart.current) {
        memoryChart.current.destroy();
      }
      if (performanceChart.current) {
        performanceChart.current.destroy();
      }
    };
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "connected":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
      case "disconnected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50 text-red-800";
      case "warning":
        return "border-yellow-500 bg-yellow-50 text-yellow-800";
      default:
        return "border-blue-500 bg-blue-50 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Dashboard
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchDashboardData();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏠 System Monitoring Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time system performance and health metrics
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboardData && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* System Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      System Status
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.system.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uptime: {Math.floor(dashboardData.system.uptime / 3600)}h{" "}
                      {Math.floor((dashboardData.system.uptime % 3600) / 60)}m
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dashboardData.system.status)}`}
                  >
                    {dashboardData.system.status}
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Memory Usage
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.system.memory.heapUsed}MB
                    </p>
                    <p className="text-sm text-gray-500">
                      {dashboardData.system.memory.usagePercentage}% of{" "}
                      {dashboardData.system.memory.heapTotal}MB
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      dashboardData.system.memory.heapUsed > 400
                        ? "text-yellow-600 bg-yellow-100"
                        : "text-green-600 bg-green-100"
                    }`}
                  >
                    {dashboardData.system.memory.heapUsed > 400
                      ? "High"
                      : "Normal"}
                  </div>
                </div>
              </div>

              {/* Request Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Request Metrics
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.performance.totalRequests}
                  </p>
                  <p className="text-sm text-gray-500">
                    {dashboardData.performance.requestsPerSecond} req/sec
                  </p>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Performance
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.performance.averageResponseTime}ms
                    </p>
                    <p className="text-sm text-gray-500">
                      {dashboardData.performance.errorRate}% error rate
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      dashboardData.performance.errorRate > 5
                        ? "text-red-600 bg-red-100"
                        : "text-green-600 bg-green-100"
                    }`}
                  >
                    {dashboardData.performance.errorRate > 5
                      ? "High Errors"
                      : "Good"}
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Database Status
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.database.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dashboardData.database.name || "Connected"}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dashboardData.database.status)}`}
                  >
                    {dashboardData.database.status}
                  </div>
                </div>
              </div>

              {/* Cache Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Cache Performance
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.cache.hitRate}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {dashboardData.cache.active}/{dashboardData.cache.total}{" "}
                    active
                  </p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Memory Usage Over Time
                </h3>
                <div className="h-64">
                  <canvas ref={memoryChartRef}></canvas>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Request Rate & Response Time
                </h3>
                <div className="h-64">
                  <canvas ref={performanceChartRef}></canvas>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Alerts
              </h3>
              <div className="space-y-3">
                {dashboardData.alerts.length === 0 ? (
                  <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-green-800">No active alerts</span>
                  </div>
                ) : (
                  dashboardData.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center p-3 border-l-4 rounded-md ${getAlertColor(alert.severity)}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${
                          alert.severity === "critical"
                            ? "bg-red-500"
                            : alert.severity === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      ></div>
                      <span className="font-medium">
                        {alert.category.toUpperCase()}:
                      </span>
                      <span className="ml-2">{alert.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Auto-refresh info */}
            <div className="text-center text-sm text-gray-500 mt-6">
              Dashboard updates every 30 seconds
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboardPage;
