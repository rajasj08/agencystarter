import { Router, type Request, type Response } from "express";
import { checkDatabase } from "../../lib/data-access.js";
import { env } from "../../config/env.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

router.get("/db", async (_req: Request, res: Response) => {
  const ok = await checkDatabase();
  if (ok) {
    res.json({ ok: true, database: "connected" });
  } else {
    res.status(503).json({ ok: false, database: "disconnected", error: "Connection failed" });
  }
});

router.get("/mail", (_req: Request, res: Response) => {
  const configured = Boolean(env.SMTP_HOST);
  res.json({ ok: configured, mail: configured ? "configured" : "not_configured" });
});

export const healthRoutes = router;
