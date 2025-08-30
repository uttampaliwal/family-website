import { Request, Response } from "express";
import UserData from "../models/UserData";
import User from "../models/User";
import mongoose from "mongoose";
import { sanitizeLog } from "../utils/logSanitizer";

import { htmlEncode } from "../utils/sanitization";

// Type definitions
interface Event {
  title: string;
  description?: string | null;
  date: Date;
  location?: string | null;
  participants?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

interface Task {
  title: string;
  description?: string | null;
  createdAt: Date;
  dueDate?: Date | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  assignedTo?: mongoose.Types.ObjectId[];
}

interface EmergencyContact {
  name: string;
  phoneNumber: string;
  email?: string | null;
  relationship?: string | null;
}

// Sanitization utilities
const sanitizeString = (input: unknown): string =>
  htmlEncode(String(input ?? "").replace(/[^\p{L}\p{N}\s.,-]/gu, ""));

const sanitizeEvent = (event: Event): Event => ({
  title: sanitizeString(event.title),
  description: event.description
    ? sanitizeString(event.description)
    : undefined,
  date: event.date,
  location: event.location ? sanitizeString(event.location) : undefined,
  participants: event.participants,
  createdAt: event.createdAt,
});

const sanitizeTask = (task: Task): Task => ({
  title: sanitizeString(task.title),
  description: task.description ? sanitizeString(task.description) : undefined,
  createdAt: task.createdAt,
  dueDate: task.dueDate,
  priority: task.priority,
  status: task.status,
  assignedTo: task.assignedTo,
});

const sanitizeContact = (contact: EmergencyContact): EmergencyContact => ({
  name: sanitizeString(contact.name),
  phoneNumber: sanitizeString(contact.phoneNumber),
  email: contact.email ? sanitizeString(contact.email) : undefined,
  relationship: contact.relationship
    ? sanitizeString(contact.relationship)
    : undefined,
});

// Helper function to check if ObjectId is valid
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Get all user data for a specific user
export const getUserData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const userData = await UserData.findOne({
      userId: { $eq: String(userId) },
    });

    if (!userData) {
      return res.status(404).json({ message: "User data not found" });
    }

    // Sanitize userData before returning to prevent XSS
    const sanitizedUserData = {
      ...userData.toObject(),
      events: userData.events?.map((event) => ({
        ...event,
        title: htmlEncode(String(event.title || "")),
        description: event.description
          ? htmlEncode(String(event.description))
          : undefined,
        location: event.location
          ? htmlEncode(String(event.location))
          : undefined,
      })),
      tasks: userData.tasks?.map((task) => ({
        ...task,
        title: htmlEncode(String(task.title || "")),
        description: task.description
          ? htmlEncode(String(task.description))
          : undefined,
      })),
      photos: userData.photos?.map((photo) => ({
        ...photo,
        title: photo.title ? htmlEncode(String(photo.title)) : undefined,
        description: photo.description
          ? htmlEncode(String(photo.description))
          : undefined,
        caption: photo.caption ? htmlEncode(String(photo.caption)) : undefined,
      })),
      emergencyContacts: userData.emergencyContacts?.map(sanitizeContact),
    };
    return res.status(200).json(sanitizedUserData);
  } catch (error: unknown) {
    const sanitizedError = {
      message:
        error instanceof Error
          ? htmlEncode(error.message.replace(/[\n\r\t]/g, ""))
          : "Unknown error",
      userId: htmlEncode(
        String(req.params.userId || "").replace(/[\n\r\t]/g, ""),
      ),
      timestamp: new Date().toISOString(),
      operation: "getUserData",
    };
    console.error("Error fetching user data:", JSON.stringify(sanitizedError));
    return res.status(500).json({ message: "Server error" });
  }
};

