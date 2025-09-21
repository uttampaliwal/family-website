import React, { useState, useEffect } from "react";
import { ChatBubbleLeftRightIcon, UserIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";
import api from "../services/axios";

interface Friend {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface Chat {
  _id: string;
  participants: Array<{
    user: {
      _id: string;
      username: string;
      email: string;
    };
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: string;
  };
  lastActivity: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [selectedFriend, setSelectedFriend] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
    fetchChats();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get("/api/social/friends");
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await api.get("/api/chat");
      setChats(response.data.chats || []);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (friendId: string, friendName: string) => {
    try {
      const response = await api.post("/api/chat", {
        participants: [friendId],
        type: "direct",
      });

      const chatId = response.data.chat._id;
      setSelectedChatId(chatId);
      setSelectedFriend(friendName);

      // Refresh chats list
      fetchChats();
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const selectExistingChat = (chat: Chat) => {
    const otherParticipant = chat.participants.find(
      (p) => p.user._id !== user?.id,
    );

    setSelectedChatId(chat._id);
    setSelectedFriend(otherParticipant?.user.username || "Unknown");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-base mb-2 flex items-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 mr-3 text-primary" />
            Family Chat
          </h1>
          <p className="text-text-muted">
            Connect with your family members through real-time messaging
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          {/* Chat List / Friends List */}
          <div className="lg:col-span-1 bg-surface rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-text-base mb-4">
                Recent Chats
              </h2>
            </div>

            <div className="overflow-y-auto h-full">
              {/* Existing Chats */}
              {chats.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">
                    Recent Conversations
                  </h3>
                  {chats.map((chat) => {
                    const otherParticipant = chat.participants.find(
                      (p) => p.user._id !== user?.id,
                    );

                    return (
                      <button
                        key={chat._id}
                        onClick={() => selectExistingChat(chat)}
                        className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                          selectedChatId === chat._id
                            ? "bg-primary/10 border-primary/20"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                            <UserIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-base truncate">
                              {otherParticipant?.user.username || "Unknown"}
                            </p>
                            {chat.lastMessage && (
                              <p className="text-xs text-text-muted truncate">
                                {chat.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Friends List */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">
                  Family Members
                </h3>
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <button
                      key={friend._id}
                      onClick={() => startChat(friend._id, friend.username)}
                      className="w-full text-left p-3 rounded-lg mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center mr-3">
                          <UserIcon className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-base">
                            {friend.username}
                          </p>
                          <p className="text-xs text-text-muted">
                            {friend.email}
                          </p>
                        </div>
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-text-muted" />
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-text-muted italic">
                    No family members connected yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-surface rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {selectedChatId ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-text-base">
                    Chat with {selectedFriend}
                  </h3>
                </div>
                <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-center text-text-muted">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chat messages will appear here</p>
                    <p className="text-sm mt-2">
                      Note: Full chat functionality requires WebSocket
                      integration
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="form-input flex-1 mr-3"
                      disabled
                    />
                    <button className="btn btn-primary" disabled>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-text-muted">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold mb-2">
                    Select a conversation
                  </h3>
                  <p>Choose a family member from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-info/10 border border-info/20 rounded-lg p-6">
          <div className="flex items-start">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-info mt-1 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-text-base mb-2">
                Chat Feature Status
              </h3>
              <p className="text-text-muted mb-3">
                The family chat system is currently available through the
                floating social button and this dedicated chat page. Full
                real-time messaging functionality is ready for enhancement.
              </p>
              <div className="text-sm text-text-muted">
                <strong>Current Features:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Direct messaging between family members</li>
                  <li>Chat history and conversation management</li>
                  <li>Friend/family member discovery</li>
                  <li>Responsive design for all devices</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
