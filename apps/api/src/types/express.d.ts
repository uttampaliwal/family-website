import "express";
import { IUser } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      queryHints?: {
        useIndex?: string;
        limit?: number;
        sort?: string;
      };
      user?: IUser;
      requestId?: string;
    }
  }
}
