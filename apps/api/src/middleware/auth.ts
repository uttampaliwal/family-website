import { Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express';
import crypto from 'crypto';

const validateCsrfToken = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): ExpressResponse<{ message: string }> | void => {
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

export const csrf = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction): ExpressResponse<{ message: string }> | void => {
  if (validateCsrfToken(req, res, next)) {
    return next();
  }
};