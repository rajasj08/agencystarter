import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { refresh as refreshSystemConfigCache } from "./services/SystemConfigCache.js";
import { refresh as refreshRolePermissionCache } from "./services/RolePermissionCache.js";
import { refreshPlanCache } from "./services/PlanCache.js";
import { seedSuperadmin } from "./scripts/seedSuperadmin.js";

const isTest = process.env.NODE_ENV === "test";

if (!isTest) {
  refreshSystemConfigCache().catch((err) => logger.warn("System config cache initial load failed", err));
  refreshRolePermissionCache().catch((err) => logger.warn("Role permission cache initial load failed", err));
  const PLAN_CACHE_TTL_MS = 10 * 60 * 1000;
  setInterval(() => refreshPlanCache().catch((err) => logger.warn("Plan cache refresh failed", err)), PLAN_CACHE_TTL_MS);
  seedSuperadmin().catch((err) => logger.warn("Superadmin seed failed", err));
}

const app = createApp();

if (!isTest) {
  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

export { app };
