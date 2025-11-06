// server/src/routes/songRoutes.js
import express from "express";
import {
  listSongs,
  suggestSongs,
  createSong,
  updateSong,
  deleteSong,
  toggleRestricted,
} from "../controllers/songController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// 🟢 Authenticated user endpoints
router.get("/", authMiddleware, listSongs);
router.get("/suggest", authMiddleware, suggestSongs);

// 🔐 Admin-only endpoints
router.post("/", authMiddleware, adminOnly, createSong);
router.put("/:id", authMiddleware, adminOnly, updateSong);
router.patch("/:id/toggle", authMiddleware, adminOnly, toggleRestricted);
router.delete("/:id", authMiddleware, adminOnly, deleteSong);

export default router;
