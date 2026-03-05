import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { rateLimitSso } from "../middleware/rateLimitSso.js";
import { ssoRoutes } from "../modules/auth/sso/sso.routes.js";
import { agencyRoutes } from "../modules/agency/agency.routes.js";
import { settingsRoutes } from "../modules/settings/settings.routes.js";
import { userRoutes } from "../modules/users/user.routes.js";
import { notificationsRoutes } from "../modules/notifications/notifications.routes.js";
import { platformRoutes } from "../modules/platform/platform.routes.js";
import { auditLogRoutes } from "../modules/audit-logs/audit-log.routes.js";
import { apiKeyRoutes } from "../modules/api-keys/api-key.routes.js";
import { rolesRoutes } from "../modules/roles/roles.routes.js";
import { superadminRoutes } from "../modules/superadmin/superadmin.routes.js";

export const apiRouter = Router();

const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "RATE_LIMIT", message: "Too many auth attempts; try again later." },
});

apiRouter.use("/auth", authRateLimit, authRoutes);

if (env.AUTH_SSO_ENABLED) {
  apiRouter.use("/auth/sso", rateLimitSso, ssoRoutes);
} else {
  apiRouter.use("/auth/sso", (_req, res) =>
    res.status(404).json({ success: false, code: "NOT_FOUND", message: "Not found" })
  );
}
apiRouter.use("/agencies", agencyRoutes);
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/notifications", notificationsRoutes);
apiRouter.use("/platform", platformRoutes);
apiRouter.use("/audit-logs", auditLogRoutes);
apiRouter.use("/api-keys", apiKeyRoutes);
apiRouter.use("/roles", rolesRoutes);
apiRouter.use("/superadmin", superadminRoutes);

apiRouter.get("/", (_req, res) => {
  res.json({ success: true, code: "SUCCESS", message: "API v1", data: { version: "1.0" } });
});
