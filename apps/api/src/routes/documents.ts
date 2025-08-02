import express, { RequestHandler } from 'express';

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
import { validateCsrfToken } from '../middleware/csrf';
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
router.post('/', validateCsrfToken as RequestHandler, upload.single('file'), createDocument);

// Update a document
router.put('/:id', validateCsrfToken as RequestHandler, updateDocument);

// Delete a document
router.delete('/:id', validateCsrfToken as RequestHandler, deleteDocument);

// Share a document
router.post('/:id/share', validateCsrfToken as RequestHandler, shareDocument);

// Download a document file
router.get('/:id/download', downloadFile);

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

export default router;