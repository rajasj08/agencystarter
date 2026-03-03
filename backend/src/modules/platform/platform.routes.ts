import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { PlatformController } from "./platform.controller.js";

const router = Router();
const controller = new PlatformController();

router.get("/config", asyncHandler(controller.getConfig.bind(controller)));
router.get("/features", asyncHandler(controller.getFeatures.bind(controller)));
router.get("/version", asyncHandler(controller.getVersion.bind(controller)));
router.get("/health", asyncHandler(controller.getHealth.bind(controller)));

export const platformRoutes = router;
