import { Request, Response } from "express";
import User from "../models/User";

export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ adminApprovalStatus: "pending" }).select(
      "-password",
    );
    return res.status(200).json(users);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching pending users", error });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.adminApprovalStatus = "approved";
    user.auditLog.push({
      event: "Admin approved account",
      timestamp: new Date(),
    });
    await user.save();
    return res.status(200).json({ message: "User approved successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error approving user", error });
  }
};

export const rejectUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.adminApprovalStatus = "rejected";
    user.auditLog.push({
      event: "Admin rejected account",
      timestamp: new Date(),
    });
    await user.save();
    return res.status(200).json({ message: "User rejected successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error rejecting user", error });
  }
};
