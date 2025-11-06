import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { authMiddleware, adminOnly } from "../middleware/auth.js";
import dotenv from "dotenv";

// ✅ ensure .env variables are loaded inside this module too
dotenv.config();

const router = express.Router();

// ✅ Cloudinary configuration (log to confirm it's reading)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("🔑 Cloudinary API Key:", process.env.CLOUDINARY_API_KEY || "MISSING");

// ✅ Helper to create storage dynamically
const makeStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `soundset/${folder}`,
      resource_type: "auto", // supports images + audio
    },
  });

// Multer instances
const audioUpload = multer({ storage: makeStorage("audio") });
const imageUpload = multer({ storage: makeStorage("covers") });

// 🎵 Upload audio
router.post(
  "/audio",
  authMiddleware,
  adminOnly,
  audioUpload.single("file"),
  (req, res) => {
    if (!req.file?.path) {
      console.error("❌ Upload failed: No file path returned from Cloudinary");
      return res.status(500).json({ message: "Upload failed" });
    }
    console.log("✅ Uploaded audio:", req.file.path);
    res.json({ url: req.file.path });
  }
);

// 🖼 Upload cover
router.post(
  "/cover",
  authMiddleware,
  adminOnly,
  imageUpload.single("file"),
  (req, res) => {
    if (!req.file?.path) {
      console.error("❌ Upload failed: No file path returned from Cloudinary");
      return res.status(500).json({ message: "Upload failed" });
    }
    console.log("✅ Uploaded cover:", req.file.path);
    res.json({ url: req.file.path });
  }
);

export default router;
