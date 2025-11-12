import express from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// 🧾 Register new account
router.post("/register", registerUser);

// 🔑 Login user
router.post("/login", loginUser);

// 👤 Get logged-in user info
router.get("/me", authMiddleware, getCurrentUser);

export default router;
