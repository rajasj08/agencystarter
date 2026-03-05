import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { ApiKeyService } from "./api-key.service.js";
import { createApiKeySchema } from "./api-key.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";

const apiKeyService = new ApiKeyService();

export class ApiKeyController extends BaseController {
  /** List API keys for the current tenant (req.user.agencyId). */
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = req.user!.agencyId!;
    const list = await apiKeyService.list(agencyId);
    this.success(res, { apiKeys: list }, RESPONSE_CODES.FETCHED);
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createApiKeySchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const agencyId = req.user!.agencyId!;
    const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    const result = await apiKeyService.create(req, agencyId, {
      name: parsed.data.name,
      permissionKeys: parsed.data.permissionKeys,
      expiresAt,
    });
    this.created(res, { key: result.key, apiKey: result.apiKey }, "API key created. Store the key securely; it will not be shown again.");
  };

  revoke = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const agencyId = req.user!.agencyId!;
    await apiKeyService.revoke(req, id, agencyId);
    this.success(res, { id }, RESPONSE_CODES.UPDATED, "API key revoked");
  };

  rotate = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const parsed = createApiKeySchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const agencyId = req.user!.agencyId!;
    const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    const result = await apiKeyService.rotate(req, id, agencyId, {
      name: parsed.data.name,
      permissionKeys: parsed.data.permissionKeys,
      expiresAt,
    });
    this.success(res, { key: result.key, apiKey: result.apiKey }, RESPONSE_CODES.SUCCESS, "API key rotated. New key is returned; old key is revoked.");
  };
}
