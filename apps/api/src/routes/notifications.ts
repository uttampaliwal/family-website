import { Router } from "express";
import { getImportantNotifications } from "../controllers/notificationsController";

const router = Router();

router.get("/important", getImportantNotifications);

export default router;
