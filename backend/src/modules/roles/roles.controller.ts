import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { RolesService } from "./roles.service.js";
import { createRoleSchema, updateRoleSchema } from "./roles.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";

const rolesService = new RolesService();

export class RolesController extends BaseController {
  listPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
    const callerRole = req.user?.role ?? null;
    const data = await rolesService.listPermissions(callerRole);
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  /** Returns current user's permission IDs (for UI to restrict assignable permissions). */
  getMyPermissionIds = async (req: AuthRequest, res: Response): Promise<void> => {
    const roleId = req.user?.roleId;
    if (!roleId) {
      this.success(res, [], RESPONSE_CODES.FETCHED);
      return;
    }
    const ids = await rolesService.getPermissionIdsForRole(roleId);
    this.success(res, ids, RESPONSE_CODES.FETCHED);
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
    const roleId = req.user?.roleId ?? null;
    const callerRole = req.user?.role ?? null;
    const currentUserPermissionIds = roleId ? await rolesService.getPermissionIdsForRole(roleId) : undefined;
    const data = await rolesService.createRole(agencyId, parsed.data, currentUserPermissionIds, callerRole, req);
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
    const roleId = req.user?.roleId ?? null;
    const callerRole = req.user?.role ?? null;
    const currentUserPermissionIds = roleId ? await rolesService.getPermissionIdsForRole(roleId) : undefined;
    const data = await rolesService.updateRole(id, agencyId, parsed.data, currentUserPermissionIds, callerRole, req);
    this.success(res, data, RESPONSE_CODES.UPDATED);
  };

  deleteRole = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const agencyId = req.user!.agencyId!;
    await rolesService.deleteRole(id, agencyId, req);
    this.success(res, { id }, RESPONSE_CODES.DELETED);
  };
}
