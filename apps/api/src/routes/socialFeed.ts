import express from "express";
import {
  getFeedPosts,
  createPost,
  toggleLike,
  addComment,
} from "../controllers/socialFeedController";
import { protect as authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/social/feed - Get social feed posts
router.get("/feed", getFeedPosts);

// POST /api/social/posts - Create a new post
router.post("/posts", createPost);

// POST /api/social/posts/:postId/like - Toggle like on a post
router.post("/posts/:postId/like", toggleLike);

// POST /api/social/posts/:postId/comments - Add comment to a post
router.post("/posts/:postId/comments", addComment);

export default router;
