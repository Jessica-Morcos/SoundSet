import express from "express";
import PlayHistory from "../models/PlayHistory.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ✅ Log a song play
router.post("/log", authMiddleware, async (req, res) => {
  const { songId } = req.body;
  const entry = await PlayHistory.create({ user: req.user._id, song: songId });
  res.status(201).json(entry);
});

// ✅ Get play frequency (per song)
router.get("/frequency", authMiddleware, async (req, res) => {
  const data = await PlayHistory.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: "$song", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "songs",
        localField: "_id",
        foreignField: "_id",
        as: "songInfo",
      },
    },
  ]);
  res.json(data);
});

// ✅ Most played artists
router.get("/artist", authMiddleware, async (req, res) => {
  const data = await PlayHistory.aggregate([
    { $match: { user: req.user._id } },
    {
      $lookup: {
        from: "songs",
        localField: "song",
        foreignField: "_id",
        as: "songInfo",
      },
    },
    { $unwind: "$songInfo" },
    {
      $group: {
        _id: "$songInfo.artist",
        plays: { $sum: 1 },
      },
    },
    { $sort: { plays: -1 } },
  ]);
  res.json(data);
});

// ✅ Most played genres
router.get("/genre", authMiddleware, async (req, res) => {
  const data = await PlayHistory.aggregate([
    { $match: { user: req.user._id } },
    {
      $lookup: {
        from: "songs",
        localField: "song",
        foreignField: "_id",
        as: "songInfo",
      },
    },
    { $unwind: "$songInfo" },
    {
      $group: {
        _id: "$songInfo.genre",
        plays: { $sum: 1 },
      },
    },
    { $sort: { plays: -1 } },
  ]);
  res.json(data);
});

export default router;
