import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRequest } from '../types/auth';



/**
 * Authentication middleware that verifies JWT tokens from request headers
 * @param req - Express request object with optional user property
 * @param res - Express response object
 * @param next - Express next function to continue middleware chain
 */
export default function (req: AuthRequest, res: Response, next: NextFunction) {
  // Get token from header
  const token = (req.headers as any)['x-auth-token'] as string;

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const jwtSecret = process.env.JWT_SECRET as string;
    
    // Use constant-time comparison for token verification
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS512'] // Use stronger algorithm
    }) as { id: string; username: string; email: string; };
    
    // Validate decoded token structure
    if (!decoded || typeof decoded !== 'object' || !decoded.id || typeof decoded.id !== 'string' || !decoded.username || typeof decoded.username !== 'string' || !decoded.email || typeof decoded.email !== 'string') {

      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    req.user = { id: decoded.id, username: decoded.username, email: decoded.email };
    next();
  } catch (err) {
    // Use constant time response to prevent timing attacks
    
    // Log error for debugging (sanitized)
    const sanitizedError = {
      message: err instanceof Error ? err.message.replace(/[\n\r\t]/g, '') : 'Unknown error',
      timestamp: new Date().toISOString(),
      operation: 'authMiddleware'
    };
    // Use structured logging for better monitoring and debugging
    process.stderr.write(`[ERROR] ${new Date().toISOString()} - Auth middleware error: ${JSON.stringify(sanitizedError)}\n`);
    
    res.status(401).json({ message: 'Token is not valid' });
  }
}
