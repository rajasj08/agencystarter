import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { requirePermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { AuditLogController } from "./audit-log.controller.js";

const router = Router();
const controller = new AuditLogController();

router.use(authMiddleware);
router.use(requireTenant);

router.get(
  "/",
  requirePermission(PERMISSIONS.SETTINGS_READ, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.list.bind(controller))
);

export const auditLogRoutes = router;
