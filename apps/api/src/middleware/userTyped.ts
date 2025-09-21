import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User.js";

export const userTyped = (req: Request, res: Response, next: NextFunction) => {
  req.user = req.user as IUser;
  next();
};
