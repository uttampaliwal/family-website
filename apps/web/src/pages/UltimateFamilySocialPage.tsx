import React, { useState, useEffect } from "react";
import {
  ChatBubbleOvalLeftIcon,
  UserCircleIcon,
  PlusIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";

// Enhanced interfaces combining all features
interface FamilyMember {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  relationship?: string;
}

interface EnhancedPost {
  _id: string;
  author: FamilyMember;
  content: string;
  images?: string[];
  videos?: string[];
  location?: string;
  mood?: string;
  privacy: "family" | "close_family" | "public";
  likes: string[];
  comments: EnhancedComment[];
  shares: number;
  bookmarks: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
  reactions: {
    [key: string]: string[]; // emoji -> user_ids
  };
  type?: "text" | "photo" | "video" | "event" | "memory";
}

interface EnhancedComment {
  _id: string;
  author: FamilyMember;
  content: string;
  likes: string[];
  replies: EnhancedComment[];
  createdAt: string;
  isEdited?: boolean;
}

interface Story {
  _id: string;
  author: FamilyMember;
  media: {
    type: "image" | "video";
    url: string;
    duration?: number;
  };
  text?: string;
  createdAt: string;
  expiresAt: string;
  viewers: string[];
}

interface UltimateSettings {
  viewMode: "feed" | "grid" | "timeline";
  showStories: boolean;
  showOnlineStatus: boolean;
  enableNotifications: boolean;
  autoplayVideos: boolean;
  compactMode: boolean;
}

const UltimateFamilySocialPage: React.FC = () => {
  useAuth(); // Keep auth context active

  // Core state
  const [stories, setStories] = useState<Story[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [settings, setSettings] = useState<UltimateSettings>({
    viewMode: "feed",
    showStories: true,
    showOnlineStatus: true,
    enableNotifications: true,
    autoplayVideos: false,
    compactMode: false,
  });

  // Interactive state
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Mock comprehensive data - replace with actual API calls
      const mockFamilyMembers: FamilyMember[] = [
        {
          _id: "user_mom",
          username: "mom_sarah",
          email: "sarah@family.com",
          status: "online",
          relationship: "Mother",
        },
        {
          _id: "user_dad",
          username: "dad_mike",
          email: "mike@family.com",
          status: "online",
          relationship: "Father",
        },
        {
          _id: "user_emma",
          username: "emma_teen",
          email: "emma@family.com",
          status: "away",
          relationship: "Daughter",
        },
        {
          _id: "user_grandma",
          username: "grandma_rose",
          email: "rose@family.com",
          status: "offline",
          relationship: "Grandmother",
        },
      ];

      const mockStories: Story[] = [
        {
          _id: "story_1",
          author: mockFamilyMembers[0],
          media: {
            type: "image",
            url: "/api/placeholder/story1.jpg",
          },
          text: "Beautiful sunset from our garden! 🌅",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
          viewers: ["user_dad", "user_emma"],
        },
      ];

      const mockPosts: EnhancedPost[] = [
        {
          _id: "post_1",
          author: mockFamilyMembers[0],
          content:
            "Just finished our weekly family game night! 🎲🎯 Emma won again at Monopoly - she's definitely got the business genes! Next week we're trying that new escape room board game. Who's in? 🏠✨",
          images: [
            "/api/placeholder/gamenight1.jpg",
            "/api/placeholder/gamenight2.jpg",
          ],
          location: "Family Game Room",
          mood: "happy",
          privacy: "family",
          likes: ["user_dad", "user_emma", "user_grandma"],
          comments: [
            {
              _id: "comment_1",
              author: mockFamilyMembers[1],
              content: "I demand a rematch! That last trade was suspicious 😂",
              likes: ["user_mom"],
              replies: [],
              createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            },
          ],
          shares: 0,
          bookmarks: ["user_grandma"],
          tags: ["family-time", "games", "fun"],
          reactions: {
            "😍": ["user_dad"],
            "🎉": ["user_emma", "user_grandma"],
          },
          type: "photo",
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          _id: "post_2",
          author: mockFamilyMembers[1],
          content:
            "Emma scored the winning goal today! So proud of our soccer star ⚽🌟 #ProudDad #SoccerSaturday",
          location: "Riverside Soccer Fields",
          privacy: "family",
          likes: ["user_mom", "user_emma", "user_grandma"],
          comments: [
            {
              _id: "comment_2",
              author: mockFamilyMembers[2],
              content: "Thanks dad! Team celebration at pizza place later? 🍕",
              likes: [],
              replies: [],
              createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            },
          ],
          shares: 2,
          bookmarks: [],
          tags: ["soccer", "proud-dad", "sports"],
          reactions: {
            "⚽": ["user_mom"],
            "🎉": ["user_grandma"],
          },
          type: "text",
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
      ];

      setFamilyMembers(mockFamilyMembers);
      setStories(mockStories);
      setPosts(mockPosts);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ultimate Family Social
          </h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading ultimate family experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Ultimate Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    FamilyConnect
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ultimate Edition
                  </p>
                </div>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-4">
              {/* View Mode Selector */}
              <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { mode: "feed", icon: ListBulletIcon, label: "Feed" },
                  { mode: "grid", icon: Squares2X2Icon, label: "Grid" },
                  { mode: "timeline", icon: CalendarIcon, label: "Timeline" },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        viewMode: mode as UltimateSettings["viewMode"],
                      }))
                    }
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      settings.viewMode === mode
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:block">{label}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-full focus:ring-2 focus:ring-primary/50 text-sm w-48"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="hidden sm:block">Create</span>
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4">
          {/* Left Sidebar - Family Members & Stories */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Stories Section */}
              {settings.showStories && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Family Stories
                    </h3>
                    <button className="text-primary hover:text-primary/80 text-sm">
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Add Your Story */}
                    <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <PlusIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Share Your Story
                        </p>
                        <p className="text-xs text-gray-500">
                          Add photos or videos
                        </p>
                      </div>
                    </div>

                    {/* Family Stories */}
                    {stories.map((story) => (
                      <div
                        key={story._id}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full p-0.5">
                            <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                              <UserCircleIcon className="w-8 h-8 text-primary" />
                            </div>
                          </div>
                          {story.author.status === "online" && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {story.author.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.floor(
                              (Date.now() -
                                new Date(story.createdAt).getTime()) /
                                (1000 * 60),
                            )}
                            m ago
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Online Family Members */}
              {settings.showOnlineStatus && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Family Online
                  </h3>
                  <div className="space-y-3">
                    {familyMembers
                      .filter((member) => member.status === "online")
                      .map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center space-x-3"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                              <UserCircleIcon className="w-8 h-8 text-primary" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.relationship}
                            </p>
                          </div>
                          <button className="p-1 text-gray-400 hover:text-primary">
                            <ChatBubbleOvalLeftIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area - Coming Next */}
          <div className="lg:col-span-3">
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🚀 Ultimate Feed Coming Next!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced posts, reactions, comments, and more...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltimateFamilySocialPage;
