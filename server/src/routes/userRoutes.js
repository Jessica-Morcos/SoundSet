import express from "express";
import {
  listUsers,
  toggleUserActive,
  deleteUser,
  getPreferences,
  updatePreferences,
} from "../controllers/userController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// 🟢 Admin-only user management
router.get("/", authMiddleware, adminOnly, listUsers);
router.patch("/:id/toggle", authMiddleware, adminOnly, toggleUserActive);
router.delete("/:id", authMiddleware, adminOnly, deleteUser);

// 🟢 Regular users: view and update preferences
router.get("/preferences/me", authMiddleware, getPreferences);
router.put("/preferences", authMiddleware, updatePreferences);

export default router;
