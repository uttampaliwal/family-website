import express from 'express';

import { 
  getUserData, 
  createOrUpdateUserData, 
  addEvent, 
  addPhoto, 
  addTask, 
  addEmergencyContact 
} from '../controllers/userDataController';
import authMiddleware from '../middleware/authMiddleware';
import { validateCsrfToken } from '../middleware/csrf';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get user data
router.get('/:userId', getUserData);

// Create or update user data
router.put('/:userId', validateCsrfToken, createOrUpdateUserData);

// Add an event
router.post('/:userId/events', validateCsrfToken, addEvent);

// Add a photo
router.post('/:userId/photos', validateCsrfToken, addPhoto);

// Add a task
router.post('/:userId/tasks', validateCsrfToken, addTask);

// Add an emergency contact
router.post('/:userId/emergency-contacts', validateCsrfToken, addEmergencyContact);

export default router;