import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireRouteScope } from "../../middleware/routeScope.js";
import { requireTenant } from "../../middleware/tenant.js";
import { tenantIpGuard } from "../../middleware/tenantIpGuard.js";
import { requirePermission } from "../../middleware/rbac.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import * as controller from "./email-template.controller.js";

/**
 * Routes for superadmin: system email template overrides.
 * Mount at: /superadmin/email-templates
 */
export const superadminEmailTemplateRoutes = Router();

superadminEmailTemplateRoutes.use(authMiddleware);
superadminEmailTemplateRoutes.use(requireRouteScope("PLATFORM"));

superadminEmailTemplateRoutes.get("/", asyncHandler(controller.listSystemOverrides));
superadminEmailTemplateRoutes.get("/keys", asyncHandler(controller.listEditableKeys));
superadminEmailTemplateRoutes.get("/:key", asyncHandler(controller.getSystemOverride));
superadminEmailTemplateRoutes.put("/:key", asyncHandler(controller.upsertSystemOverride));
superadminEmailTemplateRoutes.delete("/:key", asyncHandler(controller.deleteSystemOverride));
superadminEmailTemplateRoutes.get("/:key/variables", asyncHandler(controller.getVariables));
superadminEmailTemplateRoutes.get("/:key/default", asyncHandler(controller.getDefaultContent));
superadminEmailTemplateRoutes.post("/preview", asyncHandler(controller.preview));
superadminEmailTemplateRoutes.post("/test", asyncHandler(controller.sendTest));

/**
 * Routes for agency: tenant email template overrides.
 * Mount at: /settings/email-templates (after settings auth + tenant).
 */
export const agencyEmailTemplateRoutes = Router();

agencyEmailTemplateRoutes.use(requirePermission(PERMISSIONS.SETTINGS_READ, PERMISSIONS.ADMIN_ALL));
agencyEmailTemplateRoutes.get("/", asyncHandler(controller.listAgencyOverrides));
agencyEmailTemplateRoutes.get("/keys", asyncHandler(controller.listEditableKeys));
agencyEmailTemplateRoutes.get("/:key", asyncHandler(controller.getAgencyOverride));
agencyEmailTemplateRoutes.get("/:key/variables", asyncHandler(controller.getVariables));
agencyEmailTemplateRoutes.get("/:key/default", asyncHandler(controller.getDefaultContent));
agencyEmailTemplateRoutes.post("/preview", asyncHandler(controller.preview));
agencyEmailTemplateRoutes.post("/test", asyncHandler(controller.sendTest));

agencyEmailTemplateRoutes.use(requirePermission(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ADMIN_ALL));
agencyEmailTemplateRoutes.put("/:key", asyncHandler(controller.upsertAgencyOverride));
agencyEmailTemplateRoutes.delete("/:key", asyncHandler(controller.deleteAgencyOverride));
