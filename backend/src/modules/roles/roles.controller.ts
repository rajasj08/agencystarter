import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { RolesService } from "./roles.service.js";
import { createRoleSchema, updateRoleSchema } from "./roles.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";

const rolesService = new RolesService();

export class RolesController extends BaseController {
  listPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await rolesService.listPermissions();
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  listRoles = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = req.user?.agencyId ?? null;
    const data = await rolesService.listRoles(agencyId);
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  getRoleById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const agencyId = req.user?.agencyId ?? null;
    const data = await rolesService.getRoleById(id, agencyId);
    if (!data) {
      this.fail(res, "NOT_FOUND", "Role not found", 404);
      return;
    }
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  createRole = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createRoleSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const agencyId = req.user!.agencyId!;
    const data = await rolesService.createRole(agencyId, parsed.data);
    this.created(res, data, "Role created");
  };

  updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = updateRoleSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const { id } = this.getParams(req);
    const agencyId = req.user!.agencyId!;
    const data = await rolesService.updateRole(id, agencyId, parsed.data);
    this.success(res, data, RESPONSE_CODES.UPDATED);
  };

  deleteRole = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const agencyId = req.user!.agencyId!;
    await rolesService.deleteRole(id, agencyId);
    this.success(res, { id }, RESPONSE_CODES.DELETED);
  };
}
