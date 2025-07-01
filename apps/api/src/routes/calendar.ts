import express from 'express';
import { Request, Response } from 'express';
import CalendarEvent, { ICalendarEvent } from '../models/CalendarEvent';
import auth from '../middleware/auth'; // Assuming you have an auth middleware

const router = express.Router();

// @route   POST /api/calendar
// @desc    Create a new calendar event
// @access  Private
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { title, description, startDate, endDate, location, participants, isPrivate } = req.body;

    const newEvent: ICalendarEvent = new CalendarEvent({
      title,
      description,
      startDate,
      endDate,
      location,
      participants,
      createdBy: req.user.id, // req.user.id comes from the auth middleware
      isPrivate,
    });

    const event = await newEvent.save();
    res.status(201).json(event);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/calendar
// @desc    Get all calendar events (public and user's private)
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const events = await CalendarEvent.find({
      $or: [
        { isPrivate: false }, // Public events
        { createdBy: req.user.id }, // User's private events
      ],
    }).sort({ startDate: -1 });
    res.json(events);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/calendar/:id
// @desc    Get a single calendar event by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check if event is private and not created by the current user
    if (event.isPrivate && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this event' });
    }

    res.json(event);
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/calendar/:id
// @desc    Update a calendar event
// @access  Private
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { title, description, startDate, endDate, location, participants, isPrivate } = req.body;

    let event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Ensure user owns the event
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    event = await CalendarEvent.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, startDate, endDate, location, participants, isPrivate } },
      { new: true }
    );

    res.json(event);
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/calendar/:id
// @desc    Delete a calendar event
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Ensure user owns the event
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await CalendarEvent.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Event removed' });
  } catch (err: any) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

export default router;
