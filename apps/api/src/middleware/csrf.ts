import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const generateCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.cookies?.['XSRF-TOKEN']) {
    const csrfToken = crypto.randomBytes(32).toString('base64');
    res.cookie('XSRF-TOKEN', csrfToken, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  }
  next();
};

export const validateCsrfToken = (req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>> => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const clientToken = req.headers['x-xsrf-token'];
  const cookieToken = req.cookies?.['XSRF-TOKEN'];

  if (!clientToken || !cookieToken || typeof clientToken !== 'string' || typeof cookieToken !== 'string' || !crypto.timingSafeEqual(Buffer.from(clientToken), Buffer.from(cookieToken))) {
    return res.status(403).json({ message: 'CSRF token mismatch' });
  }

  next();
};