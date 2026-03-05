/**
 * Express app factory. Used by server.ts and by integration tests (supertest).
 * In test env, cache refresh and seed are skipped to avoid async side effects.
 */

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

const isTest = process.env.NODE_ENV === "test";

export function createApp(): express.Express {
  const app = express();

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

  if (!isTest) {
    app.use(
      rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, code: "RATE_LIMIT", message: "Too many requests, please try again later." },
      })
    );
  } else {
    app.use((_req, _res, next) => next());
  }

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec as Parameters<typeof swaggerUi.setup>[0]));
  app.use(env.API_PREFIX, apiRouter);
  app.use("/health", healthRoutes);
  app.use("/system", systemRoutes);

  app.use(errorHandler);

  return app;
}
