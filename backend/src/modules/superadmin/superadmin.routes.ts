import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireRouteScope } from "../../middleware/routeScope.js";
import { SuperadminController } from "./superadmin.controller.js";
import { plansRoutes } from "../plans/plans.routes.js";

const router = Router();
const controller = new SuperadminController();

router.use(authMiddleware);
router.use(requireRouteScope("PLATFORM"));

router.use("/plans", plansRoutes);

router.get("/system-settings", asyncHandler(controller.getSystemSettings.bind(controller)));
router.patch("/system-settings", asyncHandler(controller.updateSystemSettings.bind(controller)));
router.get("/metrics", asyncHandler(controller.getMetrics.bind(controller)));
router.get("/health", asyncHandler(controller.getHealth.bind(controller)));
router.get("/agencies", asyncHandler(controller.getAgencies.bind(controller)));
router.get("/agencies/:id", asyncHandler(controller.getAgencyById.bind(controller)));
router.post("/agencies", asyncHandler(controller.createAgency.bind(controller)));
router.patch("/agencies/:id", asyncHandler(controller.updateAgency.bind(controller)));
router.patch("/agencies/:id/plan", asyncHandler(controller.updateAgencyPlan.bind(controller)));
router.delete("/agencies/:id", asyncHandler(controller.deleteAgency.bind(controller)));
router.patch("/agencies/:id/suspend", asyncHandler(controller.suspendAgency.bind(controller)));
router.patch("/agencies/:id/activate", asyncHandler(controller.activateAgency.bind(controller)));
router.post("/agencies/:id/login-as", asyncHandler(controller.loginAsAgency.bind(controller)));
router.patch("/agencies/:id/status", asyncHandler(controller.updateAgencyStatus.bind(controller)));

router.get("/users", asyncHandler(controller.getUsers.bind(controller)));
router.post("/users", asyncHandler(controller.createUser.bind(controller)));
router.get("/users/:id", asyncHandler(controller.getUserById.bind(controller)));
router.patch("/users/:id/disable", asyncHandler(controller.disableUser.bind(controller)));
router.patch("/users/:id/enable", asyncHandler(controller.enableUser.bind(controller)));
router.patch("/users/:id/role", asyncHandler(controller.setUserRole.bind(controller)));
router.patch("/users/:id/reset-password", asyncHandler(controller.resetUserPassword.bind(controller)));

router.post("/impersonate", asyncHandler(controller.impersonate.bind(controller)));
router.post("/stop", asyncHandler(controller.stopImpersonation.bind(controller)));
router.get("/audit", asyncHandler(controller.getAuditLogs.bind(controller)));

export const superadminRoutes = router;
