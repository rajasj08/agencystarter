import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { PlansService } from "./plans.service.js";
import { createPlanSchema, updatePlanSchema } from "./plans.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";

const service = new PlansService();

export class PlansController extends BaseController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const activeOnly = req.query.activeOnly === "true";
    const data = await service.list(activeOnly);
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const data = await service.getById(id);
    if (!data) {
      this.fail(res, "PLAN_NOT_FOUND", "Plan not found", 404);
      return;
    }
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createPlanSchema.safeParse(this.getBody(req));
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
    const data = await service.create(parsed.data);
    this.created(res, data, "Plan created");
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    const parsed = updatePlanSchema.safeParse(this.getBody(req));
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
    const data = await service.update(id, {
      ...parsed.data,
      updatedById: req.user!.userId,
    });
    this.success(res, data, RESPONSE_CODES.UPDATED, "Plan updated");
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = this.getParams(req);
    await service.remove(id);
    this.success(res, { id }, RESPONSE_CODES.DELETED, "Plan deactivated");
  };
}
