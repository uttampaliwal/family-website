import { Request, Response } from "express";
import CalendarEvent from "../models/CalendarEvent";
import { IUser } from "../models/User";

export const getEvents = async (req: Request, res: Response) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: "Month and year are required" });
  }

  try {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const events = await CalendarEvent.find({
      startDate: { $gte: startDate, $lte: endDate },
    }).populate("createdBy", "name avatar");

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching events", error });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  const {
    title,
    description,
    startDate,
    endDate,
    location,
    participants,
    category,
    color,
  } = req.body;
  const user = req.user as IUser;

  try {
    const newEvent = new CalendarEvent({
      title,
      description,
      startDate,
      endDate,
      location,
      participants,
      category,
      color,
      createdBy: user._id,
    });

    await newEvent.save();
    return res.status(201).json(newEvent);
  } catch (error) {
    return res.status(500).json({ message: "Error creating event", error });
  }
};
