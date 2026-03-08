/**
 * Email Dispatcher
 *
 * Provides abstraction between application services and the email sender.
 *
 * Current mode:
 * - direct (default): send immediately via sendEmail.
 *
 * Future mode:
 * - queue (BullMQ / Redis background worker): enqueue and let worker call sendEmail.
 *
 * This allows switching email delivery strategy without modifying
 * any application services.
 */

import type { SendEmailOptions } from "../types/email-template.js";
import { sendEmail } from "./email.service.js";
import { logger } from "../../../utils/logger.js";

export async function dispatchEmail(options: SendEmailOptions): Promise<boolean> {
  const mode = process.env.EMAIL_DELIVERY_MODE || "direct";

  if (mode === "queue") {
    return enqueueEmail(options);
  }

  return sendEmail(options);
}

async function enqueueEmail(options: SendEmailOptions): Promise<boolean> {
  // Future: BullMQ / Redis queue; worker will call sendEmail(options)
  try {
    const { addEmailToQueue } = await import("../queue/email.queue.js");
    await addEmailToQueue(options);
    return true;
  } catch {
    logger.warn("Email queue mode not configured. Falling back to direct send.");
    return sendEmail(options);
  }
}
