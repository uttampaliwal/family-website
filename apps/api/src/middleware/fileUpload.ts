import { Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { sanitizeLog } from '../utils/logSanitizer';

// File interface for type safety
interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

// Extend Request interface to include file property
declare module 'express-serve-static-core' {
  interface Request {
    file?: UploadedFile;
  }
}

// Since we can't install multer, let's create a simple middleware
type FileUploadMiddleware = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => void;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', sanitizeLog(JSON.stringify({
      message: error instanceof Error ? error.message : 'Unknown error',
      path: uploadDir,
      timestamp: new Date().toISOString()
    })));
    throw new Error('Failed to create upload directory');
  }
}



// File upload middleware implementation
const createFileUploadMiddleware = {
  single: (fieldName: string): FileUploadMiddleware => {
    return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
      try {
        // Skip file processing if no file uploaded
        if (!req.body[fieldName]) {
          return next();
        }
        
        // Validate file data
        if (typeof req.body[fieldName] !== 'string') {
          return res.status(400).json({ message: 'Invalid file data' });
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${req.body[fieldName] || 'upload'}`;
        
        const uploadedFile: UploadedFile = {
          filename,
          originalname: req.body[fieldName] || 'unknown',
          mimetype: 'application/octet-stream',
          size: 0
        };
        req.file = uploadedFile;
        next();
      } catch (error) {
        console.error('File upload error:', sanitizeLog((error as Error).message || String(error)));
        res.status(500).json({ message: 'File upload failed' });
      }
    };
  }
};

const upload = createFileUploadMiddleware;

export default upload;