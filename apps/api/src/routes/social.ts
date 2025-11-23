import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend,
  searchUsers,
  createGroup,
  getGroups,
  joinGroup,
  leaveGroup,
  inviteToGroup,
  getGroupMembers,
  updateGroup,
  deleteGroup,
} from "../controllers/socialController.js";
import { protect as authMiddleware } from "../middleware/authMiddleware";
import { authRateLimit } from "../middleware/security.js";

const router = express.Router();

// Apply authentication to all social routes
router.use(authMiddleware);

// Friend Management Routes
router.post("/friends/request", authRateLimit, sendFriendRequest);
router.post("/friends/accept/:requestId", authRateLimit, acceptFriendRequest);
router.post("/friends/reject/:requestId", authRateLimit, rejectFriendRequest);
router.get("/friends", getFriends);
router.get("/friends/requests", getFriendRequests);
router.delete("/friends/:friendId", authRateLimit, removeFriend);

// User Search
router.get("/users/search", searchUsers);

// Group Management Routes
router.post("/groups", authRateLimit, createGroup);
router.get("/groups", getGroups);
router.post("/groups/:groupId/join", authRateLimit, joinGroup);
router.post("/groups/:groupId/leave", authRateLimit, leaveGroup);
router.post("/groups/:groupId/invite", authRateLimit, inviteToGroup);
router.get("/groups/:groupId/members", getGroupMembers);
router.put("/groups/:groupId", authRateLimit, updateGroup);
router.delete("/groups/:groupId", authRateLimit, deleteGroup);

export default router;
