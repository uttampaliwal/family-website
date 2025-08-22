import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';

// Import routes
import authRoutes from '../../routes/auth';
import healthRoutes from '../../routes/health';
import documentRoutes from '../../routes/documents';

// Import middleware
import { errorHandler } from '../../middleware/errorHandler';
import { requestId, securityHeaders } from '../../middleware/security';

// Create test application with minimal middleware for testing
export const createTestApp = (): Express => {
  const app = express();

  // Basic middleware
  app.use(requestId);
  app.use(compression());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(securityHeaders);

  // CORS for testing
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Routes
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
};

// Test database utilities
export const cleanDatabase = async () => {
  const { default: mongoose } = await import('mongoose');
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

// Test user factory
export const createTestUser = (overrides: Record<string, unknown> = {}) => {
  return {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: '1990-01-01',
    isEmailVerified: true,
    ...overrides
  };
};

// JWT token utilities for testing
export const generateTestTokens = async (userId: string) => {
  const jwt = await import('jsonwebtoken');
  
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Mock email service for testing
export const mockEmailService = {
  sendEmail: () => Promise.resolve(true),
  sendVerificationEmail: () => Promise.resolve(true),
  sendPasswordResetEmail: () => Promise.resolve(true),
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-key-for-testing-only';
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.EMAIL_USER = 'test@example.com';
  process.env.EMAIL_PASS = 'test-password';
  process.env.LOG_LEVEL = 'silent';

  // Mock console methods to reduce test noise
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  
  return { originalLog, originalWarn, originalError };
};

// Cleanup test environment
export const cleanupTestEnvironment = (originals?: { originalLog: typeof console.log; originalWarn: typeof console.warn; originalError: typeof console.error }) => {
  if (originals) {
    console.log = originals.originalLog;
    console.warn = originals.originalWarn;
    console.error = originals.originalError;
  }
};