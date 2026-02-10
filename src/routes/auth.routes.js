import { Router } from "express";
import { register, verifyOtpController, login, resendOtp, logout } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.js";
import { registerSchema, verifyOtpSchema, loginSchema, resendOtpSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtpController);
router.post("/login", validate(loginSchema), login);
router.post("/resend-otp", validate(resendOtpSchema), resendOtp);
router.post("/logout", logout);

export default router;