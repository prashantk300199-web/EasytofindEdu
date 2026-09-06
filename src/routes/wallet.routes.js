import express from "express";
import * as walletController from "../controllers/walletController.js";
import { authenticateStudent } from "../middlewares/AuthenticateStudents.js";
import { authenticateOwner, authenticateInstituteOwner, authenticateAdmin } from "../middlewares/auth.js";

const router = express.Router();

// User routes (requires authentication)
router.get("/referral-code", authenticateStudent, walletController.getReferralCode);
router.get("/wallet", authenticateStudent, walletController.getWallet);

// Admin routes
router.post("/admin/update-coins", authenticateAdmin, walletController.updateUserCoins);
router.get("/admin/wallet/:role/:userId", authenticateAdmin, walletController.adminGetUserWallet);

export default router;
