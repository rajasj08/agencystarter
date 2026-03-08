export { dispatchEmail } from "./services/email-dispatcher.js";
export { sendRaw } from "./services/email.service.js";
export { renderTemplate } from "./services/email.renderer.js";
export type {
  EmailTemplateKey,
  SendEmailOptions,
  RenderedEmail,
} from "./types/email-template.js";
export type { EmailSenderConfig } from "./types/email-sender-config.js";
