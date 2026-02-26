import express from "express";
import {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    verifyOtp,
    resetPassword,
} from "../controllers/auth.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", auth, getMe);
router.put("/profile", auth, updateProfile);
router.put("/password", auth, changePassword);

export default router;
