import { Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express';
import crypto from 'crypto';

export const generateCsrfToken = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): void => {
  if (!req.cookies?.['XSRF-TOKEN']) {
    const csrfToken = crypto.randomBytes(32).toString('base64');
    res.cookie('XSRF-TOKEN', csrfToken, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  }
  next();
};

