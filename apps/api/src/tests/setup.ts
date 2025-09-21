import { jest } from "@jest/globals";

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret-for-testing";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.EMAIL_USER = "test@example.com";
process.env.EMAIL_PASS = "test-password";
process.env.MONGO_APP_USERNAME = "test-user";
process.env.MONGO_APP_PASSWORD = "test-password";
process.env.PORT = "3001";

// Mock console methods to reduce test noise (for Jest environment only)
// These functions are available in Jest test environment

// Global test utilities interface
interface MockRequest {
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  cookies?: Record<string, unknown>;
  method?: string;
  url?: string;
}

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
  redirect: jest.Mock;
}

interface TestUtils {
  createMockRequest: (overrides?: Partial<MockRequest>) => MockRequest;
  createMockResponse: (overrides?: Partial<MockResponse>) => MockResponse;
  createMockNext: () => jest.Mock;
}

declare global {
  var testUtils: TestUtils;
}

// Mock request/response helpers
global.testUtils = {
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    method: "GET",
    url: "/",
    ...overrides,
  }),

  createMockResponse: (overrides = {}) => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      ...overrides,
    };
    return res;
  },

  createMockNext: () => jest.fn(),
};
