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

    const userData = await UserData.findOne({ userId });

    if (!userData) {
      return res.status(404).json({ message: 'User data not found' });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server error', error });
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
    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({ userId });
    }

    // Update fields based on request body
    if (req.body.events) userData.events = req.body.events;
    if (req.body.photos) userData.photos = req.body.photos;
    if (req.body.tasks) userData.tasks = req.body.tasks;
    if (req.body.emergencyContacts) userData.emergencyContacts = req.body.emergencyContacts;

    await userData.save();
    
    res.status(200).json({ message: 'User data updated successfully', userData });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add an event
export const addEvent = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const eventData = req.body;
    
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
    const photoData = req.body;
    
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
    const taskData = req.body;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({ userId, tasks: [taskData] });
    } else {
      userData.tasks.push(taskData);
    }

    await userData.save();
    
    res.status(201).json({ 
      message: 'Task added successfully', 
      task: userData.tasks[userData.tasks.length - 1] 
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
    const contactData = req.body;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({ userId, emergencyContacts: [contactData] });
    } else {
      userData.emergencyContacts.push(contactData);
    }

    await userData.save();
    
    res.status(201).json({ 
      message: 'Emergency contact added successfully', 
      contact: userData.emergencyContacts[userData.emergencyContacts.length - 1] 
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};