import express from 'express';

import { 
  getDocuments, 
  getDocumentById, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  shareDocument,
  downloadFile
} from '../controllers/documentController';
import authMiddleware from '../middleware/authMiddleware';
import upload from '../middleware/fileUpload';
import path from 'path';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all documents
router.get('/', getDocuments);

// Get a single document
router.get('/:id', getDocumentById);

// Create a new document
router.post('/', upload.single('file'), createDocument);

// Update a document
router.put('/:id', updateDocument);

// Delete a document
router.delete('/:id', deleteDocument);

// Share a document
router.post('/:id/share', shareDocument);

// Download a document file
router.get('/:id/download', downloadFile);

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

export default router;