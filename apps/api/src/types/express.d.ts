import { Request } from 'express';

// User interface for better type safety
interface AuthenticatedUser {
  id: string;
  username?: string;
  email?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}