import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends email via Resend. Without an API key (local development) it logs
 * the message instead, so auth flows stay testable end-to-end.
 *
 * Returns whether the message was accepted for delivery. Callers MUST NOT
 * claim "email sent" when this returns false — audit EMAIL_DELIVERY_FAILED
 * and tell the user to retry instead.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!resend) {
    logger.info(
      {
        to: mail.to,
        subject: mail.subject,
        preview: mail.text.slice(0, 120),
      },
      "[dev] email sent (Resend not configured)",
    );
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (error) {
      logger.error(
        { to: mail.to, subject: mail.subject, error },
        "Failed to send email",
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error(
      { to: mail.to, subject: mail.subject, err },
      "Failed to send email",
    );
    return false;
  }
}

export function buildEmailLink(
  path: string,
  params: Record<string, string>,
): string {
  const base = env.WEB_ORIGIN.split(",")[0] ?? "http://localhost:5173";
  const search = new URLSearchParams(params).toString();
  if (!search) return `${base}${path}`;
  // Fragment, not query: the token never leaves the browser in HTTP
  // requests, Referer headers, or server access logs. The SPA reads it
  // from location.hash and POSTs it over HTTPS.
  return `${base}${path}#${search}`;
}
