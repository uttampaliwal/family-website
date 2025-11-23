import express from "express";

import {
  getUserData,
  createOrUpdateUserData,
  addEvent,
  addPhoto,
  addTask,
  addEmergencyContact,
} from "../controllers/userDataController.js";
import { protect as authMiddleware } from "../middleware/authMiddleware";
import { csrfProtection } from "../middleware/csrfGenerator.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes
// Get user data
router.get("/:userId", getUserData);

// Create or update user data
router.put("/:userId", ...csrfProtection, createOrUpdateUserData);

// Add an event
router.post("/:userId/events", ...csrfProtection, addEvent);

// Add a photo
router.post("/:userId/photos", ...csrfProtection, addPhoto);

// Add a task
router.post("/:userId/tasks", ...csrfProtection, addTask);

// Add an emergency contact
router.post(
  "/:userId/emergency-contacts",
  ...csrfProtection,
  addEmergencyContact,
);

export default router;
