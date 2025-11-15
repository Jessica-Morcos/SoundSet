// server.js (NO DOTENV HERE)

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

// Routes
import authRoutes from "../routes/authRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import songRoutes from "../routes/songRoutes.js";
import playlistRoutes from "../routes/playlistRoutes.js";
import statsRoutes from "../routes/statsRoutes.js";
import uploadRoutes from "../routes/uploadRoutes.js";
import djRoutes from "../routes/djRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlist", playlistRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dj", djRoutes);

// Static uploads folder (optional)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

export default app;
