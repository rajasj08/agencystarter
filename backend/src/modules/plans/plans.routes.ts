import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { requireSuperAdmin } from "../../middleware/superadmin.js";
import { PlansController } from "./plans.controller.js";

const router = Router();
const controller = new PlansController();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get("/", asyncHandler(controller.list.bind(controller)));
router.get("/:id", asyncHandler(controller.getById.bind(controller)));
router.post("/", asyncHandler(controller.create.bind(controller)));
router.patch("/:id", asyncHandler(controller.update.bind(controller)));
router.delete("/:id", asyncHandler(controller.remove.bind(controller)));

export const plansRoutes = router;
