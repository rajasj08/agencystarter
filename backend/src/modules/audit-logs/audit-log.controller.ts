import type { Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { AuditLogService } from "./audit-log.service.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { auditExportQuerySchema } from "./audit-log.validation.js";
import { audit } from "../../lib/audit.js";

const service = new AuditLogService();

function parseOptionalDate(s: string | undefined | null): Date | null {
  if (!s || typeof s !== "string" || s.trim() === "") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export class AuditLogController extends BaseController {
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const agencyId = req.user!.agencyId!;
    const { page, limit, offset } = this.getPagination(req);
    const { sortBy, sortOrder } = this.getSort(req);
    const { data, total } = await service.list(agencyId, { page, limit, offset, sortBy, sortOrder });
    this.paginated(res, data, total, { page, limit }, RESPONSE_CODES.FETCHED);
  };

  /** Export audit logs (tenant-scoped). JSON or CSV; paginated. Audits the export action. */
  export = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = auditExportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Invalid export parameters", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const agencyId = req.user!.agencyId!;
    const { format, from, to, action, userId, resource, limit, offset } = parsed.data;
    const filters = {
      dateFrom: parseOptionalDate(from),
      dateTo: parseOptionalDate(to),
      action: action && action.trim() ? action.trim() : null,
      userId: userId && userId.trim() ? userId.trim() : null,
      resource: resource && resource.trim() ? resource.trim() : null,
    };
    const result = await service.exportTenant(agencyId, filters, format, { offset, limit });

    await audit(req, {
      action: "audit.export",
      resource: "audit_log",
      details: { format, recordCount: result.data.length, total: result.total, filters: { from, to, action, userId, resource } },
    });

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
      res.send(service.toCsv(result.data));
      return;
    }
    this.success(
      res,
      { data: result.data, total: result.total, offset, limit },
      RESPONSE_CODES.FETCHED,
      "Export complete"
    );
  };
}
