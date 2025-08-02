import { Request, Response } from 'express';
import Document from '../models/Document';
import User from '../models/User';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// Get all documents for the logged-in user
export const getDocuments = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user exists
    const user = await User.findById(String(req.user.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const documents = await Document.find({
      $or: [
        { owner: String(req.user.id) },
        { sharedWith: String(req.user.id) }
      ]
    })
    .populate('owner', 'username name') // Populate owner information
    .populate('sharedWith', 'username name') // Populate shared users information
    .sort({ updatedAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Failed to retrieve documents' });
  }
};

// Get a single document by ID
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user exists
    const user = await User.findById(String(req.user.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { sharedWith: req.user.id }
      ]
    })
    .populate('owner', 'username name')
    .populate('sharedWith', 'username name');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Sanitize document data before returning
    const sanitizedDocument = {
      ...document.toObject(),
      title: String(document.title || '').replace(/[<>"'&]/g, ''),
      content: String(document.content || '').replace(/[<>"'&]/g, '')
    };
    res.status(200).json(sanitizedDocument);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new document
export const createDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user exists
    const user = await User.findById(String(req.user.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Create document object
    const documentData: any = {
      title,
      content,
      owner: req.user.id
    };

    // Handle file upload if present
    if ((req as any).file) {
      const file = (req as any).file;
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      
      documentData.fileUrl = `${baseUrl}/uploads/${file.filename}`;
      documentData.fileName = file.originalname;
      documentData.fileType = file.mimetype;
      documentData.fileSize = file.size;
    }

    const newDocument = new Document(documentData);
    await newDocument.save();
    
    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a document
export const updateDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user exists
    const user = await User.findById(String(req.user.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { title, content } = req.body;
    
    // Find document and verify ownership
    const document = await Document.findOne({
      _id: req.params.id,
      owner: String(req.user.id)
    });
    if (!document) {
      return res.status(404).json({ message: 'Document not found or you do not have permission to edit' });
    }

    // Update document
    document.title = title || document.title;
    document.content = content || document.content;
    
    await document.save();
    const sanitizedFileName = String(document.fileName || 'download').replace(/[^a-zA-Z0-9_.-]/g, '_');
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      owner: String(req.user.id)
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or you do not have permission to delete' });
    }

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download a document file
export const downloadFile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      $or: [
        { owner: String(req.user.id) },
        { sharedWith: String(req.user.id) }
      ]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.fileUrl) {
      return res.status(404).json({ message: 'No file associated with this document' });
    }

    // Extract filename from fileUrl
    const filename = document.fileUrl.split('/').pop();
    if (!filename) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set headers for file download
    const sanitizedFileName = String(document.fileName || 'download').replace(/[^a-zA-Z0-9_.-]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"`); 
    res.setHeader('Content-Type', document.fileType || 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Share a document with another user
export const shareDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify current user exists
    const currentUser = await User.findById(String(req.user.id));
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username } = req.body;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Verify target user exists
        const targetUser = await User.findOne({ username: String(username) });
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Prevent sharing with yourself
    if (targetUser._id.toString() === String(req.user.id)) {
      return res.status(400).json({ message: 'Cannot share document with yourself' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      owner: String(req.user.id)
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or you do not have permission' });
    }

    // Add user to sharedWith if not already there
    const targetUserId = targetUser._id;
    const alreadyShared = document.sharedWith.some(id => id.toString() === targetUserId.toString());
    
    if (!alreadyShared) {
      document.sharedWith.push(targetUserId);
      await document.save();
    }

    res.status(200).json({ message: 'Document shared successfully' });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};