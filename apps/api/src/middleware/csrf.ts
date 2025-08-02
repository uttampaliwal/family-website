import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CustomRequest extends Request {
  csrfToken?: string;
}

export const generateCsrfToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('XSRF-TOKEN', token, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  req.csrfToken = token;
  next();
};

export const validateCsrfToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const clientToken = req.headers['x-xsrf-token'] as string;
  const cookieToken = req.cookies['XSRF-TOKEN'] as string;

  if (!clientToken || !cookieToken || clientToken !== cookieToken) {
    return res.status(403).json({ message: 'CSRF token mismatch' });
  }

  next();
};