import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/axios";
import { motion } from "framer-motion";
import { FaUsers, FaTrash } from "react-icons/fa";
import { format } from "date-fns";

// --- Type Definitions ---
interface User {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

// --- API Fetching Functions ---
const fetchAdminUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/api/admin/users");
  return data;
};

const fetchPendingUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/api/admin/pending-users");
  return data;
};

const fetchRejectedUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/api/admin/rejected-users");
  return data;
};

const updateUserRole = async ({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) => {
  const { data } = await api.put(`/api/admin/users/${userId}/role`, { role });
  return data;
};

const deleteUser = async (userId: string) => {
  await api.delete(`/api/admin/users/${userId}`);
};

// --- Sub-components ---
interface UserTableProps {
  users: User[];
  onRoleChange: (vars: { userId: string; role: string }) => void;
  onDeleteUser: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onRoleChange,
  onDeleteUser,
}) => (
  <div className="card p-0 overflow-hidden">
    <div className="p-4 border-b border-border">
      <h3 className="text-lg font-bold text-primary flex items-center">
        <FaUsers className="mr-2" /> User Management
      </h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface/50">
          <tr>
            <th className="p-4 font-semibold">User</th>
            <th className="p-4 font-semibold">Role</th>
            <th className="p-4 font-semibold">Joined</th>
            <th className="p-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user._id}
              className="border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors"
            >
              <td className="p-4">
                <div className="font-medium text-text-base">
                  {user.username}
                </div>
                <div className="text-xs text-muted">{user.email}</div>
              </td>
              <td className="p-4 text-muted">{user.role}</td>
              <td className="p-4 text-muted">
                {user.createdAt
                  ? format(new Date(user.createdAt), "MMM d, yyyy")
                  : "N/A"}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <select
                    defaultValue={user.role}
                    onChange={(e) =>
                      onRoleChange({ userId: user._id, role: e.target.value })
                    }
                    className="input text-xs py-1 px-2 w-28"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => onDeleteUser(user._id)}
                    className="btn-error p-2 rounded-md"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PendingUserTable: React.FC<UserTableProps> = ({
  users,
  onRoleChange,
  onDeleteUser,
}) => (
  <div className="card p-0 overflow-hidden">
    <div className="p-4 border-b border-border">
      <h3 className="text-lg font-bold text-primary flex items-center">
        <FaUsers className="mr-2" /> Pending User Requests
      </h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface/50">
          <tr>
            <th className="p-4 font-semibold">User</th>
            <th className="p-4 font-semibold">Role</th>
            <th className="p-4 font-semibold">Joined</th>
            <th className="p-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user._id}
              className="border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors"
            >
              <td className="p-4">
                <div className="font-medium text-text-base">
                  {user.username}
                </div>
                <div className="text-xs text-muted">{user.email}</div>
              </td>
              <td className="p-4 text-muted">{user.role}</td>
              <td className="p-4 text-muted">
                {user.createdAt
                  ? format(new Date(user.createdAt), "MMM d, yyyy")
                  : "N/A"}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <select
                    defaultValue={user.role}
                    onChange={(e) =>
                      onRoleChange({ userId: user._id, role: e.target.value })
                    }
                    className="input text-xs py-1 px-2 w-28"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => onDeleteUser(user._id)}
                    className="btn-error p-2 rounded-md"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const RejectedUserTable: React.FC<UserTableProps> = ({
  users,
  onRoleChange,
  onDeleteUser,
}) => (
  <div className="card p-0 overflow-hidden">
    <div className="p-4 border-b border-border">
      <h3 className="text-lg font-bold text-primary flex items-center">
        <FaUsers className="mr-2" /> Rejected User Requests
      </h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface/50">
          <tr>
            <th className="p-4 font-semibold">User</th>
            <th className="p-4 font-semibold">Role</th>
            <th className="p-4 font-semibold">Joined</th>
            <th className="p-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user._id}
              className="border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors"
            >
              <td className="p-4">
                <div className="font-medium text-text-base">
                  {user.username}
                </div>
                <div className="text-xs text-muted">{user.email}</div>
              </td>
              <td className="p-4 text-muted">{user.role}</td>
              <td className="p-4 text-muted">
                {user.createdAt
                  ? format(new Date(user.createdAt), "MMM d, yyyy")
                  : "N/A"}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <select
                    defaultValue={user.role}
                    onChange={(e) =>
                      onRoleChange({ userId: user._id, role: e.target.value })
                    }
                    className="input text-xs py-1 px-2 w-28"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => onDeleteUser(user._id)}
                    className="btn-error p-2 rounded-md"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAdminUsers,
    refetchOnWindowFocus: true,
  });

  const { data: pendingUsers, isLoading: isLoadingPendingUsers } = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: fetchPendingUsers,
    refetchOnWindowFocus: true,
  });

  const { data: rejectedUsers, isLoading: isLoadingRejectedUsers } = useQuery({
    queryKey: ["rejectedUsers"],
    queryFn: fetchRejectedUsers,
    refetchOnWindowFocus: true,
  });

  const roleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
      queryClient.invalidateQueries({ queryKey: ["rejectedUsers"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
      queryClient.invalidateQueries({ queryKey: ["rejectedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] }); // Keep this to update other stats like storage
    },
  });

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (isLoadingUsers || isLoadingPendingUsers || isLoadingRejectedUsers) {
    return <p>Loading users...</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 gap-8">
        <div>
          {users && (
            <UserTable
              users={users}
              onRoleChange={roleMutation.mutate}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </div>
        <div>
          {pendingUsers && (
            <PendingUserTable
              users={pendingUsers}
              onRoleChange={roleMutation.mutate}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </div>
        <div>
          {rejectedUsers && (
            <RejectedUserTable
              users={rejectedUsers}
              onRoleChange={roleMutation.mutate}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UserManagementPage;
