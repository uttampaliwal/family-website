import { Request, Response } from "express";

// Mock data for important notifications
const mockNotifications = [
  {
    id: "1",
    title: "New Feature Announcement",
    message: "We have just launched a new feature that you might like!",
    type: "info",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Scheduled Maintenance",
    message:
      "The system will be down for scheduled maintenance on Saturday at 10 PM.",
    type: "warning",
    timestamp: new Date().toISOString(),
  },
];

export const getImportantNotifications = (req: Request, res: Response) => {
  res.status(200).json(mockNotifications);
};
