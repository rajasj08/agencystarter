import nodemailer from "nodemailer";
import type { EmailSenderConfig } from "../types/email-sender-config.js";

/** Cache key: host + port + user so we reuse the same transporter for the same SMTP account. */
function cacheKey(config: EmailSenderConfig): string {
  const parts = [config.host, config.port, config.user ?? ""];
  return parts.join(":");
}

const transporterCache = new Map<string, nodemailer.Transporter>();

/**
 * Return a cached transporter for this sender config, or create and cache one.
 * Avoids connection overhead when sending multiple emails with the same SMTP config.
 */
export function getCachedTransporter(config: EmailSenderConfig): nodemailer.Transporter {
  const key = cacheKey(config);
  let transport = transporterCache.get(key);
  if (!transport) {
    transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth:
        config.user && config.pass
          ? { user: config.user, pass: config.pass }
          : undefined,
    });
    transporterCache.set(key, transport);
  }
  return transport;
}

/**
 * Remove a transporter from the cache (e.g. after agency SMTP settings change).
 * Call with the config that was used before the change to invalidate.
 */
export function invalidateTransporter(config: EmailSenderConfig): void {
  transporterCache.delete(cacheKey(config));
}
