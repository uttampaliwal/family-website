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

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get user data
router.get('/:userId', getUserData);

// Create or update user data
router.put('/:userId', createOrUpdateUserData);

// Add an event
router.post('/:userId/events', addEvent);

// Add a photo
router.post('/:userId/photos', addPhoto);

// Add a task
router.post('/:userId/tasks', addTask);

// Add an emergency contact
router.post('/:userId/emergency-contacts', addEmergencyContact);

export default router;