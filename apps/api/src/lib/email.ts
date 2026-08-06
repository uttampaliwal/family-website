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
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (!resend) {
    logger.info(
      {
        to: mail.to,
        subject: mail.subject,
        preview: mail.text.slice(0, 120),
      },
      "[dev] email sent (Resend not configured)",
    );
    return;
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
      logger.error({ error }, "Failed to send email");
    }
  } catch (err) {
    logger.error({ err }, "Failed to send email");
  }
}

export function buildEmailLink(
  path: string,
  params: Record<string, string>,
): string {
  const base = env.WEB_ORIGIN.split(",")[0] ?? "http://localhost:5173";
  const search = new URLSearchParams(params).toString();
  return `${base}${path}?${search}`;
}