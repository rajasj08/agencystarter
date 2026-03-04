import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { rateLimitLogin } from "../../middleware/rateLimitLogin.js";
import { AuthController } from "./auth.controller.js";

const router = Router();
const controller = new AuthController();

router.post("/login", rateLimitLogin, asyncHandler(controller.login.bind(controller)));
router.post("/register", asyncHandler(controller.register.bind(controller)));
router.post("/refresh", asyncHandler(controller.refresh.bind(controller)));
router.post("/logout", asyncHandler(controller.logout.bind(controller)));
router.post("/verify-email", asyncHandler(controller.verifyEmail.bind(controller)));
router.post("/forgot-password", asyncHandler(controller.forgotPassword.bind(controller)));
router.post("/reset-password", asyncHandler(controller.resetPassword.bind(controller)));
router.get("/me", authMiddleware, asyncHandler(controller.me.bind(controller)));
router.patch("/me", authMiddleware, asyncHandler(controller.updateProfile.bind(controller)));
router.post("/change-password", authMiddleware, asyncHandler(controller.changePassword.bind(controller)));
router.get("/sessions", authMiddleware, asyncHandler(controller.getSessions.bind(controller)));
router.post("/sessions/logout-others", authMiddleware, asyncHandler(controller.logoutOtherSessions.bind(controller)));

export const authRoutes = router;
