import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { AuditLogService } from "./audit-log.service.js";
import type { AuthRequest } from "../../middleware/auth.js";

const service = new AuditLogService();

export class AuditLogController extends BaseController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = req.user!.agencyId!;
    const { page, limit, offset } = this.getPagination(req);
    const { data, total } = await service.list(agencyId, { page, limit, offset });
    this.paginated(res, data, total, { page, limit }, RESPONSE_CODES.FETCHED);
  };
}
