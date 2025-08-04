import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { isHttpError } from 'http-errors';
import { sanitizeLog } from '../utils/logSanitizer';

/**
 * A custom error interface to ensure statusCode is available.
 * This is optional but good practice.
 */
export const errorHandler = (err: Error, req: ExpressRequest, res: ExpressResponse) => {
  // In development, or for non-http errors, log the full error
  if (process.env.NODE_ENV !== 'production' || !isHttpError(err)) {
    const sanitizedError = {
      name: err.name?.replace(/[\n\r\t]/g, '') || 'Unknown',
      message: err.message?.replace(/[\n\r\t]/g, '') || 'Unknown error',
      stack: err.stack?.replace(/[\n\r\t]/g, ' ') || 'No stack trace'
    };
    // Use structured logging with appropriate log level
    const logEntry = {
      level: 'error',
      timestamp: new Date().toISOString(),
      ...sanitizedError,
      url: sanitizeLog(String(req.url || '')),
      method: sanitizeLog(String(req.method || '')),
      userAgent: sanitizeLog(req.get('User-Agent') || 'Unknown')
    };
    console.error(JSON.stringify(logEntry));
  }

  // If it's an HttpError from the http-errors package, use its properties
  // Otherwise, default to 500 Internal Server Error
  const statusCode = isHttpError(err) ? err.statusCode : 500;
  const message = isHttpError(err) ? err.message : 'Internal Server Error';

  // Don't leak stack trace in production for client-facing errors
  const errorResponse: { message: string; stack?: string } = {
    message: String(message).replace(/[<>"'&]/g, ''),
  };

  // Add stack trace in development mode
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.stack = err.stack.replace(/[\n\r\t]/g, ' ');
  }

  // Ensure response hasn't been sent already
  if (!res.headersSent) {
    try {
      res.status(statusCode).json(errorResponse);
    } catch (responseError) {
      const errorLog = {
        level: 'ERROR',
        message: 'Failed to send JSON error response',
        error: sanitizeLog(responseError instanceof Error ? responseError.message : String(responseError)),
        timestamp: new Date().toISOString()
      };
      console.error(JSON.stringify(errorLog));
      
      // Fallback: send a basic text response
      try {
        res.status(500).send('Internal Server Error');
      } catch (fallbackError) {
        const fallbackLog = {
          level: 'CRITICAL',
          message: 'Failed to send fallback error response',
          error: sanitizeLog(fallbackError instanceof Error ? fallbackError.message : String(fallbackError)),
          timestamp: new Date().toISOString()
        };
        console.error(JSON.stringify(fallbackLog));
        
        // Last resort: end the response
        try {
          res.end();
        } catch (endError) {
          console.error(JSON.stringify({
            level: 'FATAL',
            message: 'Failed to end response',
            error: sanitizeLog(endError instanceof Error ? endError.message : String(endError)),
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }
};