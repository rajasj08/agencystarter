import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission, allowOnboardingOrPermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { AgencyController } from "./agency.controller.js";

const router = Router();
const controller = new AgencyController();

router.use(authMiddleware);

// POST /: allow if user has no agency (onboarding) or has AGENCY_CREATE/ADMIN_ALL
router.post("/", allowOnboardingOrPermission(PERMISSIONS.AGENCY_CREATE, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.create.bind(controller)));
router.get("/", requirePermission(PERMISSIONS.AGENCY_LIST, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.list.bind(controller)));
router.get("/:id", requirePermission(PERMISSIONS.AGENCY_READ, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.getById.bind(controller)));

export const agencyRoutes = router;
