import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ Return logged-in user info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("username role");
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user info" });
  }
});

export default router;
