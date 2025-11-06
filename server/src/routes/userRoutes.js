import express from "express";
import {
  listUsers,
  toggleUserActive,
  deleteUser,
} from "../controllers/userController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// 🟢 Admin-only user management
router.get("/", authMiddleware, adminOnly, listUsers);
router.patch("/:id/toggle", authMiddleware, adminOnly, toggleUserActive);
router.delete("/:id", authMiddleware, adminOnly, deleteUser);

export default router;
