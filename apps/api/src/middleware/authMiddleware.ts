import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { logError } from "../utils/logger";

const jwtSecret = process.env.JWT_SECRET as string;

// Extend the Express Request interface to include the user property
// This is a common practice to avoid TypeScript errors when attaching properties to the request object.
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Middleware to protect routes by verifying a JWT from an httpOnly cookie.
 * It decodes the token, finds the user, and attaches the user object to the request.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token;

  if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided." });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    // Get user from the token and attach it to the request object
    // We exclude the password from the user object for security.
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user for this token not found." });
    }

    // Proceed to the next middleware or the route handler
    next();
  } catch (error) {
    logError(error as Error, "auth_middleware_token_validation");
    return res
      .status(401)
      .json({ message: "Not authorized, token verification failed." });
  }
};
