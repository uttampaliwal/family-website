import type { Announcement as AnnouncementPayload } from "@family/core";
import {
  createAnnouncementRequestSchema,
  updateAnnouncementRequestSchema,
} from "@family/core";
import { Hono } from "hono";
import { buildEmailLink, sendMail } from "../lib/email.js";
import { logger } from "../lib/logger.js";
import { createNotification } from "../lib/notifications.js";
import { validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import {
  originCheck,
  requireApprovedAuth,
  requireCapability,
} from "../middleware/security.js";
import { Announcement } from "../models/announcement.js";
import { User } from "../models/user.js";

export const announcementsRoutes = new Hono();

announcementsRoutes.use("*", originCheck, requireApprovedAuth);

/** Newest first. */
announcementsRoutes.get("/", async (c) => {
  const [announcements, total] = await Promise.all([
    Announcement.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("createdBy", "name username")
      .lean(),
    Announcement.countDocuments(),
  ]);

  return c.json({
    items: (announcements as unknown as PopulatedAnnouncement[]).map(
      toAnnouncementPayload,
    ),
    total,
  });
});

announcementsRoutes.get("/:id", async (c) => {
  return c.json({
    announcement: toAnnouncementPayload(
      await findPopulatedAnnouncement(c.req.param("id")),
    ),
  });
});

announcementsRoutes.post(
  "/",
  requireCapability("publishAnnouncements"),
  validateBody(createAnnouncementRequestSchema),
  async (c) => {
    const userId = c.get("userId");
    const { title, body } = c.req.valid("json");

    const announcement = await Announcement.create({
      title,
      body,
      createdBy: userId,
    });

    const author = await User.findById(userId, "name");
    void notifyMembers(userId, author?.name ?? "", title);

    return c.json({
      announcement: toAnnouncementPayload(
        await findPopulatedAnnouncement(announcement._id.toString()),
      ),
    });
  },
);

announcementsRoutes.patch(
  "/:id",
  requireCapability("publishAnnouncements"),
  validateBody(updateAnnouncementRequestSchema),
  async (c) => {
    const input = c.req.valid("json");

    const announcement = await Announcement.findById(c.req.param("id"));
    if (!announcement)
      throw new AppError(404, "NOT_FOUND", "Announcement not found");

    if (input.title !== undefined) announcement.title = input.title;
    if (input.body !== undefined) announcement.body = input.body;

    await announcement.save();
    return c.json({
      announcement: toAnnouncementPayload(
        await findPopulatedAnnouncement(announcement._id.toString()),
      ),
    });
  },
);

announcementsRoutes.delete(
  "/:id",
  requireCapability("publishAnnouncements"),
  async (c) => {
    const announcement = await Announcement.findById(c.req.param("id"));
    if (!announcement)
      throw new AppError(404, "NOT_FOUND", "Announcement not found");

    await announcement.deleteOne();
    return c.json({ ok: true });
  },
);

/**
 * Email + in-app notification for every approved member (except the author)
 * about a new announcement. Fire-and-forget: `sendMail` swallows errors, and
 * without a Resend key it only logs in development.
 */
async function notifyMembers(
  authorId: string,
  authorName: string,
  title: string,
): Promise<void> {
  try {
    const recipients = await User.find(
      { adminApprovalStatus: "approved", _id: { $ne: authorId } },
      { email: 1, name: 1, _id: 1 },
    ).lean();

    const url = buildEmailLink("/announcements", {});
    for (const member of recipients) {
      await sendMail({
        to: member.email,
        subject: `New announcement: ${title}`,
        text: `Kulaya — ${title}\n\n${url}`,
        html: `<p>Kulaya — a new family announcement:</p><p><strong>${title}</strong></p><p><a href="${url}">Read it here</a></p>`,
      });
      await createNotification({
        recipientId: member._id.toString(),
        type: "announcement",
        actorId: authorId,
        actorName: authorName,
        body: title,
        link: "/announcements",
      });
    }
  } catch (err) {
    logger.error({ err }, "Failed to notify members of announcement");
  }
}

interface PopulatedAnnouncement {
  _id: { toString(): string };
  title: string;
  body: string;
  createdBy: { _id: { toString(): string }; name: string; username: string };
  createdAt: Date;
  updatedAt: Date;
}

function toAnnouncementPayload(
  announcement: PopulatedAnnouncement,
): AnnouncementPayload {
  return {
    id: announcement._id.toString(),
    title: announcement.title,
    body: announcement.body,
    createdBy: {
      id: announcement.createdBy._id.toString(),
      name: announcement.createdBy.name,
      username: announcement.createdBy.username,
    },
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
}

async function findPopulatedAnnouncement(
  announcementId: string,
): Promise<PopulatedAnnouncement> {
  const announcement = (await Announcement.findById(announcementId)
    .populate("createdBy", "name username")
    .lean()) as unknown as PopulatedAnnouncement | null;

  if (!announcement)
    throw new AppError(404, "NOT_FOUND", "Announcement not found");
  return announcement;
}
