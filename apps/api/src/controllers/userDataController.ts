import { Request, Response } from 'express';
import UserData from '../models/UserData';
import User from '../models/User';
import mongoose from 'mongoose';

// Helper function to check if ObjectId is valid
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Get all user data for a specific user
export const getUserData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const userData = await UserData.findOne({ userId: String(userId) });

    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    // Sanitize userData before returning to prevent XSS
    const sanitizedUserData = {
      ...userData.toObject(),
      events: userData.events?.map(event => ({
        ...event,
        title: String(event.title || '').replace(/[<>"'&]/g, ''),
        description: String(event.description || '').replace(/[<>"'&]/g, '')
      })),
      emergencyContacts: userData.emergencyContacts?.map(contact => ({
        ...contact,
        name: String(contact.name || '').replace(/[<>"'&]/g, ''),
        phoneNumber: String(contact.phoneNumber || '').replace(/[<>"'&]/g, '')
      }))
    };
    
    res.status(200).json(sanitizedUserData);
  } catch (error) {
    const sanitizedError = {
      message: error instanceof Error ? error.message.replace(/[\n\r\t]/g, '') : 'Unknown error',
      userId: String(req.params.userId).replace(/[\n\r\t]/g, ''),
      timestamp: new Date().toISOString(),
      operation: 'getUserData'
    };
    console.error('Error fetching user data:', JSON.stringify(sanitizedError));
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update user data
export const createOrUpdateUserData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find existing user data or create new
    let userData = await UserData.findOne({ userId: String(userId) });
    
    if (!userData) {
      userData = new UserData({ userId });
    }

    // Update fields based on request body
    if (req.body.events) userData.events = req.body.events;
    if (req.body.photos) userData.photos = req.body.photos;
    if (req.body.tasks) userData.tasks = req.body.tasks;
    if (req.body.emergencyContacts) userData.emergencyContacts = req.body.emergencyContacts;

    await userData.save();
    
    // Sanitize userData before returning to prevent XSS
    const sanitizedUserData = {
      ...userData.toObject(),
      events: userData.events?.map(event => ({
        ...event,
        title: String(event.title || '').replace(/[<>"'&]/g, ''),
        description: String(event.description || '').replace(/[<>"'&]/g, '')
      })),
      emergencyContacts: userData.emergencyContacts?.map(contact => ({
        ...contact,
        name: String(contact.name || '').replace(/[<>"'&]/g, ''),
        phone: String(contact.phone || '').replace(/[<>"'&]/g, '')
      }))
    };
    
    res.status(200).json({ message: 'User data updated successfully', userData: sanitizedUserData });
  } catch (error) {
    const sanitizedError = {
      message: error instanceof Error ? error.message.replace(/[\n\r\t]/g, '') : 'Unknown error',
      userId: String(req.params.userId).replace(/[\n\r\t]/g, ''),
      timestamp: new Date().toISOString(),
      operation: 'createOrUpdateUserData'
    };
    console.error('Error updating user data:', JSON.stringify(sanitizedError));
    res.status(500).json({ message: 'Server error' });
  }
};

// Add an event
export const addEvent = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const rawEventData = req.body;
    
    // Sanitize event data to prevent XSS
    const eventData = {
      ...rawEventData,
      title: String(rawEventData.title || '').replace(/[<>"'&]/g, ''),
      description: String(rawEventData.description || '').replace(/[<>"'&]/g, ''),
      location: String(rawEventData.location || '').replace(/[<>"'&]/g, '')
    };
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({ userId, events: [eventData] });
    } else {
      userData.events.push(eventData);
    }

    await userData.save();
    
    res.status(201).json({ 
      message: 'Event added successfully', 
      event: userData.events[userData.events.length - 1] 
    });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add a photo
export const addPhoto = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const rawPhotoData = req.body;
    
    // Sanitize photo data to prevent XSS
    const photoData = {
      ...rawPhotoData,
      title: String(rawPhotoData.title || '').replace(/[<>"'&]/g, ''),
      description: String(rawPhotoData.description || '').replace(/[<>"'&]/g, ''),
      caption: String(rawPhotoData.caption || '').replace(/[<>"'&]/g, '')
    };
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({ userId, photos: [photoData] });
    } else {
      userData.photos.push(photoData);
    }

    await userData.save();
    
    res.status(201).json({ 
      message: 'Photo added successfully', 
      photo: userData.photos[userData.photos.length - 1] 
    });
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add a task
export const addTask = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const rawTaskData = req.body;
    
    // Sanitize task data to prevent XSS
    const taskData = {
      ...rawTaskData,
      title: String(rawTaskData.title || '').replace(/[<>"'&]/g, ''),
      description: String(rawTaskData.description || '').replace(/[<>"'&]/g, ''),
      notes: String(rawTaskData.notes || '').replace(/[<>"'&]/g, '')
    };
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    let userData = await UserData.findOne({ userId: String(userId) });
    
    if (!userData) {
      userData = new UserData({ userId, tasks: [taskData] });
    } else {
      userData.tasks.push(taskData);
    }

    await userData.save();
    
    // Sanitize task before returning to prevent XSS
    const lastTask = userData.tasks[userData.tasks.length - 1];
    const sanitizedTask = {
      ...lastTask,
      title: String(lastTask.title || '').replace(/[<>"'&]/g, ''),
      description: String(lastTask.description || '').replace(/[<>"'&]/g, ''),
      notes: String(lastTask.notes || '').replace(/[<>"'&]/g, '')
    };
    
    res.status(201).json({ 
      message: 'Task added successfully', 
      task: sanitizedTask 
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add an emergency contact
export const addEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const rawContactData = req.body;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Sanitize contact data to prevent XSS
    const contactData = {
      ...rawContactData,
      name: String(rawContactData.name || '').replace(/[<>"'&]/g, ''),
      phone: String(rawContactData.phone || '').replace(/[<>"'&]/g, ''),
      email: String(rawContactData.email || '').replace(/[<>"'&]/g, ''),
      relationship: String(rawContactData.relationship || '').replace(/[<>"'&]/g, '')
    };

    let userData = await UserData.findOne({ userId: String(userId) });
    
    if (!userData) {
      userData = new UserData({ userId: String(userId), emergencyContacts: [contactData] });
    } else {
      userData.emergencyContacts.push(contactData);
    }

    await userData.save();
    
    // Sanitize contact before returning to prevent XSS
    const lastContact = userData.emergencyContacts[userData.emergencyContacts.length - 1];
    const sanitizedContact = {
      ...lastContact,
      name: String(lastContact.name || '').replace(/[<>"'&]/g, ''),
      phone: String(lastContact.phone || '').replace(/[<>"'&]/g, ''),
      email: String(lastContact.email || '').replace(/[<>"'&]/g, ''),
      relationship: String(lastContact.relationship || '').replace(/[<>"'&]/g, '')
    };
    
    res.status(201).json({ 
      message: 'Emergency contact added successfully', 
      contact: sanitizedContact 
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};