import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission, allowOnboardingOrPermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";
import { tenantIpGuard } from "../../middleware/tenantIpGuard.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { AgencyController } from "./agency.controller.js";

const router = Router();
const controller = new AgencyController();

// Order: auth; then permission. GET list/getById are platform or scoped in service; PATCH has tenant then permission.
router.use(authMiddleware);

// POST /: allow if user has no agency (onboarding) or has AGENCY_CREATE/ADMIN_ALL
router.post("/", allowOnboardingOrPermission(PERMISSIONS.AGENCY_CREATE, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.create.bind(controller)));
router.get("/", requirePermission(PERMISSIONS.AGENCY_LIST, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.list.bind(controller)));
router.get("/:id", requirePermission(PERMISSIONS.AGENCY_READ, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.getById.bind(controller)));
router.patch(
  "/:id",
  requireTenant,
  asyncHandler(tenantIpGuard),
  requirePermission(PERMISSIONS.AGENCY_UPDATE, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.updateTenant.bind(controller))
);

export const agencyRoutes = router;
