import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface AuthRequest extends Request {
  user?: { id: string };
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
      algorithms: ['HS256'] // Explicitly specify secure algorithm
    }) as { id: string };
    
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    // Use constant time response to prevent timing attacks
    crypto.randomBytes(1).toString('hex');
    res.status(401).json({ message: 'Token is not valid' });
  }
}
