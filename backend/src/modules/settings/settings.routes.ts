import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { requirePermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { SettingsController } from "./settings.controller.js";

const router = Router();
const controller = new SettingsController();

router.use(authMiddleware);
router.use(requireTenant);

router.get("/", requirePermission(PERMISSIONS.SETTINGS_READ, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.get.bind(controller)));
router.patch("/", requirePermission(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.update.bind(controller)));
router.post("/test-email", requirePermission(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.sendTestEmail.bind(controller)));

export const settingsRoutes = router;
