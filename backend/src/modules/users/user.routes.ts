import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { requirePermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { UserController } from "./user.controller.js";

const router = Router();
const controller = new UserController();

// Order: auth → tenant → permission (scoping before permission check).
router.use(authMiddleware);
router.use(requireTenant);

router.get("/", requirePermission(PERMISSIONS.USER_LIST, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.list.bind(controller)));
router.post("/", requirePermission(PERMISSIONS.USER_CREATE, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.create.bind(controller)));
router.get("/:id", requirePermission(PERMISSIONS.USER_READ, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.getById.bind(controller)));
router.patch("/:id", requirePermission(PERMISSIONS.USER_UPDATE, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.update.bind(controller)));
router.delete("/:id", requirePermission(PERMISSIONS.USER_DELETE, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.delete.bind(controller)));
router.post("/:id/send-password-reset", requirePermission(PERMISSIONS.USER_UPDATE, PERMISSIONS.ADMIN_ALL), asyncHandler(controller.sendPasswordReset.bind(controller)));

export const userRoutes = router;
