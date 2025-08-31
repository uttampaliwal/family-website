import React, { useState, useEffect } from "react";
import api from "../services/axios";
import type { IUser } from "../../../api/src/models/User";

const AdminDashboardPage: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const response = await api.get("/api/admin/pending-users");
        setPendingUsers(response.data);
      } catch {
        setError("Failed to load pending users.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/approve`);
      setPendingUsers(
        pendingUsers.filter((user) => user._id.toString() !== userId),
      );
    } catch {
      setError("Failed to approve user.");
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/reject`);
      setPendingUsers(
        pendingUsers.filter((user) => user._id.toString() !== userId),
      );
    } catch {
      setError("Failed to reject user.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <h2 className="text-xl font-semibold mb-2">Pending Approvals</h2>
      <div className="space-y-4">
        {pendingUsers.length > 0 ? (
          pendingUsers.map((user) => (
            <div
              key={user._id.toString()}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p>
                  <strong>Name:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Username:</strong> {user.username}
                </p>
                <p>
                  <strong>Relationship:</strong> {user.relationship}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleApprove(user._id.toString())}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(user._id.toString())}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No users are currently pending approval.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
