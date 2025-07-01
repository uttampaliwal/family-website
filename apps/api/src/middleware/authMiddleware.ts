import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
    const decoded = jwt.verify(token, jwtSecret) as { user: { id: string } };
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}
