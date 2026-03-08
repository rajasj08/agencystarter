import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { tenantIpGuard } from "../../middleware/tenantIpGuard.js";
import { requirePermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { AuditLogController } from "./audit-log.controller.js";

const router = Router();
const controller = new AuditLogController();

// Order: auth → tenant → permission.
router.use(authMiddleware);
router.use(asyncHandler(requireTenant));
router.use(asyncHandler(tenantIpGuard));

router.get(
  "/",
  requirePermission(PERMISSIONS.SETTINGS_READ, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.list.bind(controller))
);
router.get(
  "/export",
  requirePermission(PERMISSIONS.SETTINGS_READ, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.export.bind(controller))
);

export const auditLogRoutes = router;
