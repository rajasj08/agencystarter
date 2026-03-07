import { Router } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import { SsoController } from "./sso.controller.js";

const router = Router();
const controller = new SsoController();

router.get("/status", asyncHandler(controller.status.bind(controller)));
router.get("/:provider", asyncHandler(controller.initiate.bind(controller)));
router.get("/:provider/callback", asyncHandler(controller.callback.bind(controller)));
router.post("/:provider/callback", asyncHandler(controller.callback.bind(controller)));

export const ssoRoutes = router;
