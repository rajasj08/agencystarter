import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { UserService } from "./user.service.js";
import { RolesService } from "../roles/roles.service.js";
import { createUserSchema, updateUserSchema } from "./user.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { audit } from "../../lib/audit.js";

const userService = new UserService();
const rolesService = new RolesService();

export class UserController extends BaseController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = req.user!.agencyId!;
    const { page, limit, offset } = this.getPagination(req);
    const { sortBy, sortOrder } = this.getSort(req);
    const { data, total } = await userService.list(agencyId, {
      page,
      limit,
      offset,
      sortBy,
      sortOrder,
    });
    this.paginated(res, data, total, { page, limit }, RESPONSE_CODES.FETCHED);
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const agencyId = req.user!.agencyId!;
    const data = await userService.getById(agencyId, id);
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createUserSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const agencyId = req.user!.agencyId!;
    const roleId = req.user!.roleId;
    const currentUserPermissionIds =
      roleId != null ? await rolesService.getPermissionIdsForRole(roleId) : undefined;
    const data = await userService.create(agencyId, parsed.data, {
      currentUserPermissionIds,
      callerIsSuperAdmin: req.user!.isSuperAdmin === true,
    });
    await audit(req, {
      action: parsed.data.invite ? "user.invited" : "user.created",
      resource: "user",
      resourceId: data.id,
      targetUserId: data.id,
      details: { email: data.email, role: data.role, changedByUserId: req.user!.userId },
    });
    this.created(res, data, parsed.data.invite ? "Invitation sent" : "User created");
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = updateUserSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const { id } = this.getParams(req);
    const agencyId = req.user!.agencyId!;
    const existing = await userService.getById(agencyId, id);
    const roleId = req.user!.roleId;
    const currentUserPermissionIds =
      roleId != null ? await rolesService.getPermissionIdsForRole(roleId) : undefined;
    const data = await userService.update(agencyId, id, parsed.data, {
      currentUserPermissionIds,
      currentUserId: req.user!.userId,
      updatedById: req.user!.userId,
      callerIsSuperAdmin: req.user!.isSuperAdmin === true,
    });
    const action =
      parsed.data.role !== undefined && parsed.data.role !== existing.role
        ? "user.role.changed"
        : parsed.data.status !== undefined && parsed.data.status !== existing.status
          ? "user.status.changed"
          : "user.updated";
    const details: Record<string, unknown> = {
      ...parsed.data,
      changedByUserId: req.user!.userId,
    };
    if (parsed.data.role !== undefined && parsed.data.role !== existing.role) {
      details.previousRole = existing.role;
      details.newRole = data.role;
    }
    if (parsed.data.status !== undefined && parsed.data.status !== existing.status) {
      details.previousStatus = existing.status;
      details.newStatus = data.status;
    }
    await audit(req, {
      action,
      resource: "user",
      resourceId: id,
      targetUserId: id,
      details,
    });
    this.success(res, data, RESPONSE_CODES.UPDATED, "User updated");
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const agencyId = req.user!.agencyId!;
    await userService.delete(agencyId, id, { currentUserId: req.user!.userId });
    await audit(req, {
      action: "user.deleted",
      resource: "user",
      resourceId: id,
      targetUserId: id,
      details: { changedByUserId: req.user!.userId, softDelete: true },
    });
    this.success(res, null, RESPONSE_CODES.DELETED, "User deleted");
  };

  sendPasswordReset = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const agencyId = req.user!.agencyId!;
    const result = await userService.sendPasswordReset(agencyId, id);
    this.success(res, result, RESPONSE_CODES.PASSWORD_RESET_SENT, result.message);
  };
}
