import type { Request, Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { AgencyService } from "./agency.service.js";
import { createAgencySchema, updateAgencyTenantSchema } from "./agency.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { audit } from "../../lib/audit.js";

const agencyService = new AgencyService();

export class AgencyController extends BaseController {
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createAgencySchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const userId = req.user!.userId;
    const callerRole = req.user?.role ?? null;
    const data = await agencyService.create(parsed.data, userId, callerRole);
    await audit(req, { action: "agency.created", resource: "agency", resourceId: data.id, details: { name: data.name, slug: data.slug } });
    this.created(res, data, "Agency created");
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const callerAgencyId = req.user?.agencyId ?? null;
    const callerRole = req.user?.role ?? null;
    const data = await agencyService.getById(id, callerAgencyId, callerRole);
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  updateTenant = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const parsed = updateAgencyTenantSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const callerAgencyId = req.user!.agencyId!;
    const data = await agencyService.updateTenant(id, callerAgencyId, parsed.data as Record<string, unknown>);
    this.success(res, data, RESPONSE_CODES.UPDATED);
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    const data = await agencyService.list();
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };
}
