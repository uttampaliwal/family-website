import { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";
import { env } from "../config/environment.js";

// MongoError interface
interface MongoError extends Error {
  code?: number;
  keyValue?: { [key: string]: string };
  errors?: { [key: string]: { path: string; message: string } };
  path?: string;
  value?: string;
}

// Standardized error response interface
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

// Error types for better categorization
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  CONFLICT_ERROR = "CONFLICT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
}

// Custom error class with structured information
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorType: ErrorType;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    errorType: ErrorType = ErrorType.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isOperational = isOperational;
    this.details = details;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Standardized error response helper
export const sendErrorResponse = (
  res: Response,
  error: AppError | Error,
  requestId?: string,
): void => {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const errorType = isAppError ? error.errorType : ErrorType.INTERNAL_ERROR;

  // Log error with context
  const errorContext = {
    message: error.message,
    statusCode,
    errorType,
    requestId,
    stack: env.NODE_ENV === "development" ? error.stack : undefined,
    details: isAppError ? error.details : undefined,
  };

  if (statusCode >= 500) {
    logger.error(errorContext, "Internal server error");
  } else {
    logger.warn(errorContext, "Client error");
  }

  // Prepare response
  const errorResponse: ErrorResponse = {
    success: false,
    message: error.message,
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Add error type and details in development
  if (env.NODE_ENV === "development") {
    errorResponse.error = errorType;
    if (isAppError && error.details) {
      errorResponse.details = error.details;
    }
  }

  res.status(statusCode).json(errorResponse);
};

// Database error handler
export const handleDatabaseError = (error: MongoError): AppError => {
  if (error.code === 11000 && error.keyValue) {
    // MongoDB duplicate key error
    const field = Object.keys(error.keyValue)[0];
    return new AppError(
      `${field} already exists`,
      409,
      ErrorType.CONFLICT_ERROR,
      true,
      { field, value: error.keyValue[field] },
    );
  }

  if (error.name === "ValidationError" && error.errors) {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    return new AppError(
      "Validation failed",
      400,
      ErrorType.VALIDATION_ERROR,
      true,
      { errors },
    );
  }

  if (error.name === "CastError") {
    return new AppError(
      `Invalid ${error.path}: ${error.value}`,
      400,
      ErrorType.VALIDATION_ERROR,
    );
  }

  // Generic database error
  return new AppError(
    "Database operation failed",
    500,
    ErrorType.DATABASE_ERROR,
    false,
  );
};

// Validation error helper
export const createValidationError = (
  message: string,
  details?: unknown,
): AppError => {
  return new AppError(message, 400, ErrorType.VALIDATION_ERROR, true, details);
};

// Authentication error helper
export const createAuthError = (
  message: string = "Authentication failed",
): AppError => {
  return new AppError(message, 401, ErrorType.AUTHENTICATION_ERROR);
};

// Authorization error helper
export const createAuthorizationError = (
  message: string = "Access denied",
): AppError => {
  return new AppError(message, 403, ErrorType.AUTHORIZATION_ERROR);
};

// Not found error helper
export const createNotFoundError = (
  resource: string = "Resource",
): AppError => {
  return new AppError(`${resource} not found`, 404, ErrorType.NOT_FOUND_ERROR);
};

// Rate limit error helper
export const createRateLimitError = (
  message: string = "Too many requests",
): AppError => {
  return new AppError(message, 429, ErrorType.RATE_LIMIT_ERROR);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Global error handler
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  // Handle operational errors
  if (error instanceof AppError && error.isOperational) {
    return sendErrorResponse(res, error, req.requestId);
  }

  // Handle database errors
  if (
    error.name &&
    ["ValidationError", "CastError", "MongoError"].includes(error.name)
  ) {
    const appError = handleDatabaseError(error);
    return sendErrorResponse(res, appError, req.requestId);
  }

  // Handle unexpected errors
  logger.fatal(
    {
      message: error.message,
      stack: error.stack,
      requestId: req.requestId,
    },
    "Unexpected error",
  );

  const internalError = new AppError(
    env.NODE_ENV === "production" ? "Something went wrong" : error.message,
    500,
    ErrorType.INTERNAL_ERROR,
    false,
  );

  sendErrorResponse(res, internalError, req.requestId);
};
