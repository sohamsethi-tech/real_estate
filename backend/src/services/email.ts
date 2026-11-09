import nodemailer from "nodemailer";
import { config, emailConfigured } from "../config.js";
import { db } from "../db.js";

export type EmailResult =
  | { delivered: true; notificationId: string }
  | { delivered: false; reason: "not_configured" | "provider_error"; notificationId: string };

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  relatedType?: string;
  relatedId?: string;
}): Promise<EmailResult> {
  const notification = await db.notification.create({
    data: {
      channel: "email",
      toAddress: input.to,
      subject: input.subject,
      body: input.text,
      status: "QUEUED",
      relatedType: input.relatedType,
      relatedId: input.relatedId,
    },
  });

  if (!emailConfigured()) {
    await db.notification.update({
      where: { id: notification.id },
      data: { status: "SKIPPED", reason: "Email provider is not configured" },
    });
    return { delivered: false, reason: "not_configured", notificationId: notification.id };
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({
      from: config.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    await db.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { delivered: true, notificationId: notification.id };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Email provider error";
    await db.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", reason: reason.slice(0, 300) },
    });
    return { delivered: false, reason: "provider_error", notificationId: notification.id };
  }
}

export function emailNote(result: EmailResult) {
  if (result.delivered) return "The team was notified by email.";
  if (result.reason === "not_configured") return "Email notification was not sent because no email provider is configured. The request is saved for the team.";
  return "The request was saved, but the email notification could not be sent.";
}
