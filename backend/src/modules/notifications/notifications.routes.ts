/**
 * Notifications module placeholder.
 * Future: GET /notifications (list), PATCH /notifications/:id/read, etc.
 * Auth required so that when real data is added, the route is already protected.
 */
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";

const router = Router();

router.use(authMiddleware);
router.get("/", (_req, res) => {
  res.json({ success: true, code: "SUCCESS", message: "Notifications API placeholder", data: [] });
});

export const notificationsRoutes = router;
