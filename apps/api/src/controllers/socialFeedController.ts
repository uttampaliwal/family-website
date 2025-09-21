import { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { IUser } from "../models/User.js";

// Mock data for social feed - replace with actual database models later
interface SocialPost {
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

// Get social feed posts
export const getFeedPosts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user as IUser;

    logger.info(
      {
        userId: user._id,
        operation: "get_social_feed",
      },
      "Fetching social feed posts",
    );

    // Mock data - replace with actual database query
    const mockPosts: SocialPost[] = [
      {
        _id: "post_1",
        author: {
          _id: "user_mom",
          username: "mom_sarah",
          email: "sarah@family.com",
        },
        content:
          "Just finished baking cookies with the kids! The house smells amazing 🍪✨ Nothing beats a Sunday afternoon in the kitchen with my little helpers.",
        location: "Home Kitchen",
        likes: ["user_dad", "user_emma"],
        comments: [
          {
            _id: "comment_1",
            author: { _id: "user_dad", username: "dad_mike" },
            content: "Save some for me! 😍",
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
        ],
        shares: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        _id: "post_2",
        author: {
          _id: "user_dad",
          username: "dad_mike",
          email: "mike@family.com",
        },
        content:
          "Emma scored the winning goal today! So proud of our soccer star ⚽🌟 #ProudDad #SoccerSaturday",
        location: "Riverside Soccer Fields",
        likes: ["user_mom", "user_emma", "user_grandma"],
        comments: [],
        shares: 2,
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ];

    res.json({
      success: true,
      posts: mockPosts,
      total: mockPosts.length,
    });

    logger.info(
      {
        userId: user._id,
        postCount: mockPosts.length,
        operation: "get_social_feed",
      },
      "Social feed posts retrieved successfully",
    );
  } catch (error) {
    logger.error(
      {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : "Unknown error",
        operation: "get_social_feed",
      },
      "Error fetching social feed posts",
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch social feed posts",
    });
  }
};

// Create a new social post
export const createPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { content, location, images } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: "Post content is required",
      });
      return;
    }

    logger.info(
      {
        userId: user._id,
        contentLength: content.length,
        hasLocation: !!location,
        imageCount: images?.length || 0,
        operation: "create_social_post",
      },
      "Creating new social post",
    );

    // Mock post creation - replace with actual database save
    const newPost: SocialPost = {
      _id: `post_${Date.now()}`,
      author: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      content: content.trim(),
      location: location || undefined,
      images: images || [],
      likes: [],
      comments: [],
      shares: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      post: newPost,
      message: "Post created successfully",
    });

    logger.info(
      {
        userId: user._id,
        postId: newPost._id,
        operation: "create_social_post",
      },
      "Social post created successfully",
    );
  } catch (error) {
    logger.error(
      {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : "Unknown error",
        operation: "create_social_post",
      },
      "Error creating social post",
    );

    res.status(500).json({
      success: false,
      message: "Failed to create post",
    });
  }
};

// Like/unlike a post
export const toggleLike = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
      return;
    }

    logger.info(
      {
        userId: user._id,
        postId,
        operation: "toggle_post_like",
      },
      "Toggling post like",
    );

    // Mock like toggle - replace with actual database update
    res.json({
      success: true,
      message: "Post like toggled successfully",
      liked: true, // This would be the actual result from database
    });

    logger.info(
      {
        userId: user._id,
        postId,
        operation: "toggle_post_like",
      },
      "Post like toggled successfully",
    );
  } catch (error) {
    logger.error(
      {
        userId: req.user?._id,
        postId: req.params.postId,
        error: error instanceof Error ? error.message : "Unknown error",
        operation: "toggle_post_like",
      },
      "Error toggling post like",
    );

    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
    });
  }
};

// Add comment to post
export const addComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { postId } = req.params;
    const { content } = req.body;

    if (!postId) {
      res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
      return;
    }

    logger.info(
      {
        userId: user._id,
        postId,
        contentLength: content.length,
        operation: "add_post_comment",
      },
      "Adding comment to post",
    );

    // Mock comment creation - replace with actual database save
    const newComment = {
      _id: `comment_${Date.now()}`,
      author: {
        _id: user._id.toString(),
        username: user.username,
      },
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      comment: newComment,
      message: "Comment added successfully",
    });

    logger.info(
      {
        userId: user._id,
        postId,
        commentId: newComment._id,
        operation: "add_post_comment",
      },
      "Comment added successfully",
    );
  } catch (error) {
    logger.error(
      {
        userId: req.user?._id,
        postId: req.params.postId,
        error: error instanceof Error ? error.message : "Unknown error",
        operation: "add_post_comment",
      },
      "Error adding comment to post",
    );

    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
};
