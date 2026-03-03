import { Router, type Request, type Response } from "express";
import { env } from "../../config/env.js";
import { API_VERSION } from "../../config/version.js";

const router = Router();

router.get("/info", (_req: Request, res: Response) => {
  res.json({
    version: API_VERSION,
    environment: env.NODE_ENV,
  });
});

export const systemRoutes = router;
