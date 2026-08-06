import { logger } from "./logger.js";

/**
 * In-memory pub/sub for SSE. Subscribers are `WriteSSE`-style callbacks
 * provided by each open stream; messages are pushed immediately. This is a
 * single-process (or single-Vercel-function) session store — good enough for
 * the family scale, where history requests on reconnect are the source of truth.
 */

type Subscriber = (payload: string) => void;

const subscribers = new Set<Subscriber>();

export function subscribeChat(subscriber: Subscriber): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

/**
 * Pushes a raw JSON payload to every subscriber. The stream layer owns the
 * `data: ` SSE framing (writeSSE), so no prefix here.
 */
export function publishChatEvent(event: unknown): void {
  const payload = JSON.stringify(event);
  for (const subscriber of subscribers) {
    try {
      subscriber(payload);
    } catch (err) {
      logger.warn({ err }, "Dropping a chat SSE subscriber");
      subscribers.delete(subscriber);
    }
  }
}

export function subscriberCount(): number {
  return subscribers.size;
}

// ─── Per-recipient notifications ────────────────────────────────────
// Each subscriber belongs to one user's stream, so a published event only
// reaches that user's open connections.

const notificationSubscribers = new Map<string, Set<Subscriber>>();

export function subscribeNotifications(
  userId: string,
  subscriber: Subscriber,
): () => void {
  let set = notificationSubscribers.get(userId);
  if (!set) {
    set = new Set();
    notificationSubscribers.set(userId, set);
  }
  set.add(subscriber);
  return () => {
    set.delete(subscriber);
    if (set.size === 0) notificationSubscribers.delete(userId);
  };
}

export function publishNotificationEvent(userId: string, event: unknown): void {
  const set = notificationSubscribers.get(userId);
  if (!set) return;
  const payload = JSON.stringify(event);
  for (const subscriber of set) {
    try {
      subscriber(payload);
    } catch (err) {
      logger.warn({ err }, "Dropping a notification SSE subscriber");
      set.delete(subscriber);
    }
  }
}