// index.js — ONLY place that loads dotenv

import dotenv from "dotenv";
dotenv.config(); // Loads .env normally

import mongoose from "mongoose";
import app from "./server.js";

const MONGO = process.env.MONGO_URI;

mongoose
  .connect(MONGO)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
