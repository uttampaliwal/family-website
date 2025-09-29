import { Request, Response, NextFunction } from "express";
import { jest } from "@jest/globals";
import adminMiddleware, {
  adminSessionMiddleware,
} from "../../middleware/adminMiddleware.js";
import { createMockUser, createMockAdmin } from "../helpers/testDatabase.js";

// Mock dependencies
jest.mock("../../utils/logger.js");
jest.mock("../../models/User.js");

const mockRequest = (overrides: Partial<Request> = {}) =>
  ({
    user: null,
    ip: "127.0.0.1",
    path: "/admin/test",
    method: "GET",
    get: jest.fn().mockReturnValue("test-user-agent"),
    ...overrides,
  }) as unknown as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe("Admin Middleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
  });

  describe("adminMiddleware", () => {
    it("should deny access when user is not authenticated", async () => {
      req.user = null;

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny access when user is not admin", async () => {
      req.user = createMockUser({ role: "user" });

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Forbidden: Admin privileges required",
          code: "INSUFFICIENT_PRIVILEGES",
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny access when admin is not approved", async () => {
      req.user = createMockAdmin({ adminApprovalStatus: "pending" });

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Admin account not approved",
          code: "ADMIN_NOT_APPROVED",
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should allow access for approved admin", async () => {
      const adminUser = createMockAdmin({
        role: "admin",
        adminApprovalStatus: "approved",
        save: jest.fn().mockResolvedValue(true),
      });
      req.user = adminUser;

      await adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      req.user = createMockAdmin({
        save: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      await adminMiddleware(req, res, next);

      // If audit log fails, it should still continue to next()
      expect(next).toHaveBeenCalled();
    });
  });

  describe("adminSessionMiddleware", () => {
    it("should validate admin session successfully", async () => {
      const adminUser = createMockAdmin();
      req.user = adminUser;

      const User = await import("../../models/User.js");
      User.default.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(adminUser),
      });

      await adminSessionMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(adminUser);
    });

    it("should deny access when user not found in database", async () => {
      req.user = createMockAdmin();

      const User = await import("../../models/User.js");
      User.default.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await adminSessionMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User not found",
          code: "USER_NOT_FOUND",
        }),
      );
    });

    it("should deny access when admin privileges revoked", async () => {
      req.user = createMockAdmin();
      const revokedAdmin = createMockAdmin({
        role: "user", // Demoted
        adminApprovalStatus: "approved",
      });

      const User = await import("../../models/User.js");
      User.default.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(revokedAdmin),
      });

      await adminSessionMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Admin privileges revoked",
          code: "PRIVILEGES_REVOKED",
        }),
      );
    });
  });
});
