/**
 * Placeholder for future queue implementation.
 * This file will contain BullMQ worker + producer logic.
 */

import type { SendEmailOptions } from "../types/email-template.js";

export async function addEmailToQueue(_payload: SendEmailOptions): Promise<void> {
  throw new Error("Email queue not implemented yet");
}
