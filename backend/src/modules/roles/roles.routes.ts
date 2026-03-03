import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { requirePermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { RolesController } from "./roles.controller.js";

const router = Router();
const controller = new RolesController();

router.use(authMiddleware);

router.get(
  "/permissions",
  requirePermission(PERMISSIONS.SETTINGS_READ, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.listPermissions.bind(controller))
);

router.get("/", asyncHandler(controller.listRoles.bind(controller)));
router.get("/:id", asyncHandler(controller.getRoleById.bind(controller)));

router.use(requireTenant);
router.post(
  "/",
  requirePermission(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.createRole.bind(controller))
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.updateRole.bind(controller))
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.deleteRole.bind(controller))
);

export const rolesRoutes = router;
