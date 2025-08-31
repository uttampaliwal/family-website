import express, { Request, Response, NextFunction } from "express";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  return next();
};

router.use(authMiddleware, adminMiddleware);

router.get("/pending-users", getPendingUsers);
router.post("/users/:userId/approve", approveUser);
router.post("/users/:userId/reject", rejectUser);

export default router;
