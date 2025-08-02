import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
      file?: {
        fieldname?: string;
        originalname: string;
        encoding?: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename: string;
        path?: string;
        buffer?: Buffer;
      };
      cookies: { [key: string]: string; };
    }
  }
}