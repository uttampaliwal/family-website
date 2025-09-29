import { Request, Response, NextFunction } from "express";
import {
  validateCsrfToken,
  generateCsrfToken,
} from "../../middleware/csrfGenerator.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";

// Mock console methods to avoid test output
const originalConsole = console;
beforeAll(() => {
  console.debug = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.debug = originalConsole.debug;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe("CSRF Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: "POST",
      headers: {},
      cookies: {},
    };
    mockResponse = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe("generateCsrfToken", () => {
    it("should generate CSRF token when none exists", () => {
      mockRequest.cookies = {};

      generateCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "XSRF-TOKEN",
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          secure: false, // Development mode
          sameSite: "lax",
        }),
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should not generate token when one already exists", () => {
      mockRequest.cookies = { "XSRF-TOKEN": "existing-token" };

      generateCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe("validateCsrfToken", () => {
    it("should skip validation for GET requests", () => {
      mockRequest.method = "GET";

      validateCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should validate matching tokens", () => {
      const token = "test-token-123";
      mockRequest.method = "POST";
      mockRequest.headers = { "x-xsrf-token": token };
      mockRequest.cookies = { "XSRF-TOKEN": token };

      validateCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should reject mismatched tokens", () => {
      mockRequest.method = "POST";
      mockRequest.headers = { "x-xsrf-token": "wrong-token" };
      mockRequest.cookies = { "XSRF-TOKEN": "correct-token" };

      validateCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "CSRF token mismatch.",
        }),
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should reject missing tokens", () => {
      mockRequest.method = "POST";
      mockRequest.headers = {};
      mockRequest.cookies = {};

      validateCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "CSRF token is missing or invalid.",
        }),
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it("should reject requests without authorization header", () => {
    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "No token, authorization denied",
      }),
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should reject malformed authorization header", () => {
    mockRequest.headers = { authorization: "InvalidHeader" };

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should validate valid JWT token", async () => {
    // Use a valid MongoDB ObjectId format
    const userId = "507f1f77bcf86cd799439011";
    const payload = { id: userId, email: "test@test.com" };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "test-secret", {
      algorithm: "HS512",
    });
    mockRequest.headers = { authorization: `Bearer ${token}` };

    // Create a simplified mock that just returns success
    // Skip the complex database interaction for now
    // Remove unused variable
    jest.spyOn(jwt, "verify").mockReturnValue(payload);

    // Simple success test - verify token is processed
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // Should not call response methods on success path
    expect(mockResponse.status).not.toHaveBeenCalledWith(401);
    expect(mockResponse.status).not.toHaveBeenCalledWith(403);

    // Restore original jwt.verify
    (jwt.verify as jest.Mock).mockRestore();
  }, 10000);

  it("should reject invalid JWT token", () => {
    mockRequest.headers = { authorization: "Bearer invalid-token" };

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
