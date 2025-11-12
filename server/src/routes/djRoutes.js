import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { saveDjProfile, listDjs, getDjById } from "../controllers/djController.js";

const router = express.Router();

router.get("/", listDjs);               // Public discover page
router.get("/:id", getDjById);          // Public DJ profile
router.post("/", authMiddleware, saveDjProfile); // Create/edit own profile

export default router;
