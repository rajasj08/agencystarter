import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { tenantIpGuard } from "../../middleware/tenantIpGuard.js";
import { requirePermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { ApiKeyController } from "./api-key.controller.js";

const router = Router();
const controller = new ApiKeyController();

router.use(authMiddleware);
router.use(requireTenant);
router.use(asyncHandler(tenantIpGuard));
router.use(requirePermission(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ADMIN_ALL));

router.get("/", asyncHandler(controller.list.bind(controller)));
router.post("/", asyncHandler(controller.create.bind(controller)));
router.post("/:id/revoke", asyncHandler(controller.revoke.bind(controller)));
router.post("/:id/rotate", asyncHandler(controller.rotate.bind(controller)));

export const apiKeyRoutes = router;
