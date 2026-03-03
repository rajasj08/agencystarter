import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { SettingsService } from "./settings.service.js";
import { updateSettingsSchema, testEmailSchema } from "./settings.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { audit } from "../../lib/audit.js";

const settingsService = new SettingsService();

export class SettingsController extends BaseController {
  get = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = req.user!.agencyId!;
    const data = await settingsService.get(agencyId);
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = updateSettingsSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const agencyId = req.user!.agencyId!;
    const data = await settingsService.update(agencyId, parsed.data);
    await audit(req, { action: "settings.updated", resource: "settings", details: { keys: Object.keys(parsed.data) } });
    this.success(res, data, RESPONSE_CODES.UPDATED, "Settings updated");
  };

  sendTestEmail = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = testEmailSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const agencyId = req.user!.agencyId!;
    const result = await settingsService.sendTestEmail(agencyId, parsed.data.to);
    if (!result.sent) {
      this.fail(res, "EMAIL_SEND_FAILED", result.message, 400);
      return;
    }
    this.success(res, { message: result.message }, RESPONSE_CODES.SUCCESS);
  };
}