// Create or update user data
export const createOrUpdateUserData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    if (req.body.emergencyContacts)
      userData.emergencyContacts = req.body.emergencyContacts;

    await userData.save();

    // Sanitize userData before returning to prevent XSS
    const sanitizedUserData = {
      ...userData.toObject(),
      events: userData.events?.map((event) => ({
        ...event,
        title: String(event.title || "").replace(/[<>"'&]/g, ""),
        description: String(event.description || "").replace(/[<>"'&]/g, ""),
      })),
      emergencyContacts: userData.emergencyContacts?.map(sanitizeContact),
    };

    return res.status(200).json({
      message: "User data updated successfully",
      userData: sanitizedUserData,
    });
  } catch (error: unknown) {
    const sanitizedError = {
      message:
        error instanceof Error
          ? htmlEncode(error.message.replace(/[\n\r\t]/g, ""))
          : "Unknown error",
      userId: htmlEncode(String(req.params.userId).replace(/[\n\r\t]/g, "")),
      timestamp: new Date().toISOString(),
      operation: "createOrUpdateUserData",
    };
    console.error("Error updating user data:", JSON.stringify(sanitizedError));
    return res.status(500).json({ message: "Server error" });
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
      title: sanitizeString(rawEventData.title),
      description: sanitizeString(rawEventData.description),
      location: sanitizeString(rawEventData.location),
    };

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    let userData = await UserData.findOne({ userId: { $eq: String(userId) } });

    if (!userData) {
      userData = new UserData({ userId, events: [eventData] });
    } else {
      userData.events.push(eventData);
    }

    await userData.save();

    const lastEvent = userData.events[userData.events.length - 1];
    const sanitizedEvent = sanitizeEvent(lastEvent);

    return res.status(201).json({
      message: "Event added successfully",
      event: sanitizedEvent,
    });
  } catch (error: unknown) {
    console.error("Error adding event:", error);
    return res.status(500).json({
      message: "Server error",
      error: htmlEncode((error as Error).message || String(error)),
    });
  }
};

// Add a photo
export const addPhoto = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const rawPhotoData = req.body;

    // Sanitize photo data to prevent XSS
    const photoData = {
      title: sanitizeString(rawPhotoData.title),
      description: sanitizeString(rawPhotoData.description),
      caption: sanitizeString(rawPhotoData.caption),
    };

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    let userData = await UserData.findOne({ userId: { $eq: String(userId) } });

    if (!userData) {
      userData = new UserData({ userId, photos: [photoData] });
    } else {
      userData.photos.push(photoData);
    }

    await userData.save();

    const lastPhoto = userData.photos[userData.photos.length - 1];
    const sanitizedPhoto = {
      title: sanitizeString(lastPhoto.title),
      description: sanitizeString(lastPhoto.description),
      caption: sanitizeString(lastPhoto.caption),
    };
    return res.status(201).json({
      message: "Photo added successfully",
      photo: sanitizedPhoto,
    });
  } catch (error: unknown) {
    console.error("Error adding photo:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add a task
export const addTask = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const rawTaskData = req.body;

    // Sanitize task data to prevent XSS
    const taskData = sanitizeTask({
      ...rawTaskData,
      createdAt: new Date(),
      priority: rawTaskData.priority || "medium",
      status: "pending",
    });

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Sanitize userId to prevent NoSQL injection
    const sanitizedUserId = String(userId).trim();

    let userData = await UserData.findOne({ userId: sanitizedUserId });

    if (!userData) {
      userData = new UserData({ userId: sanitizedUserId, tasks: [taskData] });
    } else {
      userData.tasks.push(taskData);
    }

    await userData.save();

    // Sanitize task before returning to prevent XSS
    const lastTask = userData.tasks[userData.tasks.length - 1];
    const sanitizedTask = sanitizeTask(lastTask);

    return res.status(201).json({
      message: "Task added successfully",
      task: sanitizedTask,
    });
  } catch (error: unknown) {
    console.error("Error adding task:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add an emergency contact
export const addEmergencyContact = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const rawContactData = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Sanitize contact data to prevent XSS
    const contactData = sanitizeContact({
      name: rawContactData.name,
      phoneNumber: rawContactData.phoneNumber,
      email: rawContactData.email,
      relationship: rawContactData.relationship,
    });

    let userData = await UserData.findOne({ userId: { $eq: String(userId) } });

    if (!userData) {
      userData = new UserData({
        userId: String(userId),
        emergencyContacts: [contactData],
      });
    } else {
      userData.emergencyContacts.push(contactData);
    }

    await userData.save();

    // Sanitize contact before returning to prevent XSS
    const lastContact =
      userData.emergencyContacts[userData.emergencyContacts.length - 1];
    const sanitizedContact = sanitizeContact(lastContact);

    return res.status(201).json({
      message: "Emergency contact added successfully",
      contact: sanitizedContact,
    });
  } catch (error: unknown) {
    console.error(
      "Error adding emergency contact:",
      sanitizeLog((error as Error).message || String(error)),
    );
    return res.status(500).json({
      message: "Server error",
      error: htmlEncode((error as Error).message || String(error)),
    });
  }
};
