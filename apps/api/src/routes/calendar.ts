import { Router } from "express";
import { getEvents, createEvent } from "../controllers/calendarController";
import { protect as authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.get("/events", getEvents);
router.post("/events", createEvent);

export default router;
