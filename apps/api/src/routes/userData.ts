import express from 'express';
import csrf from 'csurf';
import csrf from 'csurf';
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

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' } });

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' } });

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get user data
router.get('/:userId', getUserData);

// Create or update user data
router.put('/:userId', createOrUpdateUserData);

// Add an event
router.post('/:userId/events', csrfProtection, addEvent);

// Add a photo
router.post('/:userId/photos', addPhoto);

// Add a task
router.post('/:userId/tasks', addTask);

// Add an emergency contact
router.post('/:userId/emergency-contacts', csrfProtection, addEmergencyContact);

export default router;