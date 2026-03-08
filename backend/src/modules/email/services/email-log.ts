import { getPrismaForInternalUse } from "../../../lib/data-access.js";

export interface LogEmailParams {
  template: string;
  recipient: string;
  agencyId?: string | null;
  status: "sent" | "failed" | "skipped";
  error?: string;
}

/**
 * Append a row to email_logs for debugging and support. Does not throw; logs DB errors.
 */
export async function logEmail(params: LogEmailParams): Promise<void> {
  try {
    const prisma = getPrismaForInternalUse();
    await prisma.emailLog.create({
      data: {
        template: params.template,
        recipient: params.recipient,
        agencyId: params.agencyId ?? null,
        status: params.status,
        error: params.error ?? null,
      },
    });
  } catch (err) {
    // Do not fail the send flow if logging fails
    const { logger } = await import("../../../utils/logger.js");
    logger.warn("Failed to write email_log", { err });
  }
}
