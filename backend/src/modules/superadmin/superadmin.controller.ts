import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { SuperadminService } from "./superadmin.service.js";
import {
  systemSettingsUpdateSchema,
  impersonateSchema,
  updateAgencyStatusSchema,
  createAgencySchema,
  updateAgencySchema,
  updateAgencyPlanSchema,
  listUsersQuerySchema,
  setUserRoleSchema,
  createUserSchema,
  type ListUsersQuery,
} from "./superadmin.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";

const service = new SuperadminService();

export class SuperadminController extends BaseController {
  getSystemSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
    const data = await service.getSystemSettings();
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  updateSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = systemSettingsUpdateSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>
      );
      return;
    }
    const data = await service.updateSystemSettings(req, parsed.data);
    this.success(res, data, RESPONSE_CODES.UPDATED, "System settings updated");
  };

  getAgencies = async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit } = this.getPagination(req);
    const query = this.getQuery<{ sortBy?: string; order?: string }>(req);
    const { data, total } = await service.getAgencies({
      page,
      limit,
      sortBy: query.sortBy,
      order: query.order === "asc" ? "asc" : "desc",
    });
    this.paginated(res, data, total, { page, limit }, RESPONSE_CODES.FETCHED);
  };

  getAgencyById = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = this.getParams(req).id;
    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "Agency ID is required", 400);
      return;
    }
    const data = await service.getAgencyById(agencyId);
    if (!data) {
      this.fail(res, "AGENCY_NOT_FOUND", "Agency not found", 404);
      return;
    }
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  createAgency = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createAgencySchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>
      );
      return;
    }
    const data = await service.createAgency(req, parsed.data);
    this.created(res, data, "Agency and admin user created");
  };

  updateAgency = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = this.getParams(req).id;
    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "Agency ID is required", 400);
      return;
    }
    const parsed = updateAgencySchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>
      );
      return;
    }
    const data = await service.updateAgency(req, agencyId, parsed.data);
    this.success(res, data, RESPONSE_CODES.UPDATED, "Agency updated");
  };

  updateAgencyPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = this.getParams(req).id;
    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "Agency ID is required", 400);
      return;
    }
    const parsed = updateAgencyPlanSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>
      );
      return;
    }
    const data = await service.updateAgencyPlan(req, agencyId, parsed.data);
    this.success(res, data, RESPONSE_CODES.UPDATED, "Agency plan updated");
  };

  deleteAgency = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = this.getParams(req).id;
    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "Agency ID is required", 400);
      return;
    }
    const data = await service.deleteAgency(req, agencyId);
    this.success(res, data, RESPONSE_CODES.UPDATED, "Agency soft deleted");
  };

  suspendAgency = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = this.getParams(req).id;
    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "Agency ID is required", 400);
      return;
    }
    const data = await service.suspendAgency(req, agencyId);
    this.success(res, data, RESPONSE_CODES.UPDATED, "Agency suspended");
  };

  activateAgency = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = this.getParams(req).id;
    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "Agency ID is required", 400);
      return;
    }
    const data = await service.activateAgency(req, agencyId);
    this.success(res, data, RESPONSE_CODES.UPDATED, "Agency activated");
  };

  loginAsAgency = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = this.getParams(req).id;
    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "Agency ID is required", 400);
      return;
    }
    const data = await service.impersonate(req, agencyId);
    this.success(res, data, RESPONSE_CODES.SUCCESS, "Login as agency started");
  };

  updateAgencyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = this.getParams(req).id;
    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "Agency ID is required", 400);
      return;
    }
    const parsed = updateAgencyStatusSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>
      );
      return;
    }
    const data = await service.updateAgencyStatus(req, agencyId, parsed.data.status);
    this.success(res, data, RESPONSE_CODES.UPDATED, "Agency status updated");
  };

  impersonate = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = impersonateSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>
      );
      return;
    }
    const data = await service.impersonate(req, parsed.data.agencyId);
    this.success(res, data, RESPONSE_CODES.SUCCESS, "Impersonation started");
  };

  stopImpersonation = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await service.stopImpersonation(req);
    this.success(res, data, RESPONSE_CODES.SUCCESS, "Impersonation ended");
  };

  getMetrics = async (_req: AuthRequest, res: Response): Promise<void> => {
    const data = await service.getMetrics();
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  getHealth = async (_req: AuthRequest, res: Response): Promise<void> => {
    const data = await service.getHealth();
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createUserSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>
      );
      return;
    }
    const data = await service.createUser(req, parsed.data);
    this.created(res, data, "User created");
  };

  getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit } = this.getPagination(req);
    const query = this.getQuery<{ search?: string; sortBy?: string; order?: string }>(req);
    const parsed = listUsersQuerySchema.safeParse({ ...query, page, limit });
    const opts = parsed.success
      ? parsed.data
      : {
          page,
          limit,
          search: query.search,
          sortBy: undefined as ListUsersQuery["sortBy"],
          order: undefined as ListUsersQuery["order"],
        };
    const { data, total } = await service.getUsers({
      page: opts.page ?? page,
      limit: opts.limit ?? limit,
      search: opts.search,
      sortBy: opts.sortBy,
      order: opts.order,
    });
    this.paginated(res, data, total, { page: opts.page ?? page, limit: opts.limit ?? limit }, RESPONSE_CODES.FETCHED);
  };

  getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = this.getParams(req).id;
    if (!userId) {
      this.fail(res, "VALIDATION_ERROR", "User ID is required", 400);
      return;
    }
    const data = await service.getUserById(userId);
    if (!data) {
      this.fail(res, "USER_NOT_FOUND", "User not found", 404);
      return;
    }
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  disableUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = this.getParams(req).id;
    if (!userId) {
      this.fail(res, "VALIDATION_ERROR", "User ID is required", 400);
      return;
    }
    const data = await service.disableUser(req, userId);
    this.success(res, data, RESPONSE_CODES.UPDATED, "User disabled");
  };

  enableUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = this.getParams(req).id;
    if (!userId) {
      this.fail(res, "VALIDATION_ERROR", "User ID is required", 400);
      return;
    }
    const data = await service.enableUser(req, userId);
    this.success(res, data, RESPONSE_CODES.UPDATED, "User enabled");
  };

  setUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = this.getParams(req).id;
    if (!userId) {
      this.fail(res, "VALIDATION_ERROR", "User ID is required", 400);
      return;
    }
    const parsed = setUserRoleSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>
      );
      return;
    }
    const data = await service.setUserRole(req, userId, parsed.data);
    this.success(res, data, RESPONSE_CODES.UPDATED, "User role updated");
  };

  resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = this.getParams(req).id;
    if (!userId) {
      this.fail(res, "VALIDATION_ERROR", "User ID is required", 400);
      return;
    }
    const data = await service.resetUserPassword(req, userId);
    this.success(res, data, RESPONSE_CODES.SUCCESS, "Temporary password generated");
  };

  getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit, offset } = this.getPagination(req);
    const { sortBy, sortOrder } = this.getSort(req);
    const { data, total } = await service.getAuditLogs({ page, limit, offset, sortBy, sortOrder });
    this.paginated(res, data, total, { page, limit }, RESPONSE_CODES.FETCHED);
  };
}
