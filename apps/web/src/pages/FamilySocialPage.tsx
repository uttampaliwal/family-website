import React, { useState, useEffect, useRef } from "react";
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ShareIcon,
  PhotoIcon,
  FaceSmileIcon,
  MapPinIcon,
  UserCircleIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../hooks/useAuth";

interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  content: string;
  images?: string[];
  location?: string;
  likes: string[];
  comments: Array<{
    _id: string;
    author: {
      _id: string;
      username: string;
    };
    content: string;
    createdAt: string;
  }>;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

interface NewPost {
  content: string;
  images: File[];
  location: string;
}

const FamilySocialPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState<NewPost>({
    content: "",
    images: [],
    location: "",
  });
  const [showNewPost, setShowNewPost] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockPosts: Post[] = [
        {
          _id: "1",
          author: {
            _id: "user1",
            username: "mom_sarah",
            email: "sarah@family.com",
          },
          content:
            "Just finished baking cookies with the kids! The house smells amazing 🍪✨ Nothing beats a Sunday afternoon in the kitchen with my little helpers.",
          images: [],
          location: "Home Kitchen",
          likes: ["user2", "user3"],
          comments: [
            {
              _id: "c1",
              author: { _id: "user2", username: "dad_mike" },
              content: "Save some for me! 😍",
              createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            },
            {
              _id: "c2",
              author: { _id: "user3", username: "emma_teen" },
              content: "They turned out so good mom! Thanks for teaching me 💕",
              createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            },
          ],
          shares: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          _id: "2",
          author: {
            _id: "user2",
            username: "dad_mike",
            email: "mike@family.com",
          },
          content:
            "Emma scored the winning goal today! So proud of our soccer star ⚽🌟 #ProudDad #SoccerSaturday",
          location: "Riverside Soccer Fields",
          likes: ["user1", "user3", "user4"],
          comments: [
            {
              _id: "c3",
              author: { _id: "user3", username: "emma_teen" },
              content: "Thanks dad! Team celebration at pizza place later? 🍕",
              createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            },
          ],
          shares: 2,
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
        {
          _id: "3",
          author: {
            _id: "user4",
            username: "grandma_rose",
            email: "rose@family.com",
          },
          content:
            "Looking through old photo albums and found this gem from Emma's first steps! Time flies so fast 👶➡️👧 Miss having everyone over for Sunday dinners.",
          likes: ["user1", "user2", "user3"],
          comments: [
            {
              _id: "c4",
              author: { _id: "user1", username: "mom_sarah" },
              content:
                "Aww mom, this brings back so many memories! We should scan all these old photos ❤️",
              createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            },
          ],
          shares: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        },
      ];

      setPosts(mockPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const isLiked = post.likes.includes(user?.id || "");
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter((id) => id !== user?.id)
                : [...post.likes, user?.id || ""],
            };
          }
          return post;
        }),
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!content.trim()) return;

    try {
      const newComment = {
        _id: `temp_${Date.now()}`,
        author: {
          _id: user?.id || "",
          username: user?.username || "",
        },
        content,
        createdAt: new Date().toISOString(),
      };

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...post.comments, newComment],
            };
          }
          return post;
        }),
      );
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;

    try {
      const post: Post = {
        _id: `temp_${Date.now()}`,
        author: {
          _id: user?.id || "",
          username: user?.username || "",
          email: user?.email || "",
        },
        content: newPost.content,
        location: newPost.location,
        likes: [],
        comments: [],
        shares: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPosts((prevPosts) => [post, ...prevPosts]);
      setNewPost({ content: "", images: [], location: "" });
      setShowNewPost(false);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-base mb-4">
            Family Feed
          </h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading family feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-text-base">Family Feed</h1>
            <p className="text-sm text-text-muted">
              Share moments with your loved ones
            </p>
          </div>
        </div>

        {/* New Post Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-surface">
          {!showNewPost ? (
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setShowNewPost(true)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-3">
                  <span className="text-text-muted">
                    What's happening with the family?
                  </span>
                </div>
                <button className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex space-x-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCircleIcon className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost.content}
                    onChange={(e) =>
                      setNewPost((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="What's happening with the family?"
                    className="w-full border-none resize-none text-xl placeholder:text-text-muted bg-transparent focus:outline-none"
                    rows={3}
                    autoFocus
                  />

                  {newPost.location && (
                    <div className="flex items-center text-sm text-text-muted mt-2">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      {newPost.location}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                      >
                        <PhotoIcon className="w-5 h-5" />
                      </button>
                      <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
                        <FaceSmileIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const location = prompt("Add location:");
                          if (location) {
                            setNewPost((prev) => ({ ...prev, location }));
                          }
                        }}
                        className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                      >
                        <MapPinIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowNewPost(false)}
                        className="px-4 py-2 text-text-muted hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPost.content.trim()}
                        className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setNewPost((prev) => ({ ...prev, images: files }));
                }}
              />
            </div>
          )}
        </div>

        {/* Posts Feed */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={user?.id || ""}
              onLike={() => handleLike(post._id)}
              onComment={handleComment}
              onToggleComments={() => toggleComments(post._id)}
              showComments={expandedComments.has(post._id)}
              formatTimeAgo={formatTimeAgo}
            />
          ))}
        </div>

        {/* Load More */}
        <div className="p-8 text-center">
          <button className="text-primary hover:underline font-medium">
            Load more posts
          </button>
        </div>
      </div>
    </div>
  );
};

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: () => void;
  onComment: (postId: string, content: string) => void;
  onToggleComments: () => void;
  showComments: boolean;
  formatTimeAgo: (date: string) => string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onToggleComments,
  showComments,
  formatTimeAgo,
}) => {
  const [commentText, setCommentText] = useState("");
  const isLiked = post.likes.includes(currentUserId);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post._id, commentText);
      setCommentText("");
    }
  };

  return (
    <article className="bg-surface hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <UserCircleIcon className="w-8 h-8 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-text-base">
                {post.author.username}
              </h3>
              <span className="text-text-muted">·</span>
              <time className="text-sm text-text-muted">
                {formatTimeAgo(post.createdAt)}
              </time>
            </div>

            {post.location && (
              <div className="flex items-center text-sm text-text-muted mt-1">
                <MapPinIcon className="w-3 h-3 mr-1" />
                {post.location}
              </div>
            )}
          </div>

          <button className="text-text-muted hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors">
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Post Content */}
        <div className="mt-3 ml-15">
          <p className="text-text-base whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          {post.images && post.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt=""
                  className="w-full h-48 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                />
              ))}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="mt-4 ml-15 flex items-center justify-between max-w-md">
          <button
            onClick={onToggleComments}
            className="flex items-center space-x-2 text-text-muted hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-full transition-colors group"
          >
            <ChatBubbleOvalLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments.length}</span>
          </button>

          <button
            onClick={onLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors group ${
              isLiked
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                : "text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            }`}
          >
            {isLiked ? (
              <HeartSolidIcon className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{post.likes.length}</span>
          </button>

          <button className="flex items-center space-x-2 text-text-muted hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 px-3 py-2 rounded-full transition-colors group">
            <ShareIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{post.shares}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 ml-15 space-y-3">
            {/* Existing Comments */}
            {post.comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCircleIcon className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-text-base text-sm">
                      {comment.author.username}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-text-base text-sm mt-1">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}

            {/* New Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 flex">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {commentText.trim() && (
                  <button
                    type="submit"
                    className="ml-2 px-4 py-2 bg-primary text-white text-sm rounded-full hover:bg-primary/90 transition-colors"
                  >
                    Post
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};

export default FamilySocialPage;
