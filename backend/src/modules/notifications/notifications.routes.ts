/**
 * Notifications module placeholder.
 * Future: GET /notifications (list), PATCH /notifications/:id/read, etc.
 */
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ success: true, code: "SUCCESS", message: "Notifications API placeholder", data: [] });
});

export const notificationsRoutes = router;
