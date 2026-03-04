import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openApiSpec } from "./openapi.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { contextMiddleware } from "./middleware/context.js";
import { maintenanceMiddleware } from "./middleware/maintenance.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./api/router.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { systemRoutes } from "./modules/system/system.routes.js";
import { logger } from "./utils/logger.js";
import { refresh as refreshSystemConfigCache } from "./services/SystemConfigCache.js";
import { refresh as refreshRolePermissionCache } from "./services/RolePermissionCache.js";
import { refreshPlanCache } from "./services/PlanCache.js";
import { seedSuperadmin } from "./scripts/seedSuperadmin.js";

const app = express();

const PLAN_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

refreshSystemConfigCache().catch((err) => logger.warn("System config cache initial load failed", err));
refreshRolePermissionCache().catch((err) => logger.warn("Role permission cache initial load failed", err));
refreshPlanCache().catch((err) => logger.warn("Plan cache initial load failed", err));
setInterval(() => refreshPlanCache().catch((err) => logger.warn("Plan cache refresh failed", err)), PLAN_CACHE_TTL_MS);
seedSuperadmin().catch((err) => logger.warn("Superadmin seed failed", err));

app.use(helmet());
app.use(requestIdMiddleware);
app.use(contextMiddleware);
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(maintenanceMiddleware);

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: "RATE_LIMIT", message: "Too many requests, please try again later." },
  })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec as Parameters<typeof swaggerUi.setup>[0]));
app.use(env.API_PREFIX, apiRouter);
app.use("/health", healthRoutes);
app.use("/system", systemRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`);
});
