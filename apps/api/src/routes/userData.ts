import express, { RequestHandler } from 'express';

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

// Routes
// Get user data
router.get('/:userId', getUserData);

// Create or update user data
router.put('/:userId', validateCsrfToken as RequestHandler, createOrUpdateUserData);

// Add an event
router.post('/:userId/events', validateCsrfToken as RequestHandler, addEvent);

// Add a photo
router.post('/:userId/photos', validateCsrfToken as RequestHandler, addPhoto);

// Add a task
router.post('/:userId/tasks', validateCsrfToken as RequestHandler, addTask);

// Add an emergency contact
router.post('/:userId/emergency-contacts', validateCsrfToken as RequestHandler, addEmergencyContact);

export default router;