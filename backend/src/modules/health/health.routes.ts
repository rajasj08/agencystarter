import { Router, type Request, type Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

router.get("/db", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: "connected" });
  } catch (err) {
    res.status(503).json({ ok: false, database: "disconnected", error: (err as Error).message });
  }
});

router.get("/mail", (_req: Request, res: Response) => {
  const configured = Boolean(env.SMTP_HOST);
  res.json({ ok: configured, mail: configured ? "configured" : "not_configured" });
});

export const healthRoutes = router;
