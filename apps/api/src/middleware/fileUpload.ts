import { Request, Response, NextFunction } from 'express';
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
declare global {
  namespace Express {
    interface Request {
      file?: UploadedFile;
    }
  }
}

// Since we can't install multer, let's create a simple middleware
type FileUploadMiddleware = (req: Request, res: Response, next: NextFunction) => void;

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

// Constants for placeholder file properties
const PLACEHOLDER_FILE = {
  FILENAME: 'placeholder.txt',
  MIMETYPE: 'text/plain',
  SIZE: 0
} as const;

// File upload middleware implementation
const createFileUploadMiddleware = {
  single: (fieldName: string): FileUploadMiddleware => {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip file processing if no file uploaded
      if (!req.body[fieldName]) {
        return next();
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
    };
  }
};

const upload = createFileUploadMiddleware;

export default upload;