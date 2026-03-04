import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { requirePermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { RolesController } from "./roles.controller.js";

const router = Router();
const controller = new RolesController();

// Order: 1) auth 2) tenant (for tenant-scoped routes) 3) permission — so scoping is validated before permission.
router.use(authMiddleware);

// These two are not tenant-scoped (permission list / my IDs); no requireTenant.
router.get(
  "/permissions",
  requirePermission(PERMISSIONS.ROLE_READ, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.listPermissions.bind(controller))
);

router.get(
  "/my-permission-ids",
  requirePermission(PERMISSIONS.ROLE_READ, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.getMyPermissionIds.bind(controller))
);

router.use(requireTenant);
router.get("/", requirePermission(PERMISSIONS.ROLE_READ, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.listRoles.bind(controller)));
router.get("/:id", requirePermission(PERMISSIONS.ROLE_READ, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.getRoleById.bind(controller)));
router.post(
  "/",
  requirePermission(PERMISSIONS.ROLE_CREATE, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.createRole.bind(controller))
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.updateRole.bind(controller))
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_DELETE, PERMISSIONS.ADMIN_ALL),
  asyncHandler(controller.deleteRole.bind(controller))
);

export const rolesRoutes = router;
