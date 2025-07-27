import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Since we can't install multer, let's create a simple middleware
type FileUploadMiddleware = (req: Request, res: any, next: () => void) => void;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      path: uploadDir,
      timestamp: new Date().toISOString()
    });
    throw new Error('Failed to create upload directory');
  }
}

// Constants for placeholder file properties
const PLACEHOLDER_FILE = {
  FILENAME: 'placeholder.txt',
  MIMETYPE: 'text/plain',
  SIZE: 0
} as const;

// Simple file upload middleware
const upload = {
  single: (fieldName: string): FileUploadMiddleware => {
    return (req: any, res: any, next: () => void) => {
      // Add a file property to the request with placeholder values
      req.file = {
        filename: PLACEHOLDER_FILE.FILENAME,
        originalname: PLACEHOLDER_FILE.FILENAME,
        mimetype: PLACEHOLDER_FILE.MIMETYPE,
        size: PLACEHOLDER_FILE.SIZE
      };
      next();
    };
  }
};

export default upload;