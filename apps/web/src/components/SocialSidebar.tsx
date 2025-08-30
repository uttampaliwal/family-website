import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";
import api from "../services/axios";

interface Friend {
  _id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface Group {
  _id: string;
  name: string;
  avatar?: string;
  type: string;
  members: {
    user: {
      _id: string;
      username: string;
      avatar?: string;
    };
    role: string;
  }[];
}

interface SocialSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (friendId: string, friendName: string) => void;
}

const SocialSidebar: React.FC<SocialSidebarProps> = ({
  isOpen,
  onClose,
  onStartChat,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"friends" | "groups">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchSocialData();
    }
  }, [isOpen, user]);

  const fetchSocialData = async () => {
    setLoading(true);
    try {
      const [friendsRes, groupsRes] = await Promise.all([
        api.get("/api/social/friends"),
        api.get("/api/social/groups"),
      ]);
      setFriends(friendsRes.data.friends || []);
      setGroups(groupsRes.data.groups || []);
    } catch (error) {
      console.error("Error fetching social data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-surface shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-text-base">Social</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "friends"
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-muted hover:text-text-base"
                }`}
              >
                <UserGroupIcon className="w-4 h-4 inline mr-2" />
                Friends
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "groups"
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-muted hover:text-text-base"
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2" />
                Groups
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {activeTab === "friends" && (
                    <div className="space-y-3">
                      {friends.length === 0 ? (
                        <div className="text-center py-8">
                          <UserPlusIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
                          <p className="text-text-muted">No friends yet</p>
                          <p className="text-sm text-text-muted">
                            Start connecting with family members!
                          </p>
                        </div>
                      ) : (
                        friends.map((friend) => (
                          <motion.div
                            key={friend._id}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() =>
                              onStartChat(friend._id, friend.username)
                            }
                          >
                            <div className="relative">
                              {friend.avatar ? (
                                <img
                                  src={friend.avatar}
                                  alt={friend.username}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                                  {friend.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {friend.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-surface"></div>
                              )}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="font-medium text-text-base">
                                {friend.username}
                              </p>
                              <p className="text-sm text-text-muted">
                                {friend.isOnline
                                  ? "Online"
                                  : formatLastSeen(friend.lastSeen)}
                              </p>
                            </div>
                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-text-muted" />
                          </motion.div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "groups" && (
                    <div className="space-y-3">
                      {groups.length === 0 ? (
                        <div className="text-center py-8">
                          <UserGroupIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
                          <p className="text-text-muted">No groups yet</p>
                          <p className="text-sm text-text-muted">
                            Create or join a family group!
                          </p>
                        </div>
                      ) : (
                        groups.map((group) => (
                          <motion.div
                            key={group._id}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center">
                              {group.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="font-medium text-text-base">
                                {group.name}
                              </p>
                              <p className="text-sm text-text-muted">
                                {group.members.length} members
                              </p>
                            </div>
                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-text-muted" />
                          </motion.div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full flex items-center justify-center py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Add Friends
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SocialSidebar;
