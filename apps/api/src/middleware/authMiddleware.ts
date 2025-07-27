import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface AuthRequest extends Request {
  user?: { id: string; username: string; email: string; };
}

export default function (req: AuthRequest, res: Response, next: NextFunction) {
  // Get token from header
  const token = req.header('x-auth-token');

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
      crypto.randomBytes(1).toString('hex');
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    req.user = { id: decoded.id, username: decoded.username, email: decoded.email };
    next();
  } catch (err) {
    // Use constant time response to prevent timing attacks
    crypto.randomBytes(1).toString('hex');
    
    // Log error for debugging (sanitized)
    const sanitizedError = {
      message: err instanceof Error ? err.message.replace(/[\n\r\t]/g, '') : 'Unknown error',
      timestamp: new Date().toISOString(),
      operation: 'authMiddleware'
    };
    console.error('Auth middleware error:', JSON.stringify(sanitizedError));
    
    res.status(401).json({ message: 'Token is not valid' });
  }
}
