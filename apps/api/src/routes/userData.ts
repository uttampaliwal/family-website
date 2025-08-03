import express, { RequestHandler as ExpressRequestHandler } from 'express';

import { 
  getUserData, 
  createOrUpdateUserData, 
  addEvent, 
  addPhoto, 
  addTask, 
  addEmergencyContact 
} from '../controllers/userDataController';
import authMiddleware from '../middleware/authMiddleware';
import { csrf } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes
// Get user data
router.get('/:userId', getUserData);

// Create or update user data
router.put('/:userId', csrf as ExpressRequestHandler, createOrUpdateUserData);

// Add an event
router.post('/:userId/events', csrf as ExpressRequestHandler, addEvent);

// Add a photo
router.post('/:userId/photos', csrf as ExpressRequestHandler, addPhoto);

// Add a task
router.post('/:userId/tasks', csrf as ExpressRequestHandler, addTask);

// Add an emergency contact
router.post('/:userId/emergency-contacts', csrf as ExpressRequestHandler, addEmergencyContact);

export default router;